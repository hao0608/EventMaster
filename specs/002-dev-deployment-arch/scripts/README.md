# Test Scripts for Cognito Integration

This directory contains automation scripts for testing the Cognito authentication integration (Phase 5, US3).

## Scripts

### 1. `create-test-users.sh`

Creates test users in Cognito User Pool and configures environment variables.

**What it does:**
- Fetches Cognito configuration from Terraform outputs
- Creates three test users (admin, organizer, member)
- Assigns users to appropriate Cognito groups
- Updates backend `.env` file with Cognito credentials
- Creates frontend `.env.local` file with Cognito credentials

**Prerequisites:**
- Terraform infrastructure deployed (`terraform apply` completed)
- AWS CLI configured with appropriate permissions

**Usage:**
```bash
# Run from repository root
./specs/002-dev-deployment-arch/scripts/create-test-users.sh
```

**Output:**
- Test users created in Cognito
- `apps/api/.env` updated with Cognito configuration
- `apps/web/.env.local` created with Cognito configuration

**Test Credentials Created:**
- Admin: `admin@eventmaster.test` / `AdminPass123!`
- Organizer: `organizer@eventmaster.test` / `OrganizerPass123!`
- Member: `member@eventmaster.test` / `MemberPass123!`

---

### 2. `verify-cognito-auth.sh`

Runs automated verification tests for Cognito authentication.

**What it tests:**
1. Backend API health check
2. Token acquisition from Cognito
3. Token verification by backend
4. User auto-creation from Cognito tokens
5. Role-based access control (RBAC)
6. Token claims verification
7. JWKS endpoint accessibility

**Prerequisites:**
- Cognito infrastructure deployed
- Test users created (run `create-test-users.sh` first)
- Backend API running on `http://localhost:8000`

**Usage:**
```bash
# Start backend API first
cd apps/api
uvicorn main:app --reload

# In another terminal, run tests from repository root
./specs/002-dev-deployment-arch/scripts/verify-cognito-auth.sh
```

**Custom API URL:**
```bash
# If backend is running on a different URL
API_BASE_URL=http://localhost:3000 ./specs/002-dev-deployment-arch/scripts/verify-cognito-auth.sh
```

**Output:**
- Test results with pass/fail status
- Summary of tests passed and failed
- Exit code 0 if all tests pass, 1 if any fail

---

## Quick Start

Complete workflow for testing Cognito integration:

```bash
# 1. Deploy Cognito infrastructure
cd infra/terraform/environments/dev
terraform plan -out=tfplan
terraform apply tfplan
cd ../../..

# 2. Create test users
./specs/002-dev-deployment-arch/scripts/create-test-users.sh

# 3. Start backend API
cd apps/api
uvicorn main:app --reload &
cd ../..

# 4. Run verification tests
./specs/002-dev-deployment-arch/scripts/verify-cognito-auth.sh

# 5. Test frontend manually
cd apps/web
npm install
npm run dev
# Open http://localhost:5173 and test login
```

---

## Manual Testing

For comprehensive testing beyond automated scripts, see:
- [COGNITO_TESTING.md](../COGNITO_TESTING.md) - Complete manual testing guide

---

## Troubleshooting

### Script fails with "Terraform state not found"
**Solution**: Run `terraform apply` first to deploy Cognito infrastructure.

### Script fails with "AWS CLI not configured"
**Solution**: Configure AWS CLI with `aws configure` or set environment variables.

### Verification script reports "API not running"
**Solution**: Start the backend API first:
```bash
cd apps/api && uvicorn main:app --reload
```

### Tests fail with "401 Unauthorized"
**Solution**:
1. Check backend logs for JWKS fetch errors
2. Verify COGNITO_USER_POOL_ID and COGNITO_REGION are correct
3. Ensure backend .env file was updated by create-test-users.sh

### Tests fail with "403 Forbidden" for expected-passing tests
**Solution**:
1. Verify users are in correct Cognito groups
2. Check that backend correctly extracts roles from cognito:groups
3. Review backend deps.py for role extraction logic

---

## Cleanup

To remove test users after testing:

```bash
cd infra/terraform/environments/dev
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
cd ../../..

for user in admin@eventmaster.test organizer@eventmaster.test member@eventmaster.test; do
  aws cognito-idp admin-delete-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$user"
done
```

---

## Related Documentation

- [COGNITO_TESTING.md](../COGNITO_TESTING.md) - Complete testing guide with manual steps
- [tasks.md](../tasks.md) - Task list (T074-T075)
- [quickstart.md](../quickstart.md) - Deployment quickstart guide
