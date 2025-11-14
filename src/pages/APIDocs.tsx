import React from 'react';

export function APIDocs() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Node.js REST API Documentation</h1>
        <p className="text-gray-600">Complete guide to using the Project Management REST API endpoints</p>
      </div>

      {/* Authentication */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication</h2>
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <p className="text-blue-800">
            <strong>Note:</strong> All API endpoints require JWT authentication. Include the JWT token in the Authorization header.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">JWT Authentication</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Header-based authentication
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Base URL</h3>
            <p className="text-gray-600 mb-2">All API endpoints are relative to:</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">http://localhost:3069</code>
          </div>
        </div>
      </section>

      {/* Projects API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Projects API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Project</h3>
            <p className="text-gray-600 mb-2">Create a new project for the authenticated user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/projects</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (required)",
  "description": "string (optional)",
  "status": "active|completed|on_hold|cancelled (default: active)",
  "start_date": "YYYY-MM-DD (optional)",
  "end_date": "YYYY-MM-DD (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "id": 123
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Projects</h3>
            <p className="text-gray-600 mb-2">Retrieve all projects for the authenticated user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/projects</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "name": "Project Name",
    "description": "Project description",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Update Project</h3>
            <p className="text-gray-600 mb-2">Update an existing project.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>PUT</strong> <code>/api/projects/:id</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "active|completed|on_hold|cancelled (optional)",
  "start_date": "YYYY-MM-DD (optional)",
  "end_date": "YYYY-MM-DD (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-2">Delete a project by ID.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>DELETE</strong> <code>/api/projects/:id</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Tasks API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tasks API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Task</h3>
            <p className="text-gray-600 mb-2">Create a new task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/tasks</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "project_id": "number (optional)",
  "sprint_id": "number (optional)",
  "title": "string (required)",
  "description": "string (optional)",
  "status": "todo|in_progress|done (default: todo)",
  "priority": "low|medium|high (default: medium)",
  "due_date": "YYYY-MM-DD (optional)",
  "estimated_hours": "number (default: 0)",
  "actual_hours": "number (default: 0)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "id": 456
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Tasks</h3>
            <p className="text-gray-600 mb-2">Retrieve all tasks.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/tasks</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 456,
    "project_id": 123,
    "sprint_id": null,
    "title": "Task Title",
    "description": "Task description",
    "status": "todo",
    "priority": "medium",
    "due_date": "2024-12-31",
    "estimated_hours": 8,
    "actual_hours": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Update Task</h3>
            <p className="text-gray-600 mb-2">Update an existing task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>PUT</strong> <code>/api/tasks/:id</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "todo|in_progress|done (optional)",
  "priority": "low|medium|high (optional)",
  "due_date": "YYYY-MM-DD (optional)",
  "estimated_hours": "number (optional)",
  "actual_hours": "number (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Task</h3>
            <p className="text-gray-600 mb-2">Delete a task by ID.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>DELETE</strong> <code>/api/tasks/:id</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Users API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Users API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create User</h3>
            <p className="text-gray-600 mb-2">Create a new user account.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/users</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "admin|manager|member|guest (default: member)",
  "organization_id": "number (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Users</h3>
            <p className="text-gray-600 mb-2">Retrieve all users.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/users</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "organization_id": 456,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Update User</h3>
            <p className="text-gray-600 mb-2">Update an existing user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>PUT</strong> <code>/api/users/:id</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (optional)",
  "email": "string (optional)",
  "password": "string (optional)",
  "role": "admin|manager|member|guest (optional)",
  "availability_hours": "number (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
            <p className="text-gray-600 mb-2">Delete a user by ID.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>DELETE</strong> <code>/api/users/:id</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Meetings API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Meetings API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Meeting</h3>
            <p className="text-gray-600 mb-2">Create a new meeting.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/meetings</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "title": "string (required)",
  "description": "string (optional)",
  "start_time": "ISO string (required)",
  "end_time": "ISO string (required)",
  "location": "string (optional)",
  "meeting_link": "string (optional)",
  "organizer_id": "number (required)",
  "status": "scheduled|in_progress|completed|cancelled (default: scheduled)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "meeting": {
    "id": 123,
    "title": "Team Meeting",
    "organizer_name": "John Doe"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Meetings</h3>
            <p className="text-gray-600 mb-2">Retrieve upcoming meetings for the authenticated user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/meetings</code>
            </div>
            <div className="mb-3">
              <strong>Query Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"days": "number (optional - days ahead to look, default: 7)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "title": "Team Standup",
    "description": "Daily standup meeting",
    "start_time": "2024-01-01T10:00:00.000Z",
    "end_time": "2024-01-01T10:30:00.000Z",
    "location": "Conference Room A",
    "meeting_link": null,
    "organizer_id": 456,
    "organizer_name": "John Doe",
    "status": "scheduled",
    "created_at": "2024-01-01T09:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Sprints API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sprints API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Sprint</h3>
            <p className="text-gray-600 mb-2">Create a new sprint.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/sprints</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (required)",
  "description": "string (optional)",
  "project_id": "number (required)",
  "start_date": "YYYY-MM-DD (required)",
  "end_date": "YYYY-MM-DD (required)",
  "status": "planned|active|completed|cancelled (default: planned)",
  "goal": "string (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "data": {
    "id": 123,
    "name": "Sprint 1",
    "status": "planned"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Sprints</h3>
            <p className="text-gray-600 mb-2">Retrieve sprints, optionally filtered by project.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/sprints</code>
            </div>
            <div className="mb-3">
              <strong>Query Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"projectId": "number (optional - filter by project)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "name": "Sprint 1",
    "description": "First sprint",
    "project_id": 456,
    "start_date": "2024-01-01",
    "end_date": "2024-01-14",
    "status": "active",
    "goal": "Complete user authentication",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Active Sprint</h3>
            <p className="text-gray-600 mb-2">Get the currently active sprint for a project.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/sprints/active</code>
            </div>
            <div className="mb-3">
              <strong>Query Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"projectId": "number (required)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": 123,
    "name": "Sprint 1",
    "status": "active"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Time Tracking API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Time Tracking API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Time Entry</h3>
            <p className="text-gray-600 mb-2">Log time spent on a task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>POST</strong> <code>/api/time-entries</code>
            </div>
            <div className="mb-3">
              <strong>Request Body:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "task_id": "number (required)",
  "hours_spent": "number (required)",
  "date": "YYYY-MM-DD (required)",
  "description": "string (optional)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "data": {
    "id": 123,
    "task_id": 456,
    "hours_spent": 2.5,
    "date": "2024-01-01",
    "user_name": "John Doe"
  }
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Time Entries by Task</h3>
            <p className="text-gray-600 mb-2">Retrieve all time entries for a specific task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/time-entries/task/:taskId</code>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "task_id": 456,
    "user_id": 789,
    "hours_spent": 2.5,
    "date": "2024-01-01",
    "description": "Working on user authentication",
    "user_name": "John Doe",
    "created_at": "2024-01-01T17:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get User Workload</h3>
            <p className="text-gray-600 mb-2">Get time tracking summary for the authenticated user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>GET</strong> <code>/api/time-entries/workload</code>
            </div>
            <div className="mb-3">
              <strong>Query Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"days": "number (optional - days to look back, default: 7)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "total_hours": 8.5,
    "date": "2024-01-01"
  },
  {
    "total_hours": 6.0,
    "date": "2024-01-02"
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* AI & Inference API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI & Inference API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Dispatch AI Task</h3>
            <p className="text-gray-600 mb-2">Execute various AI-powered tasks using configured models.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>dispatch-ai-task</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "taskType": "string (required)",
  "input": "any (required)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Supported Task Types:</strong>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                <li><code>risk-assessment</code> - Analyze project risks</li>
                <li><code>resource-allocation</code> - Optimize resource allocation</li>
                <li><code>release-notes</code> - Generate release notes</li>
                <li><code>meeting-summaries</code> - Summarize meeting content</li>
                <li><code>test-case-generation</code> - Generate test cases</li>
                <li><code>workflow-analysis</code> - Analyze workflows</li>
                <li><code>standup-prep</code> - Prepare standup notes</li>
                <li><code>visual-analysis</code> - Analyze visual elements</li>
                <li><code>commit-analysis</code> - Generate commit messages</li>
                <li><code>read-code</code> - Analyze code functionality</li>
              </ul>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "model": "Qwen/Qwen3-VL-4B-Instruct",
  "outputPath": "/path/to/output/file.txt",
  "status": "completed"
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Embedding</h3>
            <p className="text-gray-600 mb-2">Generate vector embeddings for text content.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>generate-embedding</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"text": "string (required - text to embed)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  0.123, 0.456, 0.789, ... // Array of float values
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-teal-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Semantic Search</h3>
            <p className="text-gray-600 mb-2">Search for content using semantic similarity.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>semantic-search</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "query": "string (required - search query)",
  "contentType": "string (optional - filter by content type)",
  "limit": "number (optional - max results, default: 10)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`[
  {
    "id": 123,
    "content_type": "task",
    "content_id": 456,
    "content_text": "Task description...",
    "similarity": 0.95,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Transcribe Audio</h3>
            <p className="text-gray-600 mb-2">Transcribe audio recordings to text.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>transcribe-audio</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"audioData": "Blob or base64 string (required)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`"Meeting Transcript - 2024-01-01T00:00:00.000Z

This is a placeholder transcript. In a production implementation..."`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Comments API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Comments API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create Comment</h3>
            <p className="text-gray-600 mb-2">Add a comment to a task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>create-comment</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "task_id": "number (required)",
  "user_id": "number (required)",
  "content": "string (required)",
  "mentions": "number[] (optional - array of mentioned user IDs)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true,
  "id": 789
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Get Comments</h3>
            <p className="text-gray-600 mb-2">Retrieve all comments for a task.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>get-comments</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"taskId": "number (required)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "success": true,
  "comments": [
    {
      "id": 789,
      "task_id": 456,
      "user_id": 123,
      "content": "Comment text",
      "mentions": [124, 125],
      "created_at": "2024-01-01T00:00:00.000Z",
      "user_name": "John Doe"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Comment</h3>
            <p className="text-gray-600 mb-2">Delete a comment by ID.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>delete-comment</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1">
{`"id": "number (required)"`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication API */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Authentication API</h2>

        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Signup</h3>
            <p className="text-gray-600 mb-2">Create a new user account.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>signup</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "role": "admin|manager|member|guest (default: member)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "success": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  },
  "token": "jwt_token_here"
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Login</h3>
            <p className="text-gray-600 mb-2">Authenticate a user.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>login</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "email": "string (required)",
  "password": "string (required)"
}`}
              </pre>
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "success": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  },
  "token": "jwt_token_here"
}`}
              </pre>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Google OAuth Signin</h3>
            <p className="text-gray-600 mb-2">Authenticate using Google OAuth.</p>
            <div className="bg-gray-100 p-3 rounded text-sm mb-2">
              <strong>Endpoint:</strong> <code>google-oauth-signin</code>
            </div>
            <div className="mb-3">
              <strong>Parameters:</strong> None required (opens OAuth flow)
            </div>
            <div className="mb-3">
              <strong>Response:</strong>
              <pre className="bg-green-50 p-3 rounded text-sm mt-1 overflow-x-auto">
{`{
  "success": true,
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member"
  },
  "token": "jwt_token_here"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Error Handling */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Handling</h2>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-red-900 mb-2">Common Error Responses</h3>
            <div className="space-y-3">
              <div>
                <strong className="text-red-800">Authentication Error:</strong>
                <pre className="bg-red-100 p-2 rounded text-sm mt-1">
{`{
  "error": "API key required"
}`}
                </pre>
              </div>

              <div>
                <strong className="text-red-800">Validation Error:</strong>
                <pre className="bg-red-100 p-2 rounded text-sm mt-1">
{`{
  "error": "Validation failed",
  "details": ["Title is required", "Email format invalid"]
}`}
                </pre>
              </div>

              <div>
                <strong className="text-red-800">Server Error:</strong>
                <pre className="bg-red-100 p-2 rounded text-sm mt-1">
{`{
  "error": "Internal server error",
  "message": "Database connection failed"
}`}
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">HTTP Status Codes</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>200:</strong> Success</li>
              <li><strong>201:</strong> Created</li>
              <li><strong>400:</strong> Bad Request</li>
              <li><strong>401:</strong> Unauthorized</li>
              <li><strong>403:</strong> Forbidden</li>
              <li><strong>404:</strong> Not Found</li>
              <li><strong>500:</strong> Internal Server Error</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Formats */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Formats & Types</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Date/Time Format</h3>
            <p className="text-gray-600 mb-2">All dates use ISO 8601 format:</p>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">YYYY-MM-DDTHH:mm:ss.sssZ</code>
            <p className="text-gray-600 mt-2">Example: <code className="bg-gray-100 px-2 py-1 rounded text-sm">2024-01-01T14:30:00.000Z</code></p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Status Values</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li><code>active</code> - Project is currently in progress</li>
              <li><code>completed</code> - Project has been finished</li>
              <li><code>on_hold</code> - Project is temporarily paused</li>
              <li><code>cancelled</code> - Project has been cancelled</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task Status Values</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li><code>todo</code> - Task has not been started</li>
              <li><code>in_progress</code> - Task is currently being worked on</li>
              <li><code>done</code> - Task has been completed</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Priority Levels</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li><code>low</code> - Low priority task</li>
              <li><code>medium</code> - Medium priority task</li>
              <li><code>high</code> - High priority task</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Roles</h3>
            <ul className="list-disc list-inside text-gray-600">
              <li><code>admin</code> - Full system access</li>
              <li><code>manager</code> - Can manage projects and users</li>
              <li><code>member</code> - Standard user access</li>
              <li><code>guest</code> - Limited read-only access</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}