#!/bin/bash
# Create Cognito Test Users Script
# Feature: 002-dev-deployment-arch - Phase 5 (US3)
# Tasks: T074

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Cognito Test Users Creation Script"
echo "========================================"
echo ""

# Check if running from correct directory
if [ ! -d "infra/terraform/environments/dev" ]; then
  echo -e "${RED}Error: Please run this script from the repository root${NC}"
  exit 1
fi

# Get Cognito configuration from Terraform outputs
echo -e "${YELLOW}Fetching Cognito configuration from Terraform...${NC}"
cd infra/terraform/environments/dev

if [ ! -f "terraform.tfstate" ]; then
  echo -e "${RED}Error: Terraform state not found. Please run 'terraform apply' first.${NC}"
  exit 1
fi

COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_app_client_id 2>/dev/null)
COGNITO_REGION="ap-northeast-1"

if [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ]; then
  echo -e "${RED}Error: Could not fetch Cognito configuration from Terraform outputs${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} User Pool ID: $COGNITO_USER_POOL_ID"
echo -e "${GREEN}✓${NC} Client ID: $COGNITO_CLIENT_ID"
echo -e "${GREEN}✓${NC} Region: $COGNITO_REGION"
echo ""

cd ../../..

# Function to create user
create_user() {
  local email=$1
  local password=$2
  local name=$3
  local group=$4

  echo -e "${YELLOW}Creating user: $email${NC}"

  # Check if user already exists
  if aws cognito-idp admin-get-user \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    > /dev/null 2>&1; then
    echo -e "${YELLOW}  User already exists, skipping creation${NC}"
  else
    # Create user
    aws cognito-idp admin-create-user \
      --user-pool-id "$COGNITO_USER_POOL_ID" \
      --username "$email" \
      --user-attributes \
        Name=email,Value="$email" \
        Name=name,Value="$name" \
        Name=email_verified,Value=true \
      --message-action SUPPRESS \
      > /dev/null 2>&1

    echo -e "${GREEN}  ✓ User created${NC}"
  fi

  # Set permanent password
  aws cognito-idp admin-set-user-password \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --password "$password" \
    --permanent \
    > /dev/null 2>&1

  echo -e "${GREEN}  ✓ Password set${NC}"

  # Add to group
  aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --username "$email" \
    --group-name "$group" \
    > /dev/null 2>&1

  echo -e "${GREEN}  ✓ Added to $group group${NC}"
  echo ""
}

# Create test users
echo "========================================"
echo "  Creating Test Users"
echo "========================================"
echo ""

create_user "admin@eventmaster.test" "AdminPass123!" "Admin User" "admin"
create_user "organizer@eventmaster.test" "OrganizerPass123!" "Organizer User" "organizer"
create_user "member@eventmaster.test" "MemberPass123!" "Member User" "member"

# Verify users
echo "========================================"
echo "  Verification"
echo "========================================"
echo ""

echo -e "${YELLOW}Listing all users in pool:${NC}"
aws cognito-idp list-users \
  --user-pool-id "$COGNITO_USER_POOL_ID" \
  --query 'Users[*].[Username,UserStatus,Enabled]' \
  --output table

echo ""
echo -e "${YELLOW}Verifying group memberships:${NC}"
for group in admin organizer member; do
  echo -e "${YELLOW}  $group group:${NC}"
  members=$(aws cognito-idp list-users-in-group \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --group-name "$group" \
    --query 'Users[*].Username' \
    --output text)
  echo "    $members"
done

echo ""
echo "========================================"
echo "  Test Users Created Successfully!"
echo "========================================"
echo ""
echo "Test User Credentials:"
echo ""
echo "  Admin User:"
echo "    Email: admin@eventmaster.test"
echo "    Password: AdminPass123!"
echo "    Role: admin"
echo ""
echo "  Organizer User:"
echo "    Email: organizer@eventmaster.test"
echo "    Password: OrganizerPass123!"
echo "    Role: organizer"
echo ""
echo "  Member User:"
echo "    Email: member@eventmaster.test"
echo "    Password: MemberPass123!"
echo "    Role: member"
echo ""

# Update backend .env file
echo -e "${YELLOW}Updating backend .env file...${NC}"
if [ ! -f "apps/api/.env" ]; then
  echo -e "${YELLOW}Creating new .env file from .env.example${NC}"
  cp apps/api/.env.example apps/api/.env
fi

# Update or add Cognito configuration
if grep -q "COGNITO_USER_POOL_ID" apps/api/.env; then
  sed -i.bak "s|^COGNITO_USER_POOL_ID=.*|COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID|" apps/api/.env
  sed -i.bak "s|^COGNITO_CLIENT_ID=.*|COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID|" apps/api/.env
  sed -i.bak "s|^COGNITO_REGION=.*|COGNITO_REGION=$COGNITO_REGION|" apps/api/.env
  rm apps/api/.env.bak
else
  echo "" >> apps/api/.env
  echo "# AWS Cognito Configuration (Auto-updated by script)" >> apps/api/.env
  echo "COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID" >> apps/api/.env
  echo "COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID" >> apps/api/.env
  echo "COGNITO_REGION=$COGNITO_REGION" >> apps/api/.env
fi

echo -e "${GREEN}✓${NC} Backend .env updated"

# Update frontend .env.local file
echo -e "${YELLOW}Updating frontend .env.local file...${NC}"
cat > apps/web/.env.local <<EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# AWS Cognito Configuration (Auto-updated by script)
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_REGION=$COGNITO_REGION

# Environment
VITE_ENVIRONMENT=dev
EOF

echo -e "${GREEN}✓${NC} Frontend .env.local updated"
echo ""

echo "========================================"
echo "  Next Steps"
echo "========================================"
echo ""
echo "1. Start the backend API:"
echo "   cd apps/api"
echo "   uvicorn main:app --reload"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd apps/web"
echo "   npm install  # If not already done"
echo "   npm run dev"
echo ""
echo "3. Test login at http://localhost:5173"
echo ""
echo "4. Run API tests using the verification script:"
echo "   ./specs/002-dev-deployment-arch/scripts/verify-cognito-auth.sh"
echo ""
