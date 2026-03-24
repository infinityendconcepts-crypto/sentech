"""Messages Router - Conversations, Messages, Group messaging, Contactable users"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime, timezone

from routers import (
    db, get_current_user, generate_uuid, is_admin_user, logger,
)

router = APIRouter(prefix="/api", tags=["messages"])


def current_time():
    return datetime.now(timezone.utc)


# ── Models ──

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    conversation_id: str
    sender_id: str
    content: str
    message_type: str = "text"
    attachments: List[Dict[str, str]] = []
    is_read: bool = False
    read_by: List[str] = []
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)


class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    content: str
    message_type: str = "text"
    attachments: List[Dict[str, str]] = []


class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    name: Optional[str] = None
    type: str = "direct"
    participant_ids: List[str]
    created_by: str
    last_message_id: Optional[str] = None
    last_message_at: Optional[datetime] = None
    is_archived: bool = False
    unread_count: Dict[str, int] = {}
    created_at: datetime = Field(default_factory=current_time)
    updated_at: datetime = Field(default_factory=current_time)


class ConversationCreate(BaseModel):
    name: Optional[str] = None
    type: str = "direct"
    participant_ids: List[str]


# ── Helper ──

async def _create_message_notifications(conversation, sender_id, sender_name, content):
    for pid in conversation.get("participant_ids", []):
        if pid != sender_id:
            notif = {
                "id": generate_uuid(),
                "user_id": pid,
                "type": "new_message",
                "title": f"New message from {sender_name}",
                "message": content[:100] + ("..." if len(content) > 100 else ""),
                "reference_id": conversation["id"],
                "reference_type": "conversation",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.notifications.insert_one({**notif})


# ── Routes ──

@router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participant_ids": current_user["id"], "is_archived": False},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)

    for conv in conversations:
        participants = await db.users.find(
            {"id": {"$in": conv["participant_ids"]}},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1}
        ).to_list(100)
        conv["participants"] = participants
        conv["unread"] = conv.get("unread_count", {}).get(current_user["id"], 0)

    return conversations


@router.get("/messages/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    participants = await db.users.find(
        {"id": {"$in": conversation["participant_ids"]}},
        {"_id": 0, "id": 1, "full_name": 1, "email": 1}
    ).to_list(100)
    conversation["participants"] = participants

    return conversation


@router.post("/messages/conversations")
async def create_conversation(conv_data: ConversationCreate, current_user: dict = Depends(get_current_user)):
    if conv_data.type == "direct" and len(conv_data.participant_ids) == 1:
        other_user_id = conv_data.participant_ids[0]
        existing = await db.conversations.find_one({
            "type": "direct",
            "participant_ids": {"$all": [current_user["id"], other_user_id], "$size": 2}
        }, {"_id": 0})
        if existing:
            return existing

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


@router.get("/messages/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user["id"] not in conversation["participant_ids"]:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = await db.messages.find(
        {"conversation_id": conversation_id, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)

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

    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user['id']}": 0}}
    )

    return list(reversed(messages))


@router.post("/messages/conversations/{conversation_id}/messages")
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

    await _create_message_notifications(conversation, current_user["id"], current_user.get("full_name", "Unknown"), message_data.content)

    return message


@router.get("/messages/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participant_ids": current_user["id"]},
        {"_id": 0, "unread_count": 1}
    ).to_list(1000)

    total = sum(conv.get("unread_count", {}).get(current_user["id"], 0) for conv in conversations)
    return {"unread_count": total}


@router.get("/messages/contactable-users")
async def get_contactable_users(current_user: dict = Depends(get_current_user)):
    """Returns users that the current user can message - admins see all, employees see division/subgroup members"""
    is_admin = "admin" in current_user.get("roles", []) or "super_admin" in current_user.get("roles", [])
    if is_admin:
        users = await db.users.find({"is_active": True, "id": {"$ne": current_user["id"]}}, {"_id": 0, "password_hash": 0}).to_list(1000)
        return users
    user_division = current_user.get("division", "")
    contactable_ids = set()
    if user_division:
        div_users = await db.users.find({"division": user_division, "is_active": True}, {"_id": 0, "id": 1}).to_list(1000)
        contactable_ids.update(u["id"] for u in div_users)
        subgroups = await db.subgroups.find({"division_name": user_division}, {"_id": 0}).to_list(100)
        for sg in subgroups:
            member_ids = [m.get("user_id") for m in sg.get("members", [])]
            if current_user["id"] in member_ids:
                contactable_ids.update(member_ids)
            if sg.get("leader_id"):
                contactable_ids.add(sg["leader_id"])
    contactable_ids.discard(current_user["id"])
    if not contactable_ids:
        return []
    users = await db.users.find({"id": {"$in": list(contactable_ids)}, "is_active": True}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@router.post("/messages/group-conversation")
async def create_group_conversation(body: dict, current_user: dict = Depends(get_current_user)):
    target_type = body.get("target_type")
    target_id = body.get("target_id")
    target_name = body.get("target_name", "")

    participant_ids = [current_user["id"]]
    conv_name = target_name

    if target_type == "division":
        users = await db.users.find({"division": target_name}, {"_id": 0, "id": 1}).to_list(500)
        participant_ids += [u["id"] for u in users if u["id"] != current_user["id"]]
        conv_name = f"Division: {target_name}"
    elif target_type == "subgroup":
        sg = await db.subgroups.find_one({"id": target_id}, {"_id": 0})
        if sg:
            participant_ids += [uid for uid in sg.get("member_user_ids", []) if uid != current_user["id"]]
            conv_name = f"Subgroup: {sg.get('name', '')}"
    elif target_type == "individual":
        participant_ids.append(target_id)
        other = await db.users.find_one({"id": target_id}, {"_id": 0, "full_name": 1})
        conv_name = other.get("full_name", "") if other else ""

    participant_ids = list(set(participant_ids))

    if target_type in ["division", "subgroup"]:
        existing = await db.conversations.find_one({
            "target_type": target_type,
            "target_id": target_id or target_name,
        }, {"_id": 0})
        if existing:
            participants = await db.users.find(
                {"id": {"$in": existing["participant_ids"]}},
                {"_id": 0, "id": 1, "full_name": 1, "email": 1}
            ).to_list(500)
            existing["participants"] = participants
            return existing
    elif target_type == "individual":
        existing = await db.conversations.find_one({
            "type": "direct",
            "participant_ids": {"$all": participant_ids, "$size": 2}
        }, {"_id": 0})
        if existing:
            participants = await db.users.find(
                {"id": {"$in": existing["participant_ids"]}},
                {"_id": 0, "id": 1, "full_name": 1, "email": 1}
            ).to_list(100)
            existing["participants"] = participants
            return existing

    now = datetime.now(timezone.utc).isoformat()
    conv = {
        "id": generate_uuid(),
        "type": "group" if target_type in ["division", "subgroup"] else "direct",
        "name": conv_name,
        "participant_ids": participant_ids,
        "target_type": target_type,
        "target_id": target_id or target_name,
        "created_by": current_user["id"],
        "last_message_at": now,
        "unread_count": {},
        "is_archived": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.conversations.insert_one({**conv})

    participants = await db.users.find(
        {"id": {"$in": participant_ids}},
        {"_id": 0, "id": 1, "full_name": 1, "email": 1}
    ).to_list(500)
    conv["participants"] = participants

    return conv
