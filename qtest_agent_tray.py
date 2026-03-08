"""
QTest Agent - System Tray
=========================
Sits in Windows system tray and automatically picks up
execution jobs from qtest-platform.vercel.app

Install once:
    pip install requests pystray pillow

Add to Windows startup:
    - Press Win+R, type shell:startup
    - Create shortcut to this file
"""

import requests, subprocess, tempfile, os, sys, time, uuid, threading
from datetime import datetime

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

BACKEND_URL   = "https://qtest-platform.onrender.com/api"
POLL_INTERVAL = 3
AGENT_ID      = f"agent-{uuid.uuid4().hex[:8]}"
_status       = {"connected": False, "jobs_run": 0, "running": False}

# ── Icons ─────────────────────────────────────────────────────────────────────
def make_icon(color):
    img  = Image.new('RGB', (64, 64), color=(30, 30, 30))
    draw = ImageDraw.Draw(img)
    draw.ellipse([8, 8, 56, 56], fill=color)
    return img

ICON_GREEN  = make_icon((34, 197, 94))   if HAS_TRAY else None
ICON_RED    = make_icon((239, 68, 68))   if HAS_TRAY else None
ICON_YELLOW = make_icon((245, 158, 11))  if HAS_TRAY else None

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg):
    print(f"[QTest Agent] [{datetime.now().strftime('%H:%M:%S')}] {msg}")

# ── Backend comms ─────────────────────────────────────────────────────────────
def send_log(exec_id, type_, msg):
    try:
        requests.post(f"{BACKEND_URL}/agent/log",
                      json={'exec_id': exec_id, 'entry': {'type': type_, 'msg': msg}},
                      timeout=8)
    except: pass

def claim_job():
    try:
        r = requests.post(f"{BACKEND_URL}/agent/claim",
                          json={'agent_id': AGENT_ID}, timeout=8)
        return r.json().get('job')
    except: return None

def complete_job(job_id, exec_id, instance_id, status, duration_ms, framework):
    try:
        requests.post(f"{BACKEND_URL}/agent/complete", json={
            'job_id': job_id, 'exec_id': exec_id,
            'instance_id': instance_id, 'status': status,
            'duration_ms': duration_ms, 'framework': framework,
        }, timeout=8)
    except: pass

# ── Job runner ────────────────────────────────────────────────────────────────
def run_job(job):
    exec_id     = job['exec_id']
    instance_id = job['instance_id']
    job_id      = job['id']
    framework   = job.get('framework', 'selenium')
    code        = job['code']

    _status['running'] = True
    log(f"Running job {job_id[:8]}...")

    send_log(exec_id, 'info', f'Agent {AGENT_ID} connected')
    send_log(exec_id, 'info', f'Framework: {framework}')
    send_log(exec_id, 'info', '-' * 50)

    tmp = tempfile.NamedTemporaryFile(suffix='.py', delete=False, mode='w', encoding='utf-8')
    tmp.write(code)
    tmp.close()

    start  = time.time()
    status = 'Failed'
    try:
        result = subprocess.run(
            [sys.executable, tmp.name],
            capture_output=True, text=True, timeout=180
        )
        for line in result.stdout.splitlines():
            if line.strip(): send_log(exec_id, 'info', line)
        if result.returncode == 0:
            send_log(exec_id, 'success', '✓ Execution completed successfully')
            status = 'Passed'
        else:
            for line in result.stderr.splitlines():
                if line.strip(): send_log(exec_id, 'error', line)
            send_log(exec_id, 'error', '✗ Execution failed')
    except subprocess.TimeoutExpired:
        send_log(exec_id, 'error', '✗ Timed out (180s)')
    except Exception as e:
        send_log(exec_id, 'error', f'✗ {str(e)}')
    finally:
        try: os.remove(tmp.name)
        except: pass

    duration_ms = int((time.time() - start) * 1000)
    send_log(exec_id, 'info', '-' * 50)
    send_log(exec_id, 'info', f'Duration: {duration_ms}ms | Status: {status}')
    complete_job(job_id, exec_id, instance_id, status, duration_ms, framework)

    _status['running'] = False
    _status['jobs_run'] += 1
    log(f"Job done → {status} ({duration_ms}ms) | Total jobs: {_status['jobs_run']}")

# ── Poll loop (runs in background thread) ─────────────────────────────────────
def poll_loop(tray_icon=None):
    log("Connecting to backend...")
    while True:
        try:
            r = requests.get(f"{BACKEND_URL}/agent/ping", timeout=8)
            if r.status_code == 200:
                if not _status['connected']:
                    _status['connected'] = True
                    log("Backend connected ✓")
                    if tray_icon and HAS_TRAY:
                        tray_icon.icon  = ICON_GREEN
                        tray_icon.title = f"QTest Agent ✓ Connected ({_status['jobs_run']} jobs run)"
        except:
            _status['connected'] = False
            if tray_icon and HAS_TRAY:
                tray_icon.icon  = ICON_RED
                tray_icon.title = "QTest Agent ✗ Disconnected"

        if _status['connected'] and not _status['running']:
            job = claim_job()
            if job:
                if tray_icon and HAS_TRAY:
                    tray_icon.icon  = ICON_YELLOW
                    tray_icon.title = "QTest Agent ⚡ Running job..."
                run_job(job)
                if tray_icon and HAS_TRAY:
                    tray_icon.icon  = ICON_GREEN
                    tray_icon.title = f"QTest Agent ✓ Ready ({_status['jobs_run']} jobs run)"

        time.sleep(POLL_INTERVAL)

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 50)
    print("  QTest Execution Agent")
    print(f"  Agent ID: {AGENT_ID}")
    print(f"  Backend : {BACKEND_URL}")
    print("=" * 50)

    if HAS_TRAY:
        # Run with system tray icon
        icon = pystray.Icon(
            name  = "QTest Agent",
            icon  = ICON_RED,
            title = "QTest Agent - Connecting...",
            menu  = pystray.Menu(
                pystray.MenuItem("QTest Execution Agent", lambda: None, enabled=False),
                pystray.MenuItem(f"Agent: {AGENT_ID}", lambda: None, enabled=False),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Open QTest Platform", lambda: os.startfile("https://qtest-platform.vercel.app")),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Quit Agent", lambda: icon.stop()),
            )
        )
        # Start poll loop in background
        t = threading.Thread(target=poll_loop, args=(icon,), daemon=True)
        t.start()
        print("System tray icon started. Look for QTest icon in taskbar.")
        icon.run()
    else:
        # No tray - just run in terminal
        print("Tip: pip install pystray pillow for system tray mode")
        print("Running in terminal mode...\n")
        try:
            poll_loop()
        except KeyboardInterrupt:
            print("\nAgent stopped.")

if __name__ == '__main__':
    main()
