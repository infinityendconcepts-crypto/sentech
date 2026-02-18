#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Sentech Bursary Management System - Full stack app with Events, Documents, Leads, Settings, and Profile functionality."

backend:
  - task: "Events CRUD API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Added GET/POST/PUT/DELETE /api/events. Tested with curl - create and get events working correctly."

  - task: "User Documents API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Added GET/POST/PUT/DELETE /api/users/{user_id}/documents. Tested with curl - upload and retrieve documents working."

  - task: "Settings API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "GET/PUT /api/settings working. Saves SMTP, Zoom, Teams keys to DB."

  - task: "Leads CRUD API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Full CRUD for leads already implemented in previous session."

frontend:
  - task: "EventsPage - Calendar and List View"
    implemented: true
    working: true
    file: "frontend/src/pages/EventsPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PASS - Calendar view, list view, add/edit/delete all working. Events appear on calendar."

  - task: "UserProfilePage Documents Tab"
    implemented: true
    working: true
    file: "frontend/src/pages/UserProfilePage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PASS - Documents tab shows, upload section functional, status badges (processing/approved/rejected) correct."

  - task: "LeadsPage - Remove mock data, add Create modal"
    implemented: true
    working: true
    file: "frontend/src/pages/LeadsPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PASS - No mock data. Empty state shows correctly. Add Lead dialog works. Lead appears in list after creation."

  - task: "Sidebar - Remove My Profile link, Add Events"
    implemented: true
    working: true
    file: "frontend/src/components/Layout/Layout.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PASS - My Profile link removed. Events navigation link added and working."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "EventsPage - Calendar and List View"
    - "UserProfilePage Documents Tab"
    - "LeadsPage - Remove mock data, add Create modal"
    - "Sidebar - Remove My Profile link, Add Events"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Implemented all items from user request: 1) Events API routes (CRUD /api/events) and EventsPage.jsx with calendar/list views 2) User Documents API + Documents tab on UserProfilePage with upload/re-upload/delete 3) Removed mockLeads from LeadsPage, added Add Lead dialog 4) Removed My Profile duplicate link from sidebar 5) Added Events to sidebar navigation. Backend APIs tested via curl and all working. Frontend compiled OK. Please test all UI flows."

  - task: "Reports Export Excel/PDF endpoints"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Updated /api/reports/export/{report_type} to support format=excel and format=pdf using generate_excel() and generate_pdf() helpers. Returns proper StreamingResponse with correct content-type."

  - task: "Backend Auth"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login endpoint working. Test user: jane.smith@uct.ac.za / securepass123"

frontend:
  - task: "TasksPage date filter"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/TasksPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added dateFrom and dateTo date input filters to TasksPage. Filter logic checks task.dueDate against the date range. Clear Filters button now also clears date fields."

  - task: "TasksPage Excel/PDF export buttons"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/TasksPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added Export dropdown button in page header with Export to Excel and Export to PDF options. Uses tasksAPI.exportExcel() and tasksAPI.exportPdf() with current filter params. Triggers file download via blob URL."

  - task: "TasksPage List/Kanban/Gantt views"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/TasksPage.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Existing views should still work - no regression changes made."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "TasksPage date filter"
    - "TasksPage Excel/PDF export buttons"
    - "Tasks Export Excel endpoint"
    - "Tasks Export PDF endpoint"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

  - task: "TasksPage connected to real backend"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/TasksPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Replaced mockTasks with real API calls. Added useAuth import, handleCreateTask, handleDeleteTask, handleStatusChange functions connecting to tasksAPI. Added Add Task dialog modal."

  - task: "TasksPage Add Task Modal"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/TasksPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added full Add Task dialog with fields: title, description, status, priority, assignee_name, due_date, project_name, tags. Calls tasksAPI.create() on submit."

  - task: "ReportsPage Excel/PDF export buttons"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/ReportsPage.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Replaced CSV/JSON export buttons with unified Export dropdown showing Excel, PDF, CSV options. Updated handleExport to support all 4 formats."

agent_communication:
  - agent: "main"
    message: "New pages built: 1) UsersPage at /users - shows all users with stats, search/filter, invite user, change role, activate/deactivate, delete. 2) UserProfilePage at /profile - edit name/phone/dept/bio, change password, view account info. 3) ReportsPage - added recharts: Bar chart (system overview), Pie chart (application status), Horizontal bar (task status). Backend: new endpoints /users/me, PUT /users/me, POST /users/me/change-password, POST /users/invite, PUT /users/{id}/status, PUT /users/{id}/role, DELETE /users/{id}. Sidebar updated with Users nav item and My Profile link."