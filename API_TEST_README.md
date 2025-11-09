# API Testing Script

This script provides comprehensive testing for all API endpoints in the Ascendia PM application.

## Prerequisites

1. **Start the application** in development mode:
   ```bash
   npm run electron:dev
   ```

2. **Ensure the API server is running** on `http://localhost:3069`

## Running the Tests

**Important**: The API server must be running before running tests.

1. **Start the application** in development mode:
   ```bash
   npm run electron:dev
   ```

2. **In a separate terminal**, run the API tests:
   ```bash
   npm run test:api
   ```

Or run directly:
```bash
node test-api.js
```

The script will automatically check if the server is running and provide clear error messages if it's not.

## What the Script Tests

The script tests all available API endpoints:

### 🔓 Public Endpoints (No Authentication Required)
- **Health Check**: `GET /health`
- **Authentication**:
  - `POST /api/auth/signup` - User registration
  - `POST /api/auth/login` - User login
  - `POST /api/auth/validate-email` - Email validation
  - `POST /api/auth/check-email` - Check email existence

### 🔐 Protected Endpoints (Authentication Required)
- **Database**: `POST /api/db-query` - Direct database queries
- **Users**: `GET /api/users` - Get all users
- **Projects**:
  - `POST /api/projects` - Create project
  - `GET /api/projects` - Get user's projects
  - `PUT /api/projects/:id` - Update project
  - `DELETE /api/projects/:id` - Delete project
- **Tasks**:
  - `POST /api/tasks` - Create task
  - `GET /api/tasks` - Get tasks (by project)
  - `PUT /api/tasks/:id` - Update task
  - `DELETE /api/tasks/:id` - Delete task
- **Comments**:
  - `POST /api/comments` - Create comment
  - `GET /api/comments/:taskId` - Get comments for task
  - `DELETE /api/comments/:id` - Delete comment
- **Bugs**:
  - `POST /api/bugs` - Create bug report
  - `GET /api/bugs` - Get all bugs
  - `GET /api/bugs/:oid` - Get specific bug
  - `PUT /api/bugs/:oid` - Update bug
- **Settings**:
  - `GET /api/settings` - Get settings
  - `POST /api/settings` - Create setting
  - `PUT /api/settings/:id` - Update setting
  - `DELETE /api/settings/:id` - Delete setting
- **API Keys**:
  - `POST /api/api-keys` - Create API key
  - `GET /api/api-keys` - Get API keys
  - `DELETE /api/api-keys/:id` - Delete API key
- **Appointments**:
  - `GET /api/appointments` - Get appointments
  - `POST /api/appointments` - Create appointment
  - `PUT /api/appointments/:id` - Update appointment
  - `DELETE /api/appointments/:id` - Delete appointment
- **AI Features** (may fail if inference server not running):
  - `GET /api/ai/inference/config` - Get inference server config
  - `POST /api/ai/inference/config` - Save inference server config
  - `POST /api/ai/inference/test-connection` - Test inference server connection
  - `GET /api/ai/inference/models` - Get available models
  - `POST /api/ai/inference/summary` - Get text summary
  - `POST /api/ai/dispatch-task` - Dispatch AI task

## Test Flow

1. **Health Check** - Verifies API server is running
2. **Authentication** - Tests signup/login (creates test user if needed)
3. **Data Operations** - Tests CRUD operations for all entities
4. **AI Features** - Tests AI-related endpoints (may fail if services not available)
5. **Cleanup** - Removes all test data created during testing

## Test Results

The script provides:
- **Real-time output** showing pass/fail status for each test
- **Detailed error messages** for failed tests
- **Response data** for successful tests
- **Summary statistics** at the end
- **JSON results file** saved to `api-test-results.json`

## Expected Behavior

- **Server Check**: Script automatically verifies the API server is running
- **Authentication**: Creates test user if login fails, handles auth automatically
- **Comprehensive Testing**: Tests 25+ API endpoints including all CRUD operations
- **AI Tests**: May fail if inference server/other AI services aren't running (expected)
- **Data Cleanup**: All test data is automatically removed after testing
- **Detailed Reporting**: JSON results file + console output with error details
- **CI/CD Ready**: Can be integrated into automated testing pipelines

## Troubleshooting

### Common Issues:

1. **"API server is not running"**:
   ```bash
   # Start the app first
   npm run electron:dev
   # Then run tests in another terminal
   npm run test:api
   ```

2. **"Connection refused" errors**:
   - Verify API server is on port 3069
   - Check firewall/antivirus isn't blocking connections

3. **Authentication failures**:
   - Script automatically creates test user if login fails
   - Check database connectivity if signup fails

4. **AI endpoint failures**:
   - Expected if inference server/other AI services aren't running
   - Tests continue despite AI failures

5. **Database errors**:
   - Ensure database file exists and is writable
   - Check app has proper database permissions
   - Verify SQLite/sql.js is working correctly

6. **Timeout errors**:
   - Increase timeout in test script if needed
   - Check system performance/load

## Configuration

You can modify the test script to:
- Change the API base URL (default: `http://localhost:3069`)
- Add custom test data
- Skip specific tests
- Modify authentication credentials

## Integration with CI/CD

This script can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    npm run electron:dev &
    sleep 10
    npm run test:api
```

## Output Example

```
🚀 Starting API Endpoint Tests

API Base URL: http://localhost:3069
==================================================
[PASS] Health Check
[PASS] User Signup
[PASS] User Login
[PASS] Validate Email
...
==================================================
📊 Test Results Summary:
✅ Passed: 25
❌ Failed: 2
📈 Total: 27

📄 Detailed results saved to: api-test-results.json
[FAIL] Get Inference Server Config (expected if inference server not running)
```