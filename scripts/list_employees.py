import sqlite3
import os

DB = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'db.sqlite3')

def list_employees():
    if not os.path.exists(DB):
        print('DB not found:', DB)
        return
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    try:
        cur.execute("PRAGMA table_info(core_employee);")
        cols = [r[1] for r in cur.fetchall()]
        print('Columns:', cols)
        cur.execute('SELECT id, email, role, status, is_superuser, is_staff, company_id, first_name, last_name, date_created FROM core_employee;')
        rows = cur.fetchall()
        if not rows:
            print('No employees found')
            return
        for r in rows:
            print(dict(zip(['id','email','role','status','is_superuser','is_staff','company_id','first_name','last_name','date_created'], r)))
    except Exception as e:
        print('Error querying DB:', e)
    finally:
        conn.close()

if __name__ == '__main__':
    list_employees()
