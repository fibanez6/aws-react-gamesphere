#!/bin/bash

# GameSphere Infrastructure Deployment Script
# Usage: ./deploy_main.sh <environment> [region]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
PROJECT_NAME="fi-gamesphere"
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

if ! aws s3api head-bucket --bucket "${CFN_BUCKET}" --region "${REGION}" 2>/dev/null; then
    aws s3 mb "s3://${CFN_BUCKET}" --region "${REGION}" 2>/dev/null || true
    echo -e "${GREEN}Bucket ready: ${CFN_BUCKET}${NC}"
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

# Deploy Stack
deploy_stack \
    "${STACK_NAME}-main" \
    "${SCRIPT_DIR}/main.yaml" \
    "Environment=${ENVIRONMENT} ProjectName=${PROJECT_NAME} TemplatesBucketName=${CFN_BUCKET}"

# Get Main outputs
get_main_output() {
    local output_key=$1
    aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}-main" \
        --region "${REGION}" \
        --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue" \
        --output text
}


COGNITO_USER_POOL_ID=$(get_main_output "UserPoolId")
COGNITO_USER_POOL_CLIENT_ID=$(get_main_output "UserPoolClientId")
COGNITO_IDENTITY_POOL_ID=$(get_main_output "IdentityPoolId")
GRAPHQL_ENDPOINT=$(get_main_output "GraphQLApiEndpoint")
GRAPHQL_API_KEY=$(get_main_output "GraphQLApiId")
S3_BUCKET=$(get_main_output "S3BucketName")
CLOUDFRONT_ID=$(get_main_output "CloudFrontDistributionId")
WEBSITE_URL=$(get_main_output "WebsiteURL")

# Print summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Configuration for .env file:${NC}"
echo ""
echo "VITE_AWS_REGION=${REGION}"
echo "VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}"
echo "VITE_COGNITO_USER_POOL_CLIENT_ID=${COGNITO_USER_POOL_CLIENT_ID}"
echo "VITE_COGNITO_IDENTITY_POOL_ID=${COGNITO_IDENTITY_POOL_ID}"
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
