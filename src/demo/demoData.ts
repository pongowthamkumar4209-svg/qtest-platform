// ─── QTest Demo Data ──────────────────────────────────────────────────────────
// Used when backend is offline - full preview mode

export const DEMO_USER = {
  user_id: 'demo-001',
  username: 'demo_viewer',
  full_name: 'Demo User',
  role: 'viewer',
};

export const DEMO_REQUIREMENTS = [
  { id: 'r1', req_id: 'REQ-0001', name: 'User Authentication & SSO Integration', description: 'System must support username/password login and SSO via SAML 2.0. Session timeout after 30 minutes of inactivity.', type: 'Functional', priority: 'High', status: 'Approved', author: 'admin', created_at: '2026-01-10T09:00:00', updated_at: '2026-01-15T11:00:00' },
  { id: 'r2', req_id: 'REQ-0002', name: 'Test Case Management', description: 'Users must be able to create, edit, delete, and organize test cases into suites. Support manual and automated test types.', type: 'Functional', priority: 'High', status: 'Approved', author: 'admin', created_at: '2026-01-10T09:10:00', updated_at: '2026-01-16T10:00:00' },
  { id: 'r3', req_id: 'REQ-0003', name: 'Defect Tracking Integration', description: 'Platform must allow logging defects directly from test execution results with severity and priority classification.', type: 'Functional', priority: 'High', status: 'In Review', author: 'lead_user', created_at: '2026-01-11T10:00:00', updated_at: '2026-01-17T09:30:00' },
  { id: 'r4', req_id: 'REQ-0004', name: 'Automated Test Execution Engine', description: 'System must support Selenium WebDriver scripts. Execution results must be captured in real-time via SSE streaming.', type: 'Functional', priority: 'Critical', status: 'Approved', author: 'admin', created_at: '2026-01-12T08:00:00', updated_at: '2026-01-18T14:00:00' },
  { id: 'r5', req_id: 'REQ-0005', name: 'Role-Based Access Control', description: 'Four roles: Viewer, Tester, Lead, Admin. Each role has specific permissions for read/write/execute operations.', type: 'Security', priority: 'High', status: 'Approved', author: 'admin', created_at: '2026-01-12T09:00:00', updated_at: '2026-01-19T11:00:00' },
  { id: 'r6', req_id: 'REQ-0006', name: 'Execution History & Run Logs', description: 'All test executions must be stored with full console output, timestamps, duration and pass/fail status.', type: 'Functional', priority: 'Medium', status: 'Draft', author: 'tester_user', created_at: '2026-01-13T10:00:00', updated_at: '2026-01-20T09:00:00' },
  { id: 'r7', req_id: 'REQ-0007', name: 'File Attachment Support', description: 'Users must be able to attach screenshots, logs and documents to requirements, test cases, and defects.', type: 'Functional', priority: 'Medium', status: 'Approved', author: 'lead_user', created_at: '2026-01-14T11:00:00', updated_at: '2026-01-21T10:00:00' },
  { id: 'r8', req_id: 'REQ-0008', name: 'Performance - Page Load', description: 'All pages must load within 2 seconds on standard broadband. Dashboard must render within 1 second.', type: 'Performance', priority: 'Medium', status: 'In Review', author: 'admin', created_at: '2026-01-15T09:00:00', updated_at: '2026-01-22T11:00:00' },
];

export const DEMO_TEST_CASES = [
  { id: 'tc1', tc_id: 'TC-0001', name: 'Login with Valid Credentials', description: 'Verify user can login with correct username and password', type: 'Manual', priority: 'High', status: 'Ready', author: 'admin', created_at: '2026-01-15T10:00:00', updated_at: '2026-01-20T09:00:00', automation_code: null, automation_framework: 'selenium',
    steps: [
      { id: 's1', step_number: 1, action: 'Navigate to login page', expected: 'Login form is displayed' },
      { id: 's2', step_number: 2, action: 'Enter valid username "admin"', expected: 'Username field populated' },
      { id: 's3', step_number: 3, action: 'Enter valid password "Admin@123"', expected: 'Password field masked' },
      { id: 's4', step_number: 4, action: 'Click Sign In button', expected: 'Dashboard is displayed, user logged in' },
    ]
  },
  { id: 'tc2', tc_id: 'TC-0002', name: 'Login with Invalid Password', description: 'Verify error message shown for wrong password', type: 'Manual', priority: 'High', status: 'Ready', author: 'admin', created_at: '2026-01-15T10:30:00', updated_at: '2026-01-20T09:00:00', automation_code: null, automation_framework: 'selenium',
    steps: [
      { id: 's5', step_number: 1, action: 'Navigate to login page', expected: 'Login form displayed' },
      { id: 's6', step_number: 2, action: 'Enter username "admin" and wrong password', expected: 'Fields populated' },
      { id: 's7', step_number: 3, action: 'Click Sign In', expected: 'Error message "Invalid credentials" shown' },
    ]
  },
  { id: 'tc3', tc_id: 'TC-0003', name: 'Create New Requirement', description: 'Verify Lead/Admin can create requirements with all fields', type: 'Manual', priority: 'High', status: 'Ready', author: 'lead_user', created_at: '2026-01-16T09:00:00', updated_at: '2026-01-21T10:00:00', automation_code: null, automation_framework: 'selenium',
    steps: [
      { id: 's8', step_number: 1, action: 'Navigate to Requirements module', expected: 'Requirements list shown' },
      { id: 's9', step_number: 2, action: 'Click New Requirement button', expected: 'Create form opens' },
      { id: 's10', step_number: 3, action: 'Fill all required fields and submit', expected: 'Requirement created with auto-assigned REQ ID' },
    ]
  },
  { id: 'tc4', tc_id: 'TC-0004', name: 'Automated Login & Navigation Test', description: 'Selenium script to validate login flow end-to-end', type: 'Automated', priority: 'Critical', status: 'Ready', author: 'admin', created_at: '2026-01-17T08:00:00', updated_at: '2026-01-22T11:00:00',
    automation_code: `from selenium import webdriver\nfrom selenium.webdriver.common.by import By\nfrom selenium.webdriver.support.ui import WebDriverWait\nfrom selenium.webdriver.support import expected_conditions as EC\nimport time\n\nprint("Starting automated login test...")\noptions = webdriver.EdgeOptions()\ndriver = webdriver.Edge(options=options)\ntry:\n    driver.get("http://localhost:5173")\n    print("Opened QTest Platform")\n    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "username")))\n    driver.find_element(By.NAME, "username").send_keys("admin")\n    driver.find_element(By.NAME, "password").send_keys("Admin@123")\n    driver.find_element(By.CSS_SELECTOR, "button[type=submit]").click()\n    WebDriverWait(driver, 10).until(EC.title_contains("QTest"))\n    print("Login successful - Dashboard loaded")\n    time.sleep(2)\nfinally:\n    driver.quit()\n    print("Test complete")`,
    automation_framework: 'selenium', steps: []
  },
  { id: 'tc5', tc_id: 'TC-0005', name: 'Defect Creation & Priority Assignment', description: 'Verify testers can log defects with correct priority levels', type: 'Manual', priority: 'Medium', status: 'Draft', author: 'tester_user', created_at: '2026-01-18T10:00:00', updated_at: '2026-01-23T09:00:00', automation_code: null, automation_framework: 'selenium',
    steps: [
      { id: 's11', step_number: 1, action: 'Go to Defects module', expected: 'Defects list displayed' },
      { id: 's12', step_number: 2, action: 'Click Log Defect', expected: 'Create defect form opens' },
      { id: 's13', step_number: 3, action: 'Fill name, severity, priority fields', expected: 'Fields validated' },
      { id: 's14', step_number: 4, action: 'Submit form', expected: 'Defect created with BUG ID assigned' },
    ]
  },
  { id: 'tc6', tc_id: 'TC-0006', name: 'File Attachment Upload & Download', description: 'Verify files can be attached to entities and downloaded', type: 'Manual', priority: 'Medium', status: 'Ready', author: 'lead_user', created_at: '2026-01-19T11:00:00', updated_at: '2026-01-24T10:00:00', automation_code: null, automation_framework: 'selenium',
    steps: [
      { id: 's15', step_number: 1, action: 'Open any requirement detail page', expected: 'Attachment section visible' },
      { id: 's16', step_number: 2, action: 'Click Upload and select a PNG file', expected: 'File uploaded, shown in list' },
      { id: 's17', step_number: 3, action: 'Click Download on attachment', expected: 'File downloaded successfully' },
    ]
  },
];

export const DEMO_SUITES = [
  { id: 'ts1', suite_id: 'TS-0001', name: 'Smoke Test Suite', description: 'Core functionality smoke tests', created_by: 'admin', created_at: '2026-01-20T09:00:00' },
  { id: 'ts2', suite_id: 'TS-0002', name: 'Regression Suite - Sprint 3', description: 'Full regression for Sprint 3 release', created_by: 'lead_user', created_at: '2026-01-22T10:00:00' },
];

export const DEMO_INSTANCES = [
  { id: 'ti1', instance_id: 'TI-0001', suite_id: 'ts1', test_case_id: 'tc1', tc_id: 'TC-0001', tc_name: 'Login with Valid Credentials', tc_type: 'Manual', status: 'Passed', assigned_to: 'tester_user', executed_by: 'tester_user', executed_at: '2026-01-25T10:30:00', duration_ms: 45000 },
  { id: 'ti2', instance_id: 'TI-0002', suite_id: 'ts1', test_case_id: 'tc2', tc_id: 'TC-0002', tc_name: 'Login with Invalid Password', tc_type: 'Manual', status: 'Passed', assigned_to: 'tester_user', executed_by: 'tester_user', executed_at: '2026-01-25T10:45:00', duration_ms: 32000 },
  { id: 'ti3', instance_id: 'TI-0003', suite_id: 'ts1', test_case_id: 'tc4', tc_id: 'TC-0004', tc_name: 'Automated Login & Navigation Test', tc_type: 'Automated', status: 'Failed', assigned_to: 'admin', executed_by: 'admin', executed_at: '2026-01-25T11:00:00', duration_ms: 38000 },
  { id: 'ti4', instance_id: 'TI-0004', suite_id: 'ts2', test_case_id: 'tc3', tc_id: 'TC-0003', tc_name: 'Create New Requirement', tc_type: 'Manual', status: 'Not Run', assigned_to: 'tester_user', executed_by: null, executed_at: null, duration_ms: null },
  { id: 'ti5', instance_id: 'TI-0005', suite_id: 'ts2', test_case_id: 'tc5', tc_id: 'TC-0005', tc_name: 'Defect Creation & Priority Assignment', tc_type: 'Manual', status: 'Not Run', assigned_to: 'tester_user', executed_by: null, executed_at: null, duration_ms: null },
];

export const DEMO_DEFECTS = [
  { id: 'd1', defect_id: 'BUG-0001', name: 'Login page shows blank screen on Safari', description: 'When accessing the login page on Safari 16+, the page renders blank. Console shows CORS error on font loading.', status: 'Open', priority: 'High', severity: 'Major', category: 'UI', reported_by: 'tester_user', assigned_to: 'admin', created_at: '2026-01-25T12:00:00', updated_at: '2026-01-26T09:00:00' },
  { id: 'd2', defect_id: 'BUG-0002', name: 'Execution timer shows incorrect duration', description: 'Automated test execution timer sometimes shows negative duration (-200ms) when execution completes very fast.', status: 'In Progress', priority: 'Medium', severity: 'Minor', category: 'Logic', reported_by: 'admin', assigned_to: 'admin', created_at: '2026-01-26T10:00:00', updated_at: '2026-01-27T11:00:00' },
  { id: 'd3', defect_id: 'BUG-0003', name: 'Attachment upload fails for files > 10MB', description: 'Uploading files larger than 10MB causes a 413 error from Flask. Need to increase max content length.', status: 'New', priority: 'Medium', severity: 'Major', category: 'Backend', reported_by: 'lead_user', assigned_to: null, created_at: '2026-01-27T09:00:00', updated_at: '2026-01-27T09:00:00' },
  { id: 'd4', defect_id: 'BUG-0004', name: 'Role badge not updating after admin changes role', description: 'When admin changes a user role, the user must re-login to see the updated role badge in the sidebar.', status: 'Closed', priority: 'Low', severity: 'Minor', category: 'UI', reported_by: 'tester_user', assigned_to: 'admin', created_at: '2026-01-20T10:00:00', updated_at: '2026-01-28T14:00:00' },
  { id: 'd5', defect_id: 'BUG-0005', name: 'SQL Console allows UPDATE without WHERE clause', description: 'In Site Admin SQL Console, running UPDATE without WHERE updates all rows. Need confirmation dialog for bulk writes.', status: 'Open', priority: 'High', severity: 'Critical', category: 'Security', reported_by: 'admin', assigned_to: 'admin', created_at: '2026-01-28T09:00:00', updated_at: '2026-01-28T09:00:00' },
];

export const DEMO_EXECUTION_RUNS = [
  { id: 'run1', run_id: 'RUN-0001', instance_id: 'ti3', status: 'Failed', executed_by: 'admin', executed_at: '2026-01-25T11:00:00', duration_ms: 38000, framework: 'selenium',
    log: `[11:00:00.001] [INFO] Run: RUN-0001 | Instance: TI-0003\n[11:00:00.002] [INFO] Framework: selenium\n[11:00:00.003] [INFO] Started at: 2026-01-25T11:00:00\n[11:00:00.004] [INFO] --------------------------------------------------\n[11:00:00.500] [INFO] Starting automated login test...\n[11:00:02.100] [INFO] Opened QTest Platform\n[11:00:05.200] [INFO] Waiting for login form...\n[11:00:08.300] [ERROR] TimeoutException: element username not found within 10s\n[11:00:08.301] [ERROR] Traceback: selenium.common.exceptions.TimeoutException\n[11:00:08.302] [ERROR] ✗ Execution failed\n[11:00:38.000] [INFO] --------------------------------------------------\n[11:00:38.001] [INFO] Duration: 38000ms | Status: Failed` },
  { id: 'run2', run_id: 'RUN-0001', instance_id: 'ti1', status: 'Passed', executed_by: 'tester_user', executed_at: '2026-01-25T10:30:00', duration_ms: 45000, framework: 'selenium',
    log: `[10:30:00.001] [INFO] Run: RUN-0001 | Instance: TI-0001\n[10:30:00.002] [INFO] Framework: manual\n[10:30:00.003] [INFO] Started at: 2026-01-25T10:30:00\n[10:30:44.000] [SUCCESS] ✓ Execution completed successfully\n[10:30:45.000] [INFO] Duration: 45000ms | Status: Passed` },
];

export const DEMO_STATS = {
  total_requirements: DEMO_REQUIREMENTS.length,
  total_test_cases: DEMO_TEST_CASES.length,
  total_defects: DEMO_DEFECTS.length,
  total_suites: DEMO_SUITES.length,
  passed: DEMO_INSTANCES.filter(i => i.status === 'Passed').length,
  failed: DEMO_INSTANCES.filter(i => i.status === 'Failed').length,
  not_run: DEMO_INSTANCES.filter(i => i.status === 'Not Run').length,
};
