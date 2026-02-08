#!/bin/bash

# GameSphere Infrastructure Deployment Script
# Usage: ./deploy.sh <environment> [region]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
PROJECT_NAME="gamesphere"
ENVIRONMENT="${1:-dev}"
REGION="${2:-ap-southeast-2}"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  GameSphere Infrastructure Deploy${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Stack Name: ${YELLOW}${STACK_NAME}${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "AWS Account: ${YELLOW}${ACCOUNT_ID}${NC}"
echo ""

# Create S3 bucket for CloudFormation templates
CFN_BUCKET="${PROJECT_NAME}-cfn-templates"
echo -e "${YELLOW}Creating/checking S3 bucket for templates...${NC}"

if ! aws s3api head-bucket --bucket "${CFN_BUCKET}" 2>/dev/null; then
    aws s3 mb "s3://${CFN_BUCKET}" --region "${REGION}"
    echo -e "${GREEN}Created bucket: ${CFN_BUCKET}${NC}"
else
    echo -e "${GREEN}Bucket exists: ${CFN_BUCKET}${NC}"
fi

# Upload templates to S3
echo ""
echo -e "${YELLOW}Uploading templates to S3...${NC}"

aws s3 sync "${SCRIPT_DIR}" "s3://${CFN_BUCKET}/templates/" \
    --exclude "*.sh" \
    --exclude "*.md" \
    --exclude ".DS_Store"
echo -e "${GREEN}Templates uploaded${NC}"

# Function to deploy a stack
deploy_stack() {
    local stack_name=$1
    local template=$2
    local params=$3
    
    echo ""
    echo -e "${YELLOW}Deploying ${stack_name}...${NC}"
    
    if aws cloudformation describe-stacks --stack-name "${stack_name}" --region "${REGION}" &> /dev/null; then
        echo "Stack exists, updating..."
        ACTION="update"
    else
        echo "Creating new stack..."
        ACTION="create"
    fi
    
    aws cloudformation deploy \
        --template-file "${template}" \
        --stack-name "${stack_name}" \
        --parameter-overrides ${params} \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
        --region "${REGION}" \
        --tags Project="${PROJECT_NAME}" Environment="${ENVIRONMENT}" \
        --no-fail-on-empty-changeset
    
    echo -e "${GREEN}${stack_name} deployed successfully${NC}"
}

# Deploy Cognito Stack
deploy_stack \
    "${STACK_NAME}-cognito" \
    "${SCRIPT_DIR}/cognito.yaml" \
    "Environment=${ENVIRONMENT} ProjectName=${PROJECT_NAME}"

# Get Cognito outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-cognito" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-cognito" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
    --output text)

IDENTITY_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-cognito" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='IdentityPoolId'].OutputValue" \
    --output text)

echo -e "User Pool ID: ${YELLOW}${USER_POOL_ID}${NC}"
echo -e "User Pool Client ID: ${YELLOW}${USER_POOL_CLIENT_ID}${NC}"

# Deploy DynamoDB Stack
deploy_stack \
    "${STACK_NAME}-dynamodb" \
    "${SCRIPT_DIR}/dynamodb.yaml" \
    "Environment=${ENVIRONMENT} ProjectName=${PROJECT_NAME}"

# Get DynamoDB outputs
get_table_output() {
    local output_key=$1
    aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}-dynamodb" \
        --region "${REGION}" \
        --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue" \
        --output text
}

USERS_TABLE_NAME=$(get_table_output "UsersTableName")
USERS_TABLE_ARN=$(get_table_output "UsersTableArn")
GAMES_TABLE_NAME=$(get_table_output "GamesTableName")
GAMES_TABLE_ARN=$(get_table_output "GamesTableArn")
FRIENDS_TABLE_NAME=$(get_table_output "FriendsTableName")
FRIENDS_TABLE_ARN=$(get_table_output "FriendsTableArn")
SESSIONS_TABLE_NAME=$(get_table_output "SessionsTableName")
SESSIONS_TABLE_ARN=$(get_table_output "SessionsTableArn")
ACHIEVEMENTS_TABLE_NAME=$(get_table_output "AchievementsTableName")
ACHIEVEMENTS_TABLE_ARN=$(get_table_output "AchievementsTableArn")
ACTIVITIES_TABLE_NAME=$(get_table_output "ActivitiesTableName")
ACTIVITIES_TABLE_ARN=$(get_table_output "ActivitiesTableArn")
LEADERBOARD_TABLE_NAME=$(get_table_output "LeaderboardTableName")
LEADERBOARD_TABLE_ARN=$(get_table_output "LeaderboardTableArn")

# Deploy AppSync Stack
deploy_stack \
    "${STACK_NAME}-appsync" \
    "${SCRIPT_DIR}/appsync.yaml" \
    "Environment=${ENVIRONMENT} \
     ProjectName=${PROJECT_NAME} \
     UserPoolId=${USER_POOL_ID} \
     UsersTableName=${USERS_TABLE_NAME} \
     UsersTableArn=${USERS_TABLE_ARN} \
     GamesTableName=${GAMES_TABLE_NAME} \
     GamesTableArn=${GAMES_TABLE_ARN} \
     FriendsTableName=${FRIENDS_TABLE_NAME} \
     FriendsTableArn=${FRIENDS_TABLE_ARN} \
     SessionsTableName=${SESSIONS_TABLE_NAME} \
     SessionsTableArn=${SESSIONS_TABLE_ARN} \
     AchievementsTableName=${ACHIEVEMENTS_TABLE_NAME} \
     AchievementsTableArn=${ACHIEVEMENTS_TABLE_ARN} \
     ActivitiesTableName=${ACTIVITIES_TABLE_NAME} \
     ActivitiesTableArn=${ACTIVITIES_TABLE_ARN} \
     LeaderboardTableName=${LEADERBOARD_TABLE_NAME} \
     LeaderboardTableArn=${LEADERBOARD_TABLE_ARN}"

# Get AppSync outputs
GRAPHQL_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-appsync" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='GraphQLApiEndpoint'].OutputValue" \
    --output text)

GRAPHQL_API_KEY=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-appsync" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='GraphQLApiKey'].OutputValue" \
    --output text)

# Deploy Hosting Stack
deploy_stack \
    "${STACK_NAME}-hosting" \
    "${SCRIPT_DIR}/hosting.yaml" \
    "Environment=${ENVIRONMENT} ProjectName=${PROJECT_NAME}"

# Get Hosting outputs
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-hosting" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" \
    --output text)

CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-hosting" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text)

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-hosting" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
    --output text)

# Print summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Configuration for .env file:${NC}"
echo ""
echo "VITE_AWS_REGION=${REGION}"
echo "VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}"
echo "VITE_COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}"
echo "VITE_COGNITO_IDENTITY_POOL_ID=${IDENTITY_POOL_ID}"
echo "VITE_AWS_APPSYNC_ENDPOINT=${GRAPHQL_ENDPOINT}"
echo "VITE_AWS_APPSYNC_API_KEY=${GRAPHQL_API_KEY}"
echo ""
echo -e "${YELLOW}Hosting Details:${NC}"
echo "S3 Bucket: ${S3_BUCKET}"
echo "CloudFront Distribution: ${CLOUDFRONT_ID}"
echo "Website URL: ${WEBSITE_URL}"
echo ""
echo -e "${YELLOW}To deploy frontend:${NC}"
echo "npm run build"
echo "aws s3 sync dist/ s3://${S3_BUCKET}/ --delete"
echo "aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths '/*'"
echo ""
