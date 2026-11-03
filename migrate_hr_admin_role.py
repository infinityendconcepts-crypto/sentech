"""
Sentech HR Admin Role Migration
================================
Run this on your hosting server to:
1. Add the hr_admin role
2. Assign it to Sandisiwe
Does NOT modify any other data.

Usage:
  pip install pymongo
  python migrate_hr_admin_role.py --mongo-url "mongodb://localhost:27017" --db-name "sentech_db"
"""

import argparse
import sys
from datetime import datetime, timezone

try:
    import pymongo
except ImportError:
    print("ERROR: pymongo not installed. Run: pip install pymongo")
    sys.exit(1)


def run(mongo_url, db_name):
    print(f"\n=== HR Admin Role Migration ===")
    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]

    # 1. Create hr_admin role (upsert — safe to run multiple times)
    hr_admin_role = {
        "name": "hr_admin",
        "description": "HR Administrator - can give final approval on training applications and has all manager permissions",
        "permissions": {
            "applications": ["create", "read", "update", "delete"],
            "training_applications": ["create", "read", "update", "delete", "final_approve"],
            "tasks": ["create", "read", "update", "delete"],
            "tickets": ["create", "read", "update", "delete"],
            "users": ["read"],
            "settings": ["read"],
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.roles.update_one({"name": "hr_admin"}, {"$set": hr_admin_role}, upsert=True)
    print("  [OK] hr_admin role created/updated")

    # 2. Assign hr_admin to Sandisiwe (replace manager role)
    result = db.users.update_one(
        {"email": "jingisas@sentech.co.za"},
        {"$set": {"roles": ["hr_admin"]}}
    )
    if result.modified_count:
        print("  [OK] Sandisiwe (jingisas@sentech.co.za) assigned hr_admin role")
    else:
        u = db.users.find_one({"email": "jingisas@sentech.co.za"}, {"roles": 1})
        if u:
            print(f"  [OK] Sandisiwe already has roles: {u.get('roles')}")
        else:
            print("  [WARN] Sandisiwe (jingisas@sentech.co.za) not found in database")

    client.close()
    print("\n  Done! The hr_admin role is ready.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add HR Admin role to Sentech")
    parser.add_argument("--mongo-url", required=True, help="MongoDB connection string")
    parser.add_argument("--db-name", required=True, help="Database name")
    args = parser.parse_args()
    run(args.mongo_url, args.db_name)
