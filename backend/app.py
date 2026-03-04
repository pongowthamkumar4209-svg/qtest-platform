import os, json, uuid, hashlib, subprocess, sys, threading, time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS
import sqlite3

app = Flask(__name__)

# Explicit CORS - wildcard + credentials is blocked by browsers
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://qtest-platform.vercel.app",
    os.environ.get("FRONTEND_URL", ""),
]
CORS(app,
     origins=[o for o in ALLOWED_ORIGINS if o],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Also handle preflight OPTIONS globally
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        if any(origin == o for o in ALLOWED_ORIGINS if o):
            resp = app.make_default_options_response()
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            return resp

# On Render, use /opt/render/project/data for persistent storage
# Locally, use the backend folder itself
_IS_RENDER = os.environ.get('RENDER', False)
_DATA_DIR = '/opt/render/project/data' if _IS_RENDER else os.path.dirname(__file__)
os.makedirs(_DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(_DATA_DIR, "qtest.db")
ATTACHMENTS_DIR = os.path.join(_DATA_DIR, "attachments")
RUN_LOGS_DIR = os.path.join(_DATA_DIR, "run_logs")
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)
os.makedirs(RUN_LOGS_DIR, exist_ok=True)

# ─── DB helpers ───────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ─── Init DB ──────────────────────────────────────────────────────────────────
def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'viewer',
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        last_login TEXT,
        reset_token TEXT,
        reset_token_expiry TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS requirements (
        id TEXT PRIMARY KEY,
        req_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'Functional',
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Draft',
        author TEXT,
        created_at TEXT,
        updated_at TEXT,
        parent_id TEXT,
        project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        tc_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'Manual',
        status TEXT DEFAULT 'Draft',
        priority TEXT DEFAULT 'Medium',
        author TEXT,
        created_at TEXT,
        updated_at TEXT,
        automation_code TEXT,
        automation_framework TEXT DEFAULT 'selenium',
        project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS test_steps (
        id TEXT PRIMARY KEY,
        test_case_id TEXT NOT NULL,
        step_number INTEGER,
        action TEXT NOT NULL,
        expected TEXT,
        actual TEXT,
        status TEXT DEFAULT 'Not Run',
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS req_test_coverage (
        id TEXT PRIMARY KEY,
        requirement_id TEXT NOT NULL,
        test_case_id TEXT NOT NULL,
        FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE,
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_suites (
        id TEXT PRIMARY KEY,
        suite_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT,
        created_at TEXT,
        project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS test_instances (
        id TEXT PRIMARY KEY,
        instance_id TEXT UNIQUE,
        suite_id TEXT NOT NULL,
        test_case_id TEXT NOT NULL,
        status TEXT DEFAULT 'Not Run',
        assigned_to TEXT,
        executed_by TEXT,
        executed_at TEXT,
        duration_ms INTEGER,
        notes TEXT,
        FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
    );

    CREATE TABLE IF NOT EXISTS step_results (
        id TEXT PRIMARY KEY,
        instance_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        status TEXT DEFAULT 'Not Run',
        actual TEXT,
        notes TEXT,
        FOREIGN KEY (instance_id) REFERENCES test_instances(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS defects (
        id TEXT PRIMARY KEY,
        defect_id TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'New',
        priority TEXT DEFAULT 'Medium',
        severity TEXT DEFAULT 'Medium',
        category TEXT,
        reported_by TEXT,
        assigned_to TEXT,
        created_at TEXT,
        updated_at TEXT,
        project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS defect_links (
        id TEXT PRIMARY KEY,
        defect_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        FOREIGN KEY (defect_id) REFERENCES defects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        created_at TEXT,
        expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS req_traceability (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        link_type TEXT DEFAULT 'covers',
        FOREIGN KEY (source_id) REFERENCES requirements(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES requirements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_by TEXT,
        uploaded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS execution_runs (
        id TEXT PRIMARY KEY,
        run_id TEXT UNIQUE,
        instance_id TEXT NOT NULL,
        status TEXT NOT NULL,
        executed_by TEXT,
        executed_at TEXT,
        duration_ms INTEGER,
        log_file TEXT,
        framework TEXT,
        FOREIGN KEY (instance_id) REFERENCES test_instances(id) ON DELETE CASCADE
    );
    """)

    # Seed admin user
    admin_id = str(uuid.uuid4())
    pw_hash = hashlib.sha256("Admin@123".encode()).hexdigest()
    try:
        c.execute("""INSERT OR IGNORE INTO users (id,username,email,password_hash,full_name,role,created_at)
                     VALUES (?,?,?,?,?,?,?)""",
                  (admin_id,'admin','admin@qtest.local',pw_hash,'Administrator','admin',
                   datetime.utcnow().isoformat()))
    except: pass

    # Seed default project
    proj_id = str(uuid.uuid4())
    try:
        c.execute("""INSERT OR IGNORE INTO projects (id,name,description,created_by,created_at)
                     VALUES (?,?,?,?,?)""",
                  (proj_id,'Default Project','Default project','admin',datetime.utcnow().isoformat()))
    except: pass

    conn.commit()
    conn.close()
    print("[DB] Initialized successfully")

# ─── Auth ─────────────────────────────────────────────────────────────────────
# Sessions stored in DB so they survive Render redeploys

def get_session(req):
    token = req.headers.get('Authorization','').replace('Bearer ','').strip()
    if not token:
        return None
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM sessions WHERE token=? AND (expires_at IS NULL OR expires_at > ?)",
        (token, datetime.utcnow().isoformat())
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def create_session(user):
    token = str(uuid.uuid4())
    expires = (datetime.utcnow() + timedelta(days=7)).isoformat()
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO sessions (token,user_id,username,role,full_name,created_at,expires_at) VALUES (?,?,?,?,?,?,?)",
        (token, user['id'], user['username'], user['role'], user['full_name'],
         datetime.utcnow().isoformat(), expires)
    )
    conn.commit()
    conn.close()
    return token

def delete_session(token):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token=?", (token,))
    conn.commit()
    conn.close()

def require_auth(req):
    s = get_session(req)
    if not s: return None, jsonify({'error':'Unauthorized'}), 401
    return s, None, None

def require_admin(req):
    s = get_session(req)
    if not s: return None, jsonify({'error':'Unauthorized'}), 401
    if s['role'] != 'admin': return None, jsonify({'error':'Admin access required'}), 403
    return s, None, None

# Role hierarchy: viewer < tester < lead < admin
ROLE_LEVEL = {'viewer': 1, 'tester': 2, 'lead': 3, 'admin': 4}

def require_role(req, min_role):
    """Require at least min_role level."""
    s = get_session(req)
    if not s: return None, jsonify({'error': 'Unauthorized'}), 401
    if ROLE_LEVEL.get(s['role'], 0) < ROLE_LEVEL.get(min_role, 99):
        return None, jsonify({'error': f'Requires {min_role} role or higher'}), 403
    return s, None, None

@app.route('/api/health')
def health():
    return jsonify({'status':'ok','service':'QTest Platform'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    pw_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    conn = get_db()
    user = row_to_dict(conn.execute(
        "SELECT * FROM users WHERE username=? AND password_hash=? AND is_active=1",
        (data['username'], pw_hash)).fetchone())
    if not user:
        conn.close()
        return jsonify({'error':'Invalid username or password'}), 401
    conn.execute("UPDATE users SET last_login=? WHERE id=?",
                 (datetime.utcnow().isoformat(), user['id']))
    conn.commit()
    conn.close()
    token = create_session(user)
    return jsonify({'token':token,'username':user['username'],
                    'role':user['role'],'full_name':user['full_name']})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username=? OR email=?",
                             (data['username'],data['email'])).fetchone()
    if existing:
        conn.close()
        return jsonify({'error':'Username or email already exists'}), 409
    uid = str(uuid.uuid4())
    pw_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    conn.execute("""INSERT INTO users (id,username,email,password_hash,full_name,role,created_at)
                    VALUES (?,?,?,?,?,?,?)""",
                 (uid,data['username'],data['email'],pw_hash,
                  data.get('full_name',''),'viewer',datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({'message':'Account created. You have viewer access.'})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization','').replace('Bearer ','').strip()
    delete_session(token)
    return jsonify({'message':'Logged out'})

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (data['email'],)).fetchone()
    if not user:
        conn.close()
        return jsonify({'message':'If email exists, reset token sent'})
    token = str(uuid.uuid4())[:8].upper()
    expiry = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    conn.execute("UPDATE users SET reset_token=?, reset_token_expiry=? WHERE email=?",
                 (token, expiry, data['email']))
    conn.commit()
    conn.close()
    return jsonify({'message':'Reset token generated', 'token': token})  # In prod, email this

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    conn = get_db()
    user = row_to_dict(conn.execute(
        "SELECT * FROM users WHERE reset_token=?", (data['token'],)).fetchone())
    if not user or datetime.fromisoformat(user['reset_token_expiry']) < datetime.utcnow():
        conn.close()
        return jsonify({'error':'Invalid or expired token'}), 400
    pw_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    conn.execute("UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expiry=NULL WHERE id=?",
                 (pw_hash, user['id']))
    conn.commit()
    conn.close()
    return jsonify({'message':'Password reset successfully'})

@app.route('/api/auth/me')
def me():
    s = get_session(request)
    if not s: return jsonify({'error':'Unauthorized'}), 401
    return jsonify(s)

# ─── Users (Admin) ────────────────────────────────────────────────────────────
@app.route('/api/admin/users')
def list_users():
    s, err, code = require_admin(request)
    if err: return err, code
    conn = get_db()
    users = rows_to_list(conn.execute(
        "SELECT id,username,email,full_name,role,is_active,created_at,last_login FROM users").fetchall())
    conn.close()
    return jsonify(users)

@app.route('/api/admin/users/<uid>', methods=['PUT'])
def update_user(uid):
    s, err, code = require_admin(request)
    if err: return err, code
    data = request.json
    conn = get_db()
    if 'role' in data:
        conn.execute("UPDATE users SET role=? WHERE id=?", (data['role'], uid))
    if 'is_active' in data:
        conn.execute("UPDATE users SET is_active=? WHERE id=?", (data['is_active'], uid))
    if 'full_name' in data:
        conn.execute("UPDATE users SET full_name=? WHERE id=?", (data['full_name'], uid))
    conn.commit()
    conn.close()
    return jsonify({'message':'Updated'})

@app.route('/api/admin/users/<uid>', methods=['DELETE'])
def delete_user(uid):
    s, err, code = require_admin(request)
    if err: return err, code
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=? AND username != 'admin'", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'message':'Deleted'})

# ─── Projects ─────────────────────────────────────────────────────────────────
@app.route('/api/projects')
def list_projects():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    projects = rows_to_list(conn.execute("SELECT * FROM projects").fetchall())
    conn.close()
    return jsonify(projects)

# ─── Requirements ─────────────────────────────────────────────────────────────
def next_req_id(conn):
    count = conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0]
    return f"REQ-{count+1:04d}"

@app.route('/api/requirements')
def list_requirements():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    reqs = rows_to_list(conn.execute("SELECT * FROM requirements ORDER BY created_at DESC").fetchall())
    conn.close()
    return jsonify(reqs)

@app.route('/api/requirements', methods=['POST'])
def create_requirement():
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    rid = str(uuid.uuid4())
    req_id = next_req_id(conn)
    now = datetime.utcnow().isoformat()
    conn.execute("""INSERT INTO requirements (id,req_id,name,description,type,priority,status,author,created_at,updated_at,parent_id,project_id)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                 (rid, req_id, data['name'], data.get('description',''),
                  data.get('type','Functional'), data.get('priority','Medium'),
                  data.get('status','Draft'), s['username'], now, now,
                  data.get('parent_id'), data.get('project_id')))
    conn.commit()
    req = row_to_dict(conn.execute("SELECT * FROM requirements WHERE id=?", (rid,)).fetchone())
    conn.close()
    return jsonify(req), 201

@app.route('/api/requirements/<rid>', methods=['GET'])
def get_requirement(rid):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    req = row_to_dict(conn.execute("SELECT * FROM requirements WHERE id=?", (rid,)).fetchone())
    if not req: return jsonify({'error':'Not found'}), 404
    # coverage
    coverage = rows_to_list(conn.execute("""
        SELECT tc.* FROM test_cases tc
        JOIN req_test_coverage rtc ON tc.id = rtc.test_case_id
        WHERE rtc.requirement_id=?""", (rid,)).fetchall())
    # defects
    defects = rows_to_list(conn.execute("""
        SELECT d.* FROM defects d JOIN defect_links dl ON d.id=dl.defect_id
        WHERE dl.entity_type='requirement' AND dl.entity_id=?""", (rid,)).fetchall())
    req['coverage'] = coverage
    req['defects'] = defects
    conn.close()
    return jsonify(req)

@app.route('/api/requirements/<rid>', methods=['PUT'])
def update_requirement(rid):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    fields = ['name','description','type','priority','status','parent_id']
    sets = ', '.join(f"{f}=?" for f in fields if f in data)
    vals = [data[f] for f in fields if f in data]
    if sets:
        vals += [datetime.utcnow().isoformat(), rid]
        conn.execute(f"UPDATE requirements SET {sets}, updated_at=? WHERE id=?", vals)
        conn.commit()
    req = row_to_dict(conn.execute("SELECT * FROM requirements WHERE id=?", (rid,)).fetchone())
    conn.close()
    return jsonify(req)

@app.route('/api/requirements/<rid>', methods=['DELETE'])
def delete_requirement(rid):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    conn = get_db()
    conn.execute("DELETE FROM requirements WHERE id=?", (rid,))
    conn.commit()
    conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/requirements/<rid>/coverage', methods=['POST'])
def add_coverage(rid):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    cid = str(uuid.uuid4())
    try:
        conn.execute("INSERT INTO req_test_coverage (id,requirement_id,test_case_id) VALUES (?,?,?)",
                     (cid, rid, data['test_case_id']))
        conn.commit()
    except: pass
    conn.close()
    return jsonify({'message':'Coverage added'})

# ─── Test Cases ───────────────────────────────────────────────────────────────
def next_tc_id(conn):
    count = conn.execute("SELECT COUNT(*) FROM test_cases").fetchone()[0]
    return f"TC-{count+1:04d}"

@app.route('/api/testcases')
def list_testcases():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    tcs = rows_to_list(conn.execute("SELECT * FROM test_cases ORDER BY created_at DESC").fetchall())
    conn.close()
    return jsonify(tcs)

@app.route('/api/testcases', methods=['POST'])
def create_testcase():
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    tid = str(uuid.uuid4())
    tc_id = next_tc_id(conn)
    now = datetime.utcnow().isoformat()
    conn.execute("""INSERT INTO test_cases (id,tc_id,name,description,type,status,priority,author,created_at,updated_at,automation_code,automation_framework,project_id)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                 (tid, tc_id, data['name'], data.get('description',''),
                  data.get('type','Manual'), data.get('status','Draft'),
                  data.get('priority','Medium'), s['username'], now, now,
                  data.get('automation_code',''), data.get('automation_framework','selenium'),
                  data.get('project_id')))
    # steps
    for i, step in enumerate(data.get('steps', [])):
        sid = str(uuid.uuid4())
        conn.execute("INSERT INTO test_steps (id,test_case_id,step_number,action,expected) VALUES (?,?,?,?,?)",
                     (sid, tid, i+1, step['action'], step.get('expected','')))
    conn.commit()
    tc = row_to_dict(conn.execute("SELECT * FROM test_cases WHERE id=?", (tid,)).fetchone())
    tc['steps'] = rows_to_list(conn.execute("SELECT * FROM test_steps WHERE test_case_id=? ORDER BY step_number", (tid,)).fetchall())
    conn.close()
    return jsonify(tc), 201

@app.route('/api/testcases/<tid>', methods=['GET'])
def get_testcase(tid):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    tc = row_to_dict(conn.execute("SELECT * FROM test_cases WHERE id=?", (tid,)).fetchone())
    if not tc: return jsonify({'error':'Not found'}), 404
    tc['steps'] = rows_to_list(conn.execute("SELECT * FROM test_steps WHERE test_case_id=? ORDER BY step_number", (tid,)).fetchall())
    tc['requirements'] = rows_to_list(conn.execute("""
        SELECT r.* FROM requirements r JOIN req_test_coverage rtc ON r.id=rtc.requirement_id
        WHERE rtc.test_case_id=?""", (tid,)).fetchall())
    tc['defects'] = rows_to_list(conn.execute("""
        SELECT d.* FROM defects d JOIN defect_links dl ON d.id=dl.defect_id
        WHERE dl.entity_type='testcase' AND dl.entity_id=?""", (tid,)).fetchall())
    conn.close()
    return jsonify(tc)

@app.route('/api/testcases/<tid>', methods=['PUT'])
def update_testcase(tid):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    fields = ['name','description','type','status','priority','automation_code','automation_framework']
    sets = ', '.join(f"{f}=?" for f in fields if f in data)
    vals = [data[f] for f in fields if f in data]
    if sets:
        vals += [datetime.utcnow().isoformat(), tid]
        conn.execute(f"UPDATE test_cases SET {sets}, updated_at=? WHERE id=?", vals)
    # update steps
    if 'steps' in data:
        conn.execute("DELETE FROM test_steps WHERE test_case_id=?", (tid,))
        for i, step in enumerate(data['steps']):
            sid = str(uuid.uuid4())
            conn.execute("INSERT INTO test_steps (id,test_case_id,step_number,action,expected) VALUES (?,?,?,?,?)",
                         (sid, tid, i+1, step['action'], step.get('expected','')))
    conn.commit()
    tc = row_to_dict(conn.execute("SELECT * FROM test_cases WHERE id=?", (tid,)).fetchone())
    tc['steps'] = rows_to_list(conn.execute("SELECT * FROM test_steps WHERE test_case_id=? ORDER BY step_number", (tid,)).fetchall())
    conn.close()
    return jsonify(tc)

@app.route('/api/testcases/<tid>', methods=['DELETE'])
def delete_testcase(tid):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    conn = get_db()
    conn.execute("DELETE FROM test_cases WHERE id=?", (tid,))
    conn.commit()
    conn.close()
    return jsonify({'message':'Deleted'})

# ─── Test Suites ──────────────────────────────────────────────────────────────
def next_suite_id(conn):
    count = conn.execute("SELECT COUNT(*) FROM test_suites").fetchone()[0]
    return f"TS-{count+1:04d}"

@app.route('/api/testsuites')
def list_suites():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    suites = rows_to_list(conn.execute("SELECT * FROM test_suites ORDER BY created_at DESC").fetchall())
    for suite in suites:
        suite['instance_count'] = conn.execute(
            "SELECT COUNT(*) FROM test_instances WHERE suite_id=?", (suite['id'],)).fetchone()[0]
    conn.close()
    return jsonify(suites)

@app.route('/api/testsuites', methods=['POST'])
def create_suite():
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    sid = str(uuid.uuid4())
    suite_id = next_suite_id(conn)
    now = datetime.utcnow().isoformat()
    conn.execute("INSERT INTO test_suites (id,suite_id,name,description,created_by,created_at,project_id) VALUES (?,?,?,?,?,?,?)",
                 (sid, suite_id, data['name'], data.get('description',''), s['username'], now, data.get('project_id')))
    conn.commit()
    suite = row_to_dict(conn.execute("SELECT * FROM test_suites WHERE id=?", (sid,)).fetchone())
    conn.close()
    return jsonify(suite), 201

@app.route('/api/testsuites/<sid_>/instances')
def list_instances(sid_):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    instances = rows_to_list(conn.execute("""
        SELECT ti.*, tc.name as tc_name, tc.tc_id, tc.type as tc_type
        FROM test_instances ti JOIN test_cases tc ON ti.test_case_id=tc.id
        WHERE ti.suite_id=? ORDER BY ti.instance_id""", (sid_,)).fetchall())
    conn.close()
    return jsonify(instances)

@app.route('/api/testsuites/<sid_>/instances', methods=['POST'])
def add_instance(sid_):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    data = request.json
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM test_instances WHERE suite_id=?", (sid_,)).fetchone()[0]
    iid = str(uuid.uuid4())
    inst_id = f"TI-{count+1:04d}"
    conn.execute("INSERT INTO test_instances (id,instance_id,suite_id,test_case_id,status,assigned_to) VALUES (?,?,?,?,?,?)",
                 (iid, inst_id, sid_, data['test_case_id'], 'Not Run', data.get('assigned_to','')))
    conn.commit()
    inst = row_to_dict(conn.execute("""
        SELECT ti.*, tc.name as tc_name, tc.tc_id, tc.type as tc_type
        FROM test_instances ti JOIN test_cases tc ON ti.test_case_id=tc.id
        WHERE ti.id=?""", (iid,)).fetchone())
    conn.close()
    return jsonify(inst), 201

@app.route('/api/instances/<iid>')
def get_instance(iid):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    inst = row_to_dict(conn.execute("""
        SELECT ti.*, tc.name as tc_name, tc.tc_id, tc.type as tc_type, tc.automation_code, tc.automation_framework
        FROM test_instances ti JOIN test_cases tc ON ti.test_case_id=tc.id
        WHERE ti.id=?""", (iid,)).fetchone())
    if not inst: return jsonify({'error':'Not found'}), 404
    steps = rows_to_list(conn.execute("""
        SELECT ts.*, sr.status as result_status, sr.actual, sr.notes, sr.id as result_id
        FROM test_steps ts
        LEFT JOIN step_results sr ON ts.id=sr.step_id AND sr.instance_id=?
        WHERE ts.test_case_id=? ORDER BY ts.step_number""", (iid, inst['test_case_id'])).fetchall())
    inst['steps'] = steps
    inst['defects'] = rows_to_list(conn.execute("""
        SELECT d.* FROM defects d JOIN defect_links dl ON d.id=dl.defect_id
        WHERE dl.entity_type='instance' AND dl.entity_id=?""", (iid,)).fetchall())
    conn.close()
    return jsonify(inst)

@app.route('/api/instances/<iid>/steps/<step_id>', methods=['PUT'])
def update_step_result(iid, step_id):
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    conn = get_db()
    existing = conn.execute("SELECT id FROM step_results WHERE instance_id=? AND step_id=?", (iid, step_id)).fetchone()
    if existing:
        conn.execute("UPDATE step_results SET status=?, actual=?, notes=? WHERE instance_id=? AND step_id=?",
                     (data['status'], data.get('actual',''), data.get('notes',''), iid, step_id))
    else:
        rid = str(uuid.uuid4())
        conn.execute("INSERT INTO step_results (id,instance_id,step_id,status,actual,notes) VALUES (?,?,?,?,?,?)",
                     (rid, iid, step_id, data['status'], data.get('actual',''), data.get('notes','')))
    # update instance status
    steps = rows_to_list(conn.execute("SELECT * FROM step_results WHERE instance_id=?", (iid,)).fetchall())
    statuses = [r['status'] for r in steps]
    if any(s == 'Failed' for s in statuses): inst_status = 'Failed'
    elif all(s == 'Passed' for s in statuses): inst_status = 'Passed'
    elif any(s in ['Passed','Failed'] for s in statuses): inst_status = 'In Progress'
    else: inst_status = 'Not Run'
    conn.execute("UPDATE test_instances SET status=?, executed_by=?, executed_at=? WHERE id=?",
                 (inst_status, s['username'], datetime.utcnow().isoformat(), iid))
    conn.commit()
    conn.close()
    return jsonify({'message':'Updated', 'instance_status': inst_status})

@app.route('/api/instances/<iid>/status', methods=['PUT'])
def update_instance_status(iid):
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    conn = get_db()
    conn.execute("UPDATE test_instances SET status=?, executed_by=?, executed_at=?, notes=? WHERE id=?",
                 (data['status'], s['username'], datetime.utcnow().isoformat(), data.get('notes',''), iid))
    conn.commit()
    conn.close()
    return jsonify({'message':'Updated'})

# ─── Automated execution ──────────────────────────────────────────────────────
execution_logs = {}

@app.route('/api/instances/<iid>/execute', methods=['POST'])
def execute_instance(iid):
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    conn = get_db()
    inst = row_to_dict(conn.execute("""
        SELECT ti.*, tc.automation_code, tc.automation_framework
        FROM test_instances ti JOIN test_cases tc ON ti.test_case_id=tc.id
        WHERE ti.id=?""", (iid,)).fetchone())
    conn.close()
    if not inst: return jsonify({'error':'Not found'}), 404
    if not inst['automation_code']:
        return jsonify({'error':'No automation code found'}), 400

    # Selenium/browser automation cannot run on Render cloud servers (no display/browser)
    if _IS_RENDER:
        exec_id = str(uuid.uuid4())
        execution_logs[exec_id] = []
        def cloud_note():
            msgs = [
                {'type':'warning','msg':'⚠ Cloud Execution Notice'},
                {'type':'info',   'msg':'─' * 50},
                {'type':'info',   'msg':'This test case uses Selenium browser automation.'},
                {'type':'info',   'msg':'Browser automation requires a local machine with'},
                {'type':'info',   'msg':'a browser and WebDriver installed.'},
                {'type':'info',   'msg':''},
                {'type':'info',   'msg':'To run this test:'},
                {'type':'info',   'msg':'  1. Download the automation code'},
                {'type':'info',   'msg':'  2. Run locally: python test_script.py'},
                {'type':'info',   'msg':'  3. Update result manually via Test Execution page'},
                {'type':'info',   'msg':''},
                {'type':'warning','msg':'Cloud servers have no browser/display available.'},
                {'type':'info',   'msg':'─' * 50},
            ]
            time.sleep(0.3)
            for m in msgs:
                execution_logs[exec_id].append(m)
                time.sleep(0.1)
            execution_logs[exec_id].append({'type':'done','status':'Not Run'})
        t = threading.Thread(target=cloud_note)
        t.daemon = True
        t.start()
        return jsonify({'exec_id': exec_id})

    exec_id = str(uuid.uuid4())
    execution_logs[exec_id] = []

    def run_code():
        code_str = inst['automation_code']
        start_time = time.time()
        run_id = str(uuid.uuid4())
        run_seq_conn = get_db()
        run_count = run_seq_conn.execute("SELECT COUNT(*) FROM execution_runs WHERE instance_id=?", (iid,)).fetchone()[0]
        run_seq_conn.close()
        run_seq = f"RUN-{run_count+1:04d}"

        # Prepare log file
        inst_log_dir = os.path.join(RUN_LOGS_DIR, iid)
        os.makedirs(inst_log_dir, exist_ok=True)
        log_filename = f"{run_seq}_{exec_id[:8]}.log"
        log_file_path = os.path.join(inst_log_dir, log_filename)
        log_lines = []

        def log(type_, msg):
            execution_logs[exec_id].append({'type': type_, 'msg': msg})
            ts = datetime.utcnow().strftime('%H:%M:%S.%f')[:-3]
            log_lines.append(f"[{ts}] [{type_.upper()}] {msg}")

        tmp_file = os.path.join(os.environ.get('TEMP', os.path.dirname(__file__)), f"qtest_exec_{exec_id}.py")
        with open(tmp_file, 'w') as f:
            f.write(code_str)

        log('info', f'Run: {run_seq} | Instance: {iid}')
        log('info', f'Framework: {inst["automation_framework"]}')
        log('info', f'Started at: {datetime.utcnow().isoformat()}')
        log('info', '-' * 50)

        try:
            result = subprocess.run([sys.executable, tmp_file],
                                    capture_output=True, text=True, timeout=120)
            for line in result.stdout.split('\n'):
                if line.strip():
                    log('info', line)
            if result.returncode == 0:
                log('success', '✓ Execution completed successfully')
                status = 'Passed'
            else:
                for line in result.stderr.split('\n'):
                    if line.strip():
                        log('error', line)
                log('error', '✗ Execution failed')
                status = 'Failed'
        except subprocess.TimeoutExpired:
            log('error', '✗ Execution timed out (120s)')
            status = 'Failed'
        except Exception as e:
            log('error', f'✗ Error: {str(e)}')
            status = 'Failed'
        finally:
            try: os.remove(tmp_file)
            except: pass

        duration_ms = int((time.time() - start_time) * 1000)
        log('info', '-' * 50)
        log('info', f'Duration: {duration_ms}ms | Status: {status}')

        # Save log file
        with open(log_file_path, 'w', encoding='utf-8') as lf:
            lf.write('\n'.join(log_lines))

        executed_at = datetime.utcnow().isoformat()

        # Save execution run record
        db = get_db()
        db.execute("""INSERT INTO execution_runs (id,run_id,instance_id,status,executed_by,executed_at,duration_ms,log_file,framework)
                      VALUES (?,?,?,?,?,?,?,?,?)""",
                   (run_id, run_seq, iid, status, s['username'], executed_at,
                    duration_ms, log_file_path, inst['automation_framework']))
        db.execute("UPDATE test_instances SET status=?, executed_by=?, executed_at=? WHERE id=?",
                   (status, s['username'], executed_at, iid))
        db.commit()
        db.close()
        execution_logs[exec_id].append({'type':'done','msg':status})

    t = threading.Thread(target=run_code)
    t.start()
    return jsonify({'exec_id': exec_id})

@app.route('/api/execute/stream/<exec_id>')
def stream_execution(exec_id):
    def generate():
        sent = 0
        while True:
            logs = execution_logs.get(exec_id, [])
            while sent < len(logs):
                entry = logs[sent]
                yield f"data: {json.dumps(entry)}\n\n"
                sent += 1
                if entry['type'] == 'done':
                    return
            time.sleep(0.2)
    return Response(stream_with_context(generate()),
                    content_type='text/event-stream',
                    headers={'Cache-Control':'no-cache','X-Accel-Buffering':'no'})

# ─── Defects ──────────────────────────────────────────────────────────────────
def next_defect_id(conn):
    count = conn.execute("SELECT COUNT(*) FROM defects").fetchone()[0]
    return f"BUG-{count+1:04d}"

@app.route('/api/defects')
def list_defects():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    defects = rows_to_list(conn.execute("SELECT * FROM defects ORDER BY created_at DESC").fetchall())
    conn.close()
    return jsonify(defects)

@app.route('/api/defects', methods=['POST'])
def create_defect():
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    conn = get_db()
    did = str(uuid.uuid4())
    defect_id = next_defect_id(conn)
    now = datetime.utcnow().isoformat()
    conn.execute("""INSERT INTO defects (id,defect_id,name,description,status,priority,severity,category,reported_by,assigned_to,created_at,updated_at,project_id)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                 (did, defect_id, data['name'], data.get('description',''),
                  data.get('status','New'), data.get('priority','Medium'),
                  data.get('severity','Medium'), data.get('category',''),
                  s['username'], data.get('assigned_to',''), now, now, data.get('project_id')))
    conn.commit()
    defect = row_to_dict(conn.execute("SELECT * FROM defects WHERE id=?", (did,)).fetchone())
    conn.close()
    return jsonify(defect), 201

@app.route('/api/defects/<did>', methods=['GET'])
def get_defect(did):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    defect = row_to_dict(conn.execute("SELECT * FROM defects WHERE id=?", (did,)).fetchone())
    if not defect: return jsonify({'error':'Not found'}), 404
    defect['linked_entities'] = rows_to_list(conn.execute("SELECT * FROM defect_links WHERE defect_id=?", (did,)).fetchall())
    conn.close()
    return jsonify(defect)

@app.route('/api/defects/<did>', methods=['PUT'])
def update_defect(did):
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    conn = get_db()
    fields = ['name','description','status','priority','severity','category','assigned_to']
    sets = ', '.join(f"{f}=?" for f in fields if f in data)
    vals = [data[f] for f in fields if f in data]
    if sets:
        vals += [datetime.utcnow().isoformat(), did]
        conn.execute(f"UPDATE defects SET {sets}, updated_at=? WHERE id=?", vals)
        conn.commit()
    defect = row_to_dict(conn.execute("SELECT * FROM defects WHERE id=?", (did,)).fetchone())
    conn.close()
    return jsonify(defect)

@app.route('/api/defects/<did>', methods=['DELETE'])
def delete_defect(did):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    conn = get_db()
    conn.execute("DELETE FROM defects WHERE id=?", (did,))
    conn.commit()
    conn.close()
    return jsonify({'message':'Deleted'})

@app.route('/api/defects/link', methods=['POST'])
def link_defect():
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    conn = get_db()
    lid = str(uuid.uuid4())
    try:
        conn.execute("INSERT INTO defect_links (id,defect_id,entity_type,entity_id) VALUES (?,?,?,?)",
                     (lid, data['defect_id'], data['entity_type'], data['entity_id']))
        conn.commit()
    except: pass
    conn.close()
    return jsonify({'message':'Linked'})

# ─── Dashboard stats ──────────────────────────────────────────────────────────
@app.route('/api/dashboard/stats')
def dashboard_stats():
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    stats = {
        'requirements': conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0],
        'test_cases': conn.execute("SELECT COUNT(*) FROM test_cases").fetchone()[0],
        'test_suites': conn.execute("SELECT COUNT(*) FROM test_suites").fetchone()[0],
        'defects': conn.execute("SELECT COUNT(*) FROM defects").fetchone()[0],
        'open_defects': conn.execute("SELECT COUNT(*) FROM defects WHERE status IN ('New','Open','Reopen')").fetchone()[0],
        'passed': conn.execute("SELECT COUNT(*) FROM test_instances WHERE status='Passed'").fetchone()[0],
        'failed': conn.execute("SELECT COUNT(*) FROM test_instances WHERE status='Failed'").fetchone()[0],
        'not_run': conn.execute("SELECT COUNT(*) FROM test_instances WHERE status='Not Run'").fetchone()[0],
    }
    conn.close()
    return jsonify(stats)

# ─── AI Assistant proxy ───────────────────────────────────────────────────────
@app.route('/api/ai/assist', methods=['POST'])
def ai_assist():
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    data = request.json
    try:
        import urllib.request
        payload = json.dumps({
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1000,
            "system": data.get('system', ''),
            "messages": data.get('messages', [])
        }).encode('utf-8')
        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': data.get('api_key', ''),
                'anthropic-version': '2023-06-01'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode('utf-8'))
        return jsonify({'content': result.get('content', [])})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Admin DB Browser ─────────────────────────────────────────────────────────
@app.route('/api/admin/tables')
def list_tables():
    s, err, code = require_admin(request)
    if err: return err, code
    conn = get_db()
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    result = []
    for t in tables:
        name = t['name']
        count = conn.execute(f"SELECT COUNT(*) FROM [{name}]").fetchone()[0]
        cols = conn.execute(f"PRAGMA table_info([{name}])").fetchall()
        result.append({ 'name': name, 'row_count': count, 'columns': [c['name'] for c in cols] })
    conn.close()
    return jsonify(result)

@app.route('/api/admin/tables/<table_name>')
def get_table_data(table_name):
    s, err, code = require_admin(request)
    if err: return err, code
    # Whitelist check - only allow known table names
    allowed = ['users','requirements','test_cases','test_steps','test_suites',
               'test_instances','step_results','defects','defect_links',
               'req_test_coverage','req_traceability','projects','attachments','execution_runs']
    if table_name not in allowed:
        return jsonify({'error': 'Table not allowed'}), 400
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    offset = (page - 1) * limit
    conn = get_db()
    total = conn.execute(f"SELECT COUNT(*) FROM [{table_name}]").fetchone()[0]
    rows = rows_to_list(conn.execute(f"SELECT * FROM [{table_name}] LIMIT ? OFFSET ?", (limit, offset)).fetchall())
    cols = [c['name'] for c in conn.execute(f"PRAGMA table_info([{table_name}])").fetchall()]
    conn.close()
    return jsonify({ 'columns': cols, 'rows': rows, 'total': total, 'page': page, 'limit': limit })

@app.route('/api/admin/query', methods=['POST'])
def execute_query():
    s, err, code = require_admin(request)
    if err: return err, code
    data = request.json
    sql = (data.get('sql') or '').strip()
    if not sql:
        return jsonify({'error': 'No SQL provided'}), 400
    # Block destructive operations
    sql_upper = sql.upper()
    blocked = ['DROP ', 'TRUNCATE ', 'ALTER ', 'ATTACH ', 'DETACH ']
    if any(b in sql_upper for b in blocked):
        return jsonify({'error': f'Operation not allowed for safety. Blocked keywords: {", ".join(b.strip() for b in blocked)}'}), 400
    conn = get_db()
    try:
        start = time.time()
        cursor = conn.execute(sql)
        elapsed = round((time.time() - start) * 1000, 2)
        if cursor.description:
            cols = [d[0] for d in cursor.description]
            rows = [dict(zip(cols, row)) for row in cursor.fetchmany(500)]
            conn.commit()
            return jsonify({ 'columns': cols, 'rows': rows, 'row_count': len(rows), 'elapsed_ms': elapsed, 'type': 'select' })
        else:
            conn.commit()
            return jsonify({ 'affected': cursor.rowcount, 'elapsed_ms': elapsed, 'type': 'write' })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/admin/system-stats')
def system_stats():
    s, err, code = require_admin(request)
    if err: return err, code
    conn = get_db()
    db_size = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    stats = {
        'db_size_kb': round(db_size / 1024, 1),
        'total_users': conn.execute("SELECT COUNT(*) FROM users").fetchone()[0],
        'active_users': conn.execute("SELECT COUNT(*) FROM users WHERE is_active=1").fetchone()[0],
        'total_requirements': conn.execute("SELECT COUNT(*) FROM requirements").fetchone()[0],
        'total_test_cases': conn.execute("SELECT COUNT(*) FROM test_cases").fetchone()[0],
        'total_defects': conn.execute("SELECT COUNT(*) FROM defects").fetchone()[0],
        'total_executions': conn.execute("SELECT COUNT(*) FROM test_instances WHERE status != 'Not Run'").fetchone()[0],
        'pass_rate': 0,
        'active_sessions': get_db().execute("SELECT COUNT(*) FROM sessions WHERE expires_at > ?", (datetime.utcnow().isoformat(),)).fetchone()[0],
        'python_version': sys.version.split()[0],
    }
    ran = conn.execute("SELECT COUNT(*) FROM test_instances WHERE status IN ('Passed','Failed')").fetchone()[0]
    passed = conn.execute("SELECT COUNT(*) FROM test_instances WHERE status='Passed'").fetchone()[0]
    stats['pass_rate'] = round((passed / ran * 100) if ran > 0 else 0, 1)
    # Recent activity
    stats['recent_executions'] = rows_to_list(conn.execute("""
        SELECT ti.instance_id, ti.status, ti.executed_by, ti.executed_at, tc.name as tc_name
        FROM test_instances ti JOIN test_cases tc ON ti.test_case_id=tc.id
        WHERE ti.executed_at IS NOT NULL ORDER BY ti.executed_at DESC LIMIT 10""").fetchall())
    stats['recent_defects'] = rows_to_list(conn.execute(
        "SELECT defect_id, name, status, reported_by, created_at FROM defects ORDER BY created_at DESC LIMIT 5").fetchall())
    conn.close()
    return jsonify(stats)


# ─── Attachments ──────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'png','jpg','jpeg','gif','pdf','doc','docx','xls','xlsx','txt','log','zip','csv','mp4','webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/attachments/<entity_type>/<entity_id>', methods=['GET'])
def list_attachments(entity_type, entity_id):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    rows = rows_to_list(conn.execute(
        "SELECT * FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY uploaded_at DESC",
        (entity_type, entity_id)).fetchall())
    conn.close()
    return jsonify(rows)

@app.route('/api/attachments/<entity_type>/<entity_id>', methods=['POST'])
def upload_attachment(entity_type, entity_id):
    s, err, code = require_role(request, 'tester')
    if err: return err, code
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    att_id = str(uuid.uuid4())
    ext = file.filename.rsplit('.', 1)[1].lower()
    stored_name = f"{att_id}.{ext}"
    entity_dir = os.path.join(ATTACHMENTS_DIR, entity_type, entity_id)
    os.makedirs(entity_dir, exist_ok=True)
    file_path = os.path.join(entity_dir, stored_name)
    file.save(file_path)
    file_size = os.path.getsize(file_path)
    conn = get_db()
    conn.execute("""INSERT INTO attachments (id,entity_type,entity_id,filename,original_name,file_size,mime_type,uploaded_by,uploaded_at)
                    VALUES (?,?,?,?,?,?,?,?,?)""",
        (att_id, entity_type, entity_id, stored_name, file.filename, file_size,
         file.content_type, s['username'], datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({'id': att_id, 'original_name': file.filename, 'file_size': file_size}), 201

@app.route('/api/attachments/<att_id>/download')
def download_attachment(att_id):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    att = row_to_dict(conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone())
    conn.close()
    if not att: return jsonify({'error': 'Not found'}), 404
    entity_dir = os.path.join(ATTACHMENTS_DIR, att['entity_type'], att['entity_id'])
    return send_from_directory(entity_dir, att['filename'], as_attachment=True,
                               download_name=att['original_name'])

@app.route('/api/attachments/<att_id>', methods=['DELETE'])
def delete_attachment(att_id):
    s, err, code = require_role(request, 'lead')
    if err: return err, code
    conn = get_db()
    att = row_to_dict(conn.execute("SELECT * FROM attachments WHERE id=?", (att_id,)).fetchone())
    if not att:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    entity_dir = os.path.join(ATTACHMENTS_DIR, att['entity_type'], att['entity_id'])
    file_path = os.path.join(entity_dir, att['filename'])
    try:
        os.remove(file_path)
    except: pass
    conn.execute("DELETE FROM attachments WHERE id=?", (att_id,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─── Execution Runs (history) ──────────────────────────────────────────────────
@app.route('/api/instances/<iid>/runs')
def list_runs(iid):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    runs = rows_to_list(conn.execute(
        "SELECT * FROM execution_runs WHERE instance_id=? ORDER BY executed_at DESC", (iid,)).fetchall())
    conn.close()
    return jsonify(runs)

@app.route('/api/runs/<run_id>/log')
def get_run_log(run_id):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    run = row_to_dict(conn.execute("SELECT * FROM execution_runs WHERE id=?", (run_id,)).fetchone())
    conn.close()
    if not run: return jsonify({'error': 'Not found'}), 404
    log_file = run.get('log_file')
    if not log_file or not os.path.exists(log_file):
        return jsonify({'log': 'No log file available'})
    with open(log_file, 'r', encoding='utf-8') as f:
        return jsonify({'log': f.read(), 'log_file': os.path.basename(log_file)})

@app.route('/api/runs/<run_id>/log/download')
def download_run_log(run_id):
    s, err, code = require_auth(request)
    if err: return err, code
    conn = get_db()
    run = row_to_dict(conn.execute("SELECT * FROM execution_runs WHERE id=?", (run_id,)).fetchone())
    conn.close()
    if not run: return jsonify({'error': 'Not found'}), 404
    log_file = run.get('log_file')
    if not log_file or not os.path.exists(log_file):
        return jsonify({'error': 'Log file not found'}), 404
    return send_from_directory(os.path.dirname(log_file), os.path.basename(log_file),
                               as_attachment=True, download_name=f"run_{run['run_id']}.log")

# Initialize DB when loaded by gunicorn
init_db()

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 8080))
    print("="*50)
    print(f"  QTest Platform Backend")
    print(f"  Running on http://0.0.0.0:{port}")
    print("="*50)
    app.run(host='0.0.0.0', port=port, debug=False)
