"""
Sentech Full Database Restore Script
=====================================
This script restores the entire database from the exported JSON files.

Usage:
  pip install pymongo
  python restore_database.py --mongo-url "mongodb://your_host:27017" --db-name "your_db_name"

Place this script in the same folder as the db_export/ directory.
"""

import argparse
import json
import os
import sys

try:
    from bson import ObjectId
    import pymongo
except ImportError:
    print("ERROR: pymongo not installed. Run: pip install pymongo")
    sys.exit(1)


def restore(mongo_url, db_name, export_dir="db_export"):
    if not os.path.exists(export_dir):
        print(f"ERROR: Export directory '{export_dir}' not found.")
        print(f"Make sure the db_export/ folder is in the same directory as this script.")
        sys.exit(1)

    print(f"\n=== Sentech Database Restore ===")
    print(f"MongoDB URL: {mongo_url[:30]}...")
    print(f"Database:    {db_name}")
    print(f"Source:      {export_dir}/\n")

    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]

    json_files = [f for f in os.listdir(export_dir) if f.endswith('.json')]
    print(f"Found {len(json_files)} collection files to restore.\n")

    for filename in sorted(json_files):
        coll_name = filename.replace('.json', '')
        filepath = os.path.join(export_dir, filename)

        with open(filepath, 'r') as f:
            docs = json.load(f)

        if not docs:
            print(f"  {coll_name}: 0 docs (skipped)")
            continue

        # Convert _id strings back to ObjectId where possible
        for doc in docs:
            if '_id' in doc and isinstance(doc['_id'], str) and len(doc['_id']) == 24:
                try:
                    doc['_id'] = ObjectId(doc['_id'])
                except Exception:
                    pass

        # Drop existing collection and insert fresh data
        db[coll_name].drop()
        db[coll_name].insert_many(docs)
        print(f"  {coll_name}: {len(docs)} docs restored")

    client.close()
    print(f"\n{'='*45}")
    print(f"  RESTORE COMPLETE - {len(json_files)} collections")
    print(f"{'='*45}")
    print(f"\nYour database is now an exact copy of the Emergent environment.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentech Database Restore")
    parser.add_argument("--mongo-url", required=True, help="MongoDB connection string (e.g. mongodb://localhost:27017 or mongodb+srv://user:pass@cluster.mongodb.net)")
    parser.add_argument("--db-name", required=True, help="Database name to restore into")
    parser.add_argument("--export-dir", default="db_export", help="Path to db_export folder (default: db_export)")
    args = parser.parse_args()

    print(f"\n⚠️  WARNING: This will DROP and REPLACE all collections in '{args.db_name}'.")
    confirm = input("Type 'yes' to continue: ")
    if confirm.strip().lower() != 'yes':
        print("Aborted.")
        sys.exit(0)

    restore(args.mongo_url, args.db_name, args.export_dir)
