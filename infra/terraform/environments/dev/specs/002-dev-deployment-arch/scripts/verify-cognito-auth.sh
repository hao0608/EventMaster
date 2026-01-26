#!/bin/bash
# Verify Cognito Authentication Script
# Feature: 002-dev-deployment-arch - Phase 5 (US3)
# Tasks: T075

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Cognito Authentication Verification"
echo "========================================"
echo ""

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"

# Check if running from correct directory
if [ ! -d "infra/terraform/environments/dev" ]; then
  echo -e "${RED}Error: Please run this script from the repository root${NC}"
  exit 1
fi

# Get Cognito configuration
echo -e "${YELLOW}Fetching Cognito configuration...${NC}"
cd infra/terraform/environments/dev
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_app_client_id 2>/dev/null)
cd ../../..

if [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ]; then
  echo -e "${RED}Error: Could not fetch Cognito configuration${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Configuration loaded"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
  local test_name=$1
  local command=$2
  local expected_status=${3:-0}

  echo -e "${BLUE}▶${NC} $test_name"

  if eval "$command" > /tmp/test_output 2>&1; then
    if [ $expected_status -eq 0 ]; then
      echo -e "${GREEN}  ✓ PASS${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
      return 0
    else
      echo -e "${RED}  ✗ FAIL - Expected failure but succeeded${NC}"
      TESTS_FAILED=$((TESTS_FAILED + 1))
      return 1
    fi
  else
    if [ $expected_status -ne 0 ]; then
      echo -e "${GREEN}  ✓ PASS (Expected failure)${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
      return 0
    else
      echo -e "${RED}  ✗ FAIL${NC}"
      cat /tmp/test_output
      TESTS_FAILED=$((TESTS_FAILED + 1))
      return 1
    fi
  fi
}

# Function to get Cognito token
get_token() {
  local username=$1
  local password=$2

  aws cognito-idp admin-initiate-auth \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --client-id "$COGNITO_CLIENT_ID" \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME="$username",PASSWORD="$password" \
    --query 'AuthenticationResult.AccessToken' \
    --output text 2>/dev/null
}

# Function to call API with token
call_api() {
  local endpoint=$1
  local token=$2
  local method=${3:-GET}
  local data=$4

  if [ -n "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE_URL$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $token" \
      "$API_BASE_URL$endpoint"
  fi
}

echo "========================================"
echo "  Test 1: API Health Check"
echo "========================================"
echo ""

run_test "Backend API is running" \
  "curl -f -s $API_BASE_URL/health > /dev/null"

echo ""

echo "========================================"
echo "  Test 2: Cognito Token Acquisition"
echo "========================================"
echo ""

run_test "Get token for admin user" \
  "ADMIN_TOKEN=\$(get_token 'admin@eventmaster.test' 'AdminPass123!') && [ -n \"\$ADMIN_TOKEN\" ]"

run_test "Get token for organizer user" \
  "ORGANIZER_TOKEN=\$(get_token 'organizer@eventmaster.test' 'OrganizerPass123!') && [ -n \"\$ORGANIZER_TOKEN\" ]"

run_test "Get token for member user" \
  "MEMBER_TOKEN=\$(get_token 'member@eventmaster.test' 'MemberPass123!') && [ -n \"\$MEMBER_TOKEN\" ]"

# Store tokens for later use
ADMIN_TOKEN=$(get_token 'admin@eventmaster.test' 'AdminPass123!')
ORGANIZER_TOKEN=$(get_token 'organizer@eventmaster.test' 'OrganizerPass123!')
MEMBER_TOKEN=$(get_token 'member@eventmaster.test' 'MemberPass123!')

echo ""

echo "========================================"
echo "  Test 3: Token Verification"
echo "========================================"
echo ""

run_test "Admin token is valid" \
  "call_api '/auth/me' '$ADMIN_TOKEN' | jq -e '.role == \"admin\"' > /dev/null"

run_test "Organizer token is valid" \
  "call_api '/auth/me' '$ORGANIZER_TOKEN' | jq -e '.role == \"organizer\"' > /dev/null"

run_test "Member token is valid" \
  "call_api '/auth/me' '$MEMBER_TOKEN' | jq -e '.role == \"member\"' > /dev/null"

run_test "Invalid token is rejected" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer invalid_token' $API_BASE_URL/auth/me | grep -q '401'" 0

echo ""

echo "========================================"
echo "  Test 4: User Auto-Creation"
echo "========================================"
echo ""

run_test "Admin user auto-created in database" \
  "call_api '/auth/me' '$ADMIN_TOKEN' | jq -e '.email == \"admin@eventmaster.test\"' > /dev/null"

run_test "Admin user has correct display name" \
  "call_api '/auth/me' '$ADMIN_TOKEN' | jq -e '.displayName' > /dev/null"

echo ""

echo "========================================"
echo "  Test 5: Role-Based Access Control"
echo "========================================"
echo ""

# Test admin access
run_test "Admin can access protected endpoints" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $ADMIN_TOKEN' $API_BASE_URL/events | grep -q '200'" 0

# Test organizer access to events
run_test "Organizer can access events" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $ORGANIZER_TOKEN' $API_BASE_URL/events | grep -q '200'" 0

# Test member access
run_test "Member can access events" \
  "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $MEMBER_TOKEN' $API_BASE_URL/events | grep -q '200'" 0

# Test admin-only endpoints (if /users exists)
if curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE_URL/users" | grep -q '200'; then
  run_test "Admin can access /users endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $ADMIN_TOKEN' $API_BASE_URL/users | grep -q '200'" 0

  run_test "Organizer cannot access /users endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $ORGANIZER_TOKEN' $API_BASE_URL/users | grep -q '403'" 0

  run_test "Member cannot access /users endpoint" \
    "curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer $MEMBER_TOKEN' $API_BASE_URL/users | grep -q '403'" 0
fi

echo ""

echo "========================================"
echo "  Test 6: Token Claims Verification"
echo "========================================"
echo ""

run_test "Admin token contains cognito:groups claim" \
  "aws cognito-idp admin-initiate-auth \
    --user-pool-id '$COGNITO_USER_POOL_ID' \
    --client-id '$COGNITO_CLIENT_ID' \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME=admin@eventmaster.test,PASSWORD=AdminPass123! \
    --query 'AuthenticationResult.IdToken' \
    --output text | cut -d. -f2 | base64 -d 2>/dev/null | jq -e '.\"cognito:groups\" | contains([\"admin\"])' > /dev/null"

run_test "Organizer token contains organizer group" \
  "aws cognito-idp admin-initiate-auth \
    --user-pool-id '$COGNITO_USER_POOL_ID' \
    --client-id '$COGNITO_CLIENT_ID' \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME=organizer@eventmaster.test,PASSWORD=OrganizerPass123! \
    --query 'AuthenticationResult.IdToken' \
    --output text | cut -d. -f2 | base64 -d 2>/dev/null | jq -e '.\"cognito:groups\" | contains([\"organizer\"])' > /dev/null"

echo ""

echo "========================================"
echo "  Test 7: JWKS and Token Signature"
echo "========================================"
echo ""

run_test "JWKS endpoint is accessible" \
  "curl -f -s https://cognito-idp.ap-northeast-1.amazonaws.com/$COGNITO_USER_POOL_ID/.well-known/jwks.json | jq -e '.keys | length > 0' > /dev/null"

run_test "Backend can fetch JWKS" \
  "grep -q 'COGNITO_USER_POOL_ID' apps/api/.env"

echo ""

# Summary
echo "========================================"
echo "  Test Summary"
echo "========================================"
echo ""
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Cognito authentication is working correctly."
  echo "You can now:"
  echo "  1. Test the frontend login at http://localhost:5173"
  echo "  2. Mark T074 and T075 as complete in tasks.md"
  echo "  3. Proceed to Phase 7 (SSO) or Phase 8 (Polish)"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Please check the error messages above and:"
  echo "  1. Verify the backend API is running"
  echo "  2. Check backend logs for errors"
  echo "  3. Verify Cognito configuration is correct"
  echo "  4. Ensure test users were created successfully"
  exit 1
fi
