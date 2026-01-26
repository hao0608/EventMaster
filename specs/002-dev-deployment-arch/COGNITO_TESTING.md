# Cognito Authentication Testing Guide
**Feature**: 002-dev-deployment-arch - Phase 5 (US3)
**Tasks**: T074-T075
**Date**: 2026-01-26

This guide walks through deploying the Cognito infrastructure and verifying the complete authentication flow.

---

## Prerequisites

- [ ] AWS CLI configured with appropriate credentials
- [ ] Terraform >= 1.5.0 installed
- [ ] Backend API running or deployable
- [ ] Frontend development environment ready

---

## Part 1: Deploy Cognito Infrastructure (T074)

### Step 1: Plan Terraform Changes

```bash
cd infra/terraform/environments/dev

# Initialize Terraform (if not already done)
terraform init

# Review the changes
terraform plan -out=tfplan

# Expected new resources:
# - aws_cognito_user_pool.main
# - aws_cognito_user_pool_client.web
# - aws_cognito_user_group.admin
# - aws_cognito_user_group.organizer
# - aws_cognito_user_group.member
```

### Step 2: Apply Terraform Changes

```bash
# Apply the changes
terraform apply tfplan

# Wait for completion (usually 1-2 minutes)
```

### Step 3: Capture Terraform Outputs

```bash
# Get all outputs
terraform output

# Save important values
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export COGNITO_CLIENT_ID=$(terraform output -raw cognito_app_client_id)
export COGNITO_REGION="ap-northeast-1"

echo "User Pool ID: $COGNITO_USER_POOL_ID"
echo "Client ID: $COGNITO_CLIENT_ID"
echo "Region: $COGNITO_REGION"
```

---

## Part 2: Create Test Users (T074)

### Create Admin User

```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username admin@eventmaster.test \
  --user-attributes \
    Name=email,Value=admin@eventmaster.test \
    Name=name,Value="Admin User" \
    Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username admin@eventmaster.test \
  --password "AdminPass123!" \
  --permanent

# Add to admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username admin@eventmaster.test \
  --group-name admin

echo "✅ Admin user created: admin@eventmaster.test / AdminPass123!"
```

### Create Organizer User

```bash
# Create organizer user
aws cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username organizer@eventmaster.test \
  --user-attributes \
    Name=email,Value=organizer@eventmaster.test \
    Name=name,Value="Organizer User" \
    Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username organizer@eventmaster.test \
  --password "OrganizerPass123!" \
  --permanent

# Add to organizer group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username organizer@eventmaster.test \
  --group-name organizer

echo "✅ Organizer user created: organizer@eventmaster.test / OrganizerPass123!"
```

### Create Member User

```bash
# Create member user
aws cognito-idp admin-create-user \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username member@eventmaster.test \
  --user-attributes \
    Name=email,Value=member@eventmaster.test \
    Name=name,Value="Member User" \
    Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username member@eventmaster.test \
  --password "MemberPass123!" \
  --permanent

# Add to member group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --username member@eventmaster.test \
  --group-name member

echo "✅ Member user created: member@eventmaster.test / MemberPass123!"
```

### Verify Users Created

```bash
# List all users
aws cognito-idp list-users \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --query 'Users[*].[Username,UserStatus,Enabled]' \
  --output table

# Verify groups
for group in admin organizer member; do
  echo "=== $group group members ==="
  aws cognito-idp list-users-in-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --group-name "$group" \
    --query 'Users[*].Username' \
    --output text
done
```

---

## Part 3: Configure Backend Environment (T074)

### Update Backend .env

```bash
cd apps/api

# Create or update .env file
cat > .env <<EOF
# Application
APP_NAME=EventMaster API
DEBUG=True
ENVIRONMENT=development

# Database (use existing or update)
DATABASE_URL=sqlite:///./eventmaster.db

# JWT Authentication (legacy - still needed for backwards compatibility)
SECRET_KEY=dev-secret-key-$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
COGNITO_REGION=$COGNITO_REGION

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=DEBUG
EOF

echo "✅ Backend .env configured"
```

### Start Backend API

```bash
# Install dependencies if needed
pip install -r requirements.txt

# Start the API
uvicorn main:app --reload --port 8000

# In another terminal, verify health check
curl http://localhost:8000/health
```

---

## Part 4: Configure Frontend Environment (T074)

### Update Frontend .env

```bash
cd apps/web

# Create .env.local file
cat > .env.local <<EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_REGION=$COGNITO_REGION

# Environment
VITE_ENVIRONMENT=dev
EOF

echo "✅ Frontend .env.local configured"
```

### Install Dependencies and Start Frontend

```bash
# Install dependencies (including amazon-cognito-identity-js)
npm install

# Start development server
npm run dev

# Frontend should be available at http://localhost:5173
```

---

## Part 5: Verification Tests (T075)

### Test 1: CLI Authentication Test

Test Cognito authentication using AWS CLI:

```bash
# Test admin user authentication
TOKEN_RESPONSE=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --client-id "$COGNITO_CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters \
    USERNAME=admin@eventmaster.test,PASSWORD=AdminPass123!)

# Extract access token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
ID_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.AuthenticationResult.IdToken')

echo "Access Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
echo "ID Token (first 50 chars): ${ID_TOKEN:0:50}..."

# Decode and inspect token (optional - use jwt.io or a script)
echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

### Test 2: Backend API Authentication Test

Test that the backend accepts Cognito tokens:

```bash
# Get token for admin user
ACCESS_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --client-id "$COGNITO_CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@eventmaster.test,PASSWORD=AdminPass123! \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

# Test /auth/me endpoint
echo "=== Testing /auth/me with Cognito token ==="
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8000/auth/me | jq .

# Expected response:
# {
#   "id": "<cognito-sub>",
#   "email": "admin@eventmaster.test",
#   "displayName": "Admin User",
#   "role": "admin"
# }
```

### Test 3: RBAC Verification

Test role-based access control with different user roles:

```bash
# Function to get token for a user
get_token() {
  local username=$1
  local password=$2
  aws cognito-idp admin-initiate-auth \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --client-id "$COGNITO_CLIENT_ID" \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME="$username",PASSWORD="$password" \
    --query 'AuthenticationResult.AccessToken' \
    --output text
}

# Get tokens for each user
ADMIN_TOKEN=$(get_token "admin@eventmaster.test" "AdminPass123!")
ORGANIZER_TOKEN=$(get_token "organizer@eventmaster.test" "OrganizerPass123!")
MEMBER_TOKEN=$(get_token "member@eventmaster.test" "MemberPass123!")

# Test admin-only endpoint (e.g., /users - if exists)
echo "=== Admin accessing /users ==="
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8000/users | jq .

echo "=== Organizer accessing /users (should fail) ==="
curl -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  http://localhost:8000/users | jq .

echo "=== Member accessing /users (should fail) ==="
curl -H "Authorization: Bearer $MEMBER_TOKEN" \
  http://localhost:8000/users | jq .

# Test organizer-only endpoint (e.g., /events POST)
echo "=== Organizer creating event ==="
curl -X POST -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","startAt":"2026-02-01T10:00:00Z","capacity":100}' \
  http://localhost:8000/events | jq .

echo "=== Member creating event (should fail) ==="
curl -X POST -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","startAt":"2026-02-01T10:00:00Z","capacity":100}' \
  http://localhost:8000/events | jq .
```

### Test 4: Frontend Login Test

**Manual Test Steps:**

1. **Open Browser**:
   - Navigate to `http://localhost:5173`

2. **Test Admin Login**:
   - Email: `admin@eventmaster.test`
   - Password: `AdminPass123!`
   - Expected: Successful login, redirected to events page
   - Verify: User profile shows "Admin User" with admin role

3. **Test Navigation**:
   - Verify admin can access all pages (Events, My Tickets, Admin Users, etc.)
   - Check that admin-only pages are accessible

4. **Test Logout**:
   - Click logout
   - Verify user is logged out and redirected to login page

5. **Test Organizer Login**:
   - Email: `organizer@eventmaster.test`
   - Password: `OrganizerPass123!`
   - Expected: Successful login
   - Verify: Can create events, view attendees, verify tickets
   - Verify: Cannot access admin-only pages

6. **Test Member Login**:
   - Email: `member@eventmaster.test`
   - Password: `MemberPass123!`
   - Expected: Successful login
   - Verify: Can view events and register
   - Verify: Cannot create events or access admin pages

### Test 5: Token Refresh Test

Test automatic token refresh:

```bash
# Get initial tokens
TOKEN_RESPONSE=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --client-id "$COGNITO_CLIENT_ID" \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@eventmaster.test,PASSWORD=AdminPass123!)

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.AuthenticationResult.RefreshToken')

# Use refresh token to get new access token
NEW_TOKEN_RESPONSE=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --client-id "$COGNITO_CLIENT_ID" \
  --auth-flow REFRESH_TOKEN_AUTH \
  --auth-parameters REFRESH_TOKEN="$REFRESH_TOKEN")

NEW_ACCESS_TOKEN=$(echo "$NEW_TOKEN_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')

# Verify new token works
curl -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  http://localhost:8000/auth/me | jq .

echo "✅ Token refresh working"
```

---

## Part 6: Verification Checklist (T075)

Complete this checklist to verify all aspects of Cognito integration:

### Infrastructure
- [ ] Cognito User Pool created
- [ ] Cognito App Client created (no secret)
- [ ] Three groups created (admin, organizer, member)
- [ ] Terraform outputs include pool ID and client ID

### Test Users
- [ ] Admin user created and in admin group
- [ ] Organizer user created and in organizer group
- [ ] Member user created and in member group
- [ ] All users have permanent passwords set

### Backend Integration
- [ ] Backend .env configured with Cognito credentials
- [ ] Backend starts without errors
- [ ] `/health` endpoint responds
- [ ] JWKS cache fetches keys successfully (check logs)

### Authentication Flow
- [ ] Cognito tokens can be obtained via AWS CLI
- [ ] Backend accepts and validates Cognito tokens
- [ ] `/auth/me` endpoint returns correct user info
- [ ] User role extracted from `cognito:groups` claim
- [ ] Auto-user creation works for new Cognito users

### RBAC (Role-Based Access Control)
- [ ] Admin can access admin-only endpoints
- [ ] Organizer can access organizer endpoints
- [ ] Member has limited access (cannot create events)
- [ ] Proper 403 Forbidden responses for unauthorized access

### Frontend Integration
- [ ] Frontend .env.local configured
- [ ] Frontend builds without errors
- [ ] Login page accepts Cognito credentials
- [ ] Admin login successful
- [ ] Organizer login successful
- [ ] Member login successful
- [ ] Logout works correctly
- [ ] Session restoration works on page refresh
- [ ] Role-based UI rendering works

### Token Management
- [ ] Access tokens are 1 hour validity
- [ ] Refresh tokens work
- [ ] Expired tokens are rejected
- [ ] Token refresh functionality works

---

## Expected Results

### Successful Authentication Response

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "admin@eventmaster.test",
  "displayName": "Admin User",
  "role": "admin"
}
```

### Successful RBAC Response

**Admin accessing /users (200 OK)**:
```json
[
  {
    "id": "...",
    "email": "admin@eventmaster.test",
    "role": "admin"
  }
]
```

**Member accessing /users (403 Forbidden)**:
```json
{
  "detail": "Insufficient permissions. Required roles: admin"
}
```

---

## Troubleshooting

### Issue: "User pool not found"
**Solution**: Verify Terraform apply completed successfully and pool ID is correct.

### Issue: "Token signature verification failed"
**Solution**:
- Check COGNITO_REGION matches the User Pool region
- Verify JWKS URL is accessible
- Check backend logs for JWKS fetch errors

### Issue: "cognito:groups claim not found"
**Solution**: Verify user is added to a group using AWS CLI.

### Issue: "Frontend can't connect to backend"
**Solution**:
- Verify VITE_API_BASE_URL is correct
- Check CORS configuration in backend
- Verify backend is running on port 8000

### Issue: "Role not updating"
**Solution**:
- Clear localStorage in browser
- Re-login to get fresh token with updated groups
- Verify user is in correct Cognito group

---

## Cleanup (Optional)

To remove test users after testing:

```bash
# Delete test users
for user in admin@eventmaster.test organizer@eventmaster.test member@eventmaster.test; do
  aws cognito-idp admin-delete-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$user"
  echo "Deleted: $user"
done
```

To destroy Cognito infrastructure (careful!):

```bash
cd infra/terraform/environments/dev
terraform destroy -target=module.cognito
```

---

## Success Criteria

✅ **T074 Complete** when:
- Cognito infrastructure deployed
- Three test users created with appropriate groups
- Backend and frontend configured with Cognito credentials

✅ **T075 Complete** when:
- All authentication tests pass
- RBAC works correctly for all three roles
- Frontend login flow works end-to-end
- Token refresh works
- All items in verification checklist are checked

---

**Next Steps After Verification**:
- Mark T074 and T075 as complete in tasks.md
- Commit verification documentation
- Proceed to Phase 7 (SSO) or Phase 8 (Polish)
