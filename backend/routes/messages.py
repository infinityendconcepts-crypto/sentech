from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from models.message import Message, MessageCreate, Conversation, ConversationCreate, ConversationUpdate

router = APIRouter(prefix="/messages", tags=["Messages"])

db = None

def set_db(database):
    global db
    db = database

async def get_current_user(credentials):
    pass

# Conversations
@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participant_ids": current_user["id"], "is_archived": False},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    # Enrich with participant info
    for conv in conversations:
        participants = await db.users.find(
            {"id": {"$in": conv["participant_ids"]}},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1, "avatar_url": 1}
        ).to_list(100)
        conv["participants"] = participants
        conv["unread"] = conv.get("unread_count", {}).get(current_user["id"], 0)
    
    return conversations

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get participants
    participants = await db.users.find(
        {"id": {"$in": conversation["participant_ids"]}},
        {"_id": 0, "id": 1, "full_name": 1, "email": 1, "avatar_url": 1}
    ).to_list(100)
    conversation["participants"] = participants
    
    return conversation

@router.post("/conversations")
async def create_conversation(conv_data: ConversationCreate, current_user: dict = Depends(get_current_user)):
    # For direct conversations, check if one already exists
    if conv_data.type == "direct" and len(conv_data.participant_ids) == 1:
        other_user_id = conv_data.participant_ids[0]
        existing = await db.conversations.find_one({
            "type": "direct",
            "participant_ids": {"$all": [current_user["id"], other_user_id], "$size": 2}
        }, {"_id": 0})
        if existing:
            return existing
    
    # Add current user to participants if not present
    participant_ids = list(set(conv_data.participant_ids + [current_user["id"]]))
    
    conversation = Conversation(
        **conv_data.model_dump(exclude={"participant_ids"}),
        participant_ids=participant_ids,
        created_by=current_user["id"]
    )
    conv_dict = conversation.model_dump()
    conv_dict['created_at'] = conv_dict['created_at'].isoformat()
    conv_dict['updated_at'] = conv_dict['updated_at'].isoformat()
    if conv_dict.get('last_message_at'):
        conv_dict['last_message_at'] = conv_dict['last_message_at'].isoformat()
    
    await db.conversations.insert_one({**conv_dict})
    return conversation

@router.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, update_data: ConversationUpdate, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.conversations.update_one({"id": conversation_id}, {"$set": update_dict})
    return {"message": "Conversation updated successfully"}

# Messages
@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    before: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"conversation_id": conversation_id, "is_deleted": False}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": current_user["id"]},
            "is_read": False
        },
        {
            "$set": {"is_read": True},
            "$addToSet": {"read_by": current_user["id"]}
        }
    )
    
    # Reset unread count for this user
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user['id']}": 0}}
    )
    
    return list(reversed(messages))

@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user["id"],
        content=message_data.content,
        message_type=message_data.message_type,
        attachments=message_data.attachments
    )
    msg_dict = message.model_dump()
    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
    msg_dict['updated_at'] = msg_dict['updated_at'].isoformat()
    
    await db.messages.insert_one({**msg_dict})
    
    # Update conversation
    unread_update = {}
    for participant_id in conversation["participant_ids"]:
        if participant_id != current_user["id"]:
            current_unread = conversation.get("unread_count", {}).get(participant_id, 0)
            unread_update[f"unread_count.{participant_id}"] = current_unread + 1
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message_id": message.id,
                "last_message_at": msg_dict['created_at'],
                "updated_at": msg_dict['created_at'],
                **unread_update
            }
        }
    )
    
    return message

@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: dict = Depends(get_current_user)):
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message["sender_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the sender can delete this message")
    
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"is_deleted": True, "content": "This message was deleted"}}
    )
    return {"message": "Message deleted successfully"}

@router.get("/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participant_ids": current_user["id"]},
        {"_id": 0, "unread_count": 1}
    ).to_list(1000)
    
    total = sum(conv.get("unread_count", {}).get(current_user["id"], 0) for conv in conversations)
    return {"unread_count": total}
