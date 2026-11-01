"""
Sentech User Data Migration Script
===================================
Run this script on your hosting server to populate missing user data
from the 3 Excel files (place them in the same directory as this script).

Usage:
  pip install openpyxl pymongo
  python migrate_user_data.py --mongo-url "mongodb://your_production_url" --db-name "your_db_name"

Required Excel files in the same directory:
  - 4 devisions Data.xlsx
  - 2nd Version.xlsx
  - Final List  18 March.xlsx
"""

import argparse
import os
import re
import sys
from datetime import date, datetime

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Run: pip install openpyxl")
    sys.exit(1)

try:
    import pymongo
except ImportError:
    print("ERROR: pymongo not installed. Run: pip install pymongo")
    sys.exit(1)


# ── Helpers ──

def convert_date(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', date_str)
    if m:
        day, month, year = m.groups()
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    m2 = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', date_str)
    if m2:
        return date_str
    return None


def calc_age_from_id(id_number):
    if not id_number or len(str(id_number)) < 6:
        return None
    try:
        s = str(id_number)
        yy, mm, dd = int(s[0:2]), int(s[2:4]), int(s[4:6])
        current_2digit = datetime.now().year % 100
        year = 1900 + yy if yy > current_2digit else 2000 + yy
        if mm < 1 or mm > 12:
            return None
        if dd < 1 or dd > 31:
            dd = min(dd, 28)
        birth = date(year, mm, dd)
        today = date.today()
        return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
    except Exception:
        return None


def calc_years_of_service(appt_date_str):
    if not appt_date_str:
        return None
    try:
        s = str(appt_date_str).strip()
        m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', s)
        if m:
            y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        else:
            m2 = re.match(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', s)
            if m2:
                d, mo, y = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
            else:
                return None
        start = date(y, mo, d)
        today = date.today()
        return today.year - start.year - ((today.month, today.day) < (start.month, start.day))
    except Exception:
        return None


def extract_id_str(val):
    if val is None:
        return None
    try:
        v = str(int(val)) if isinstance(val, (int, float)) else str(val).strip()
        return v if len(v) >= 10 and v.isdigit() else None
    except Exception:
        return None


def find_email_in_row(row_data):
    for val in row_data:
        if val and isinstance(val, str) and '@' in val and '.' in val:
            return val.strip()
    return None


# ── Excel Parser ──

def parse_excel_file(filepath):
    """Parse a single Excel file and return email-keyed and id-keyed lookups."""
    if not os.path.exists(filepath):
        print(f"  WARNING: File not found: {filepath}")
        return {}, {}

    print(f"  Parsing: {filepath}")
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    email_lookup = {}
    id_lookup = {}

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        all_rows = []
        for row in ws.iter_rows(values_only=True):
            all_rows.append(list(row))
            if len(all_rows) > 600:
                break

        if len(all_rows) < 2:
            continue

        # Find header row
        header_idx = 0
        for idx, row in enumerate(all_rows[:5]):
            row_str = ' '.join([str(v).upper() for v in row if v])
            if 'SURNAME' in row_str:
                header_idx = idx
                break

        headers = [str(h).strip().upper() if h else None for h in all_rows[header_idx]]

        def find_col(name):
            for i, h in enumerate(headers):
                if h and name.upper() in h.upper():
                    return i
            return -1

        surname_col = find_col('SURNAME')
        fullnames_col = find_col('FULLNAMES')
        id_col = find_col('ID NUMBER')
        race_col = find_col('RACE')
        gender_col = find_col('GENDER')
        start_col = find_col('START DATE')
        division_col = find_col('DIVISION')
        department_col = find_col('DEPARTMENT')
        position_col = find_col('POSITION')
        email_col = find_col('EMAIL')
        initials_col = find_col('INITIALS')
        level_col = find_col('LEVEL')
        ofo_major_col = find_col('OFO MAJOR')
        ofo_sub_col = find_col('OFO SUB')
        ofo_occ_col = find_col('OFO OCCUPATION')
        ofo_code_col = find_col('OFO CODE')

        sheet_count = 0
        for row_data in all_rows[header_idx + 1:]:
            surname = None
            if surname_col >= 0 and surname_col < len(row_data):
                surname = row_data[surname_col]
            if not surname or not str(surname).strip() or 'Reporting' in str(surname):
                continue
            surname = str(surname).strip()

            fullnames = ''
            if fullnames_col >= 0 and fullnames_col < len(row_data) and row_data[fullnames_col]:
                fullnames = str(row_data[fullnames_col]).strip()

            # Email
            email = None
            if email_col >= 0 and email_col < len(row_data) and row_data[email_col]:
                email = str(row_data[email_col]).strip()
                if '@' not in email:
                    email = None
            if not email:
                email = find_email_in_row(row_data)

            # ID number
            id_number = None
            if id_col >= 0 and id_col < len(row_data):
                id_number = extract_id_str(row_data[id_col])
            if not id_number:
                for val in row_data:
                    v = extract_id_str(val)
                    if v and len(v) == 13:
                        id_number = v
                        break

            # Other fields
            def get_col_val(col_idx):
                if col_idx >= 0 and col_idx < len(row_data) and row_data[col_idx]:
                    return str(row_data[col_idx]).strip()
                return None

            # Scan overflow columns for race/gender/start_date
            race = get_col_val(race_col)
            if not race:
                for val in row_data:
                    if val and str(val).strip() in ('Black', 'White', 'Coloured', 'Indian/Asian'):
                        race = str(val).strip()
                        break

            gender = get_col_val(gender_col)
            if not gender:
                for val in row_data:
                    if val and str(val).strip() in ('Male', 'Female'):
                        gender = str(val).strip()
                        break

            start_date = get_col_val(start_col)
            if not start_date:
                for val in row_data:
                    if val and isinstance(val, str) and re.match(r'^\d{2}\.\d{2}\.\d{4}$', val.strip()):
                        start_date = val.strip()
                        break

            emp = {
                'surname': surname,
                'fullnames': fullnames,
                'id_number': id_number,
                'race': race,
                'gender': gender,
                'start_date': start_date,
                'division': get_col_val(division_col),
                'department': get_col_val(department_col),
                'position': get_col_val(position_col),
                'initials': get_col_val(initials_col),
                'level': get_col_val(level_col),
                'ofo_major_group': get_col_val(ofo_major_col),
                'ofo_sub_major_group': get_col_val(ofo_sub_col),
                'ofo_occupation': get_col_val(ofo_occ_col),
                'ofo_code': get_col_val(ofo_code_col),
            }

            if email:
                email_lower = email.lower().strip()
                if email_lower not in email_lookup:
                    email_lookup[email_lower] = emp
                else:
                    for k, v in emp.items():
                        if v and not email_lookup[email_lower].get(k):
                            email_lookup[email_lower][k] = v
                sheet_count += 1

            if id_number:
                if id_number not in id_lookup:
                    id_lookup[id_number] = emp
                else:
                    for k, v in emp.items():
                        if v and not id_lookup[id_number].get(k):
                            id_lookup[id_number][k] = v

        print(f"    Sheet '{sheet_name}': {sheet_count} employees with email")

    wb.close()
    return email_lookup, id_lookup


# ── Main Migration ──

def run_migration(mongo_url, db_name):
    print("\n=== Sentech User Data Migration ===\n")

    # Step 1: Parse all Excel files
    excel_files = [
        "Final List  18 March.xlsx",
        "2nd Version.xlsx",
        "4 devisions Data.xlsx",
    ]

    all_by_email = {}
    all_by_id = {}

    for f in excel_files:
        by_email, by_id = parse_excel_file(f)
        for k, v in by_email.items():
            if k not in all_by_email:
                all_by_email[k] = v
            else:
                for fk, fv in v.items():
                    if fv and not all_by_email[k].get(fk):
                        all_by_email[k][fk] = fv
        for k, v in by_id.items():
            if k not in all_by_id:
                all_by_id[k] = v
            else:
                for fk, fv in v.items():
                    if fv and not all_by_id[k].get(fk):
                        all_by_id[k][fk] = fv

    print(f"\nTotal unique employees by email: {len(all_by_email)}")
    print(f"Total unique employees by ID: {len(all_by_id)}")

    # Step 2: Connect to MongoDB
    print(f"\nConnecting to MongoDB...")
    client = pymongo.MongoClient(mongo_url)
    db = client[db_name]
    total_users = db.users.count_documents({})
    print(f"Users in database: {total_users}")

    # Step 3: Update users
    updated = 0
    matched = 0

    for user in db.users.find({}):
        user_email = (user.get('email') or '').lower().strip()
        user_id = str(user.get('id_number') or '').strip()

        # Match by email first, then by ID
        emp = all_by_email.get(user_email)
        if not emp and user_id:
            emp = all_by_id.get(user_id)

        update = {}

        # Fill name (from fullnames)
        if (not user.get('name') or user.get('name') == '') and emp and emp.get('fullnames'):
            update['name'] = emp['fullnames']
        elif not user.get('name') or user.get('name') == '':
            # Try to extract from full_name
            full_name = (user.get('full_name') or '').strip()
            surname = (user.get('surname') or '').strip()
            if full_name and surname and full_name != surname:
                parts = full_name.rsplit(surname, 1)
                name = parts[0].strip() if parts[0].strip() else full_name
                if name and name != full_name:
                    update['name'] = name
            elif full_name:
                parts = full_name.strip().split()
                if len(parts) >= 2:
                    update['name'] = ' '.join(parts[:-1])
                    if not user.get('surname'):
                        update['surname'] = parts[-1]

        if emp:
            matched += 1

            if (not user.get('surname') or user.get('surname') == '') and emp.get('surname'):
                update['surname'] = emp['surname']
            if (not user.get('full_name') or user.get('full_name') == '') and emp.get('fullnames') and emp.get('surname'):
                update['full_name'] = f"{emp['fullnames']} {emp['surname']}"
            if (not user.get('id_number') or user.get('id_number') in ('', None)) and emp.get('id_number'):
                update['id_number'] = emp['id_number']
            if (not user.get('gender') or user.get('gender') in ('', None)) and emp.get('gender'):
                update['gender'] = emp['gender']
            if (not user.get('race') or user.get('race') in ('', None)) and emp.get('race'):
                update['race'] = emp['race']
            if not user.get('date_of_appointment') or user.get('date_of_appointment') in ('', None):
                converted = convert_date(emp.get('start_date'))
                if converted:
                    update['date_of_appointment'] = converted
            if not user.get('start_date') or user.get('start_date') in ('', None):
                converted = convert_date(emp.get('start_date'))
                if converted:
                    update['start_date'] = converted
            if (not user.get('division') or user.get('division') in ('', None)) and emp.get('division'):
                update['division'] = emp['division']
            if (not user.get('department') or user.get('department') in ('', None)) and emp.get('department'):
                update['department'] = emp['department']
            if (not user.get('position') or user.get('position') in ('', None)) and emp.get('position'):
                update['position'] = emp['position']
            if (not user.get('level') or user.get('level') in ('', None)) and emp.get('level'):
                update['level'] = emp['level']
            if (not user.get('ofo_code') or user.get('ofo_code') in ('', None)) and emp.get('ofo_code'):
                update['ofo_code'] = emp['ofo_code']
            if (not user.get('ofo_major_group') or user.get('ofo_major_group') in ('', None)) and emp.get('ofo_major_group'):
                update['ofo_major_group'] = emp['ofo_major_group']
            if (not user.get('ofo_sub_major_group') or user.get('ofo_sub_major_group') in ('', None)) and emp.get('ofo_sub_major_group'):
                update['ofo_sub_major_group'] = emp['ofo_sub_major_group']
            if (not user.get('ofo_occupation') or user.get('ofo_occupation') in ('', None)) and emp.get('ofo_occupation'):
                update['ofo_occupation'] = emp['ofo_occupation']

        # Calculate age from ID
        final_id = update.get('id_number') or user.get('id_number')
        if final_id:
            age = calc_age_from_id(str(final_id))
            if age and age > 0 and age < 100:
                update['age'] = age

        # Calculate years of service
        final_appt = update.get('date_of_appointment') or user.get('date_of_appointment') or update.get('start_date') or user.get('start_date')
        if final_appt:
            yrs = calc_years_of_service(final_appt)
            if yrs is not None and yrs >= 0:
                update['years_of_service'] = yrs

        if update:
            db.users.update_one({"_id": user["_id"]}, {"$set": update})
            updated += 1

    # Step 4: Print summary
    has_name = db.users.count_documents({"name": {"$exists": True, "$nin": [None, ""]}})
    has_surname = db.users.count_documents({"surname": {"$exists": True, "$nin": [None, ""]}})
    has_id = db.users.count_documents({"id_number": {"$exists": True, "$nin": [None, ""]}})
    has_gender = db.users.count_documents({"gender": {"$exists": True, "$nin": [None, ""]}})
    has_race = db.users.count_documents({"race": {"$exists": True, "$nin": [None, ""]}})
    has_appt = db.users.count_documents({"date_of_appointment": {"$exists": True, "$nin": [None, ""]}})
    has_ofo = db.users.count_documents({"ofo_code": {"$exists": True, "$nin": [None, ""]}})
    has_age = db.users.count_documents({"age": {"$exists": True, "$ne": None}})
    has_yrs = db.users.count_documents({"years_of_service": {"$exists": True, "$ne": None}})

    print(f"\n{'='*55}")
    print(f"  MIGRATION COMPLETE")
    print(f"{'='*55}")
    print(f"  Matched from Excel: {matched}")
    print(f"  Users updated:      {updated}")
    print(f"{'='*55}")
    print(f"  Name:               {has_name}/{total_users}")
    print(f"  Surname:            {has_surname}/{total_users}")
    print(f"  ID Number:          {has_id}/{total_users}")
    print(f"  Gender:             {has_gender}/{total_users}")
    print(f"  Race:               {has_race}/{total_users}")
    print(f"  Date of Appointment:{has_appt}/{total_users}")
    print(f"  OFO Code:           {has_ofo}/{total_users}")
    print(f"  Age:                {has_age}/{total_users}")
    print(f"  Years of Service:   {has_yrs}/{total_users}")
    print(f"{'='*55}")

    client.close()
    print("\nDone! You can run this script again safely - it only fills missing fields.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentech User Data Migration")
    parser.add_argument("--mongo-url", required=True, help="MongoDB connection string")
    parser.add_argument("--db-name", required=True, help="Database name")
    args = parser.parse_args()
    run_migration(args.mongo_url, args.db_name)
