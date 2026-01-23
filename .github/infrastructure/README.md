# GameSphere Infrastructure

This directory contains AWS CloudFormation templates for deploying the GameSphere application infrastructure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GameSphere Infrastructure                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                    │
│  │ CloudFront  │────▶│     S3      │     │   Cognito   │                    │
│  │ Distribution│     │   Bucket    │     │  User Pool  │                    │
│  └─────────────┘     └─────────────┘     └─────────────┘                    │
│         │                                       │                            │
│         │                                       ▼                            │
│         │            ┌─────────────────────────────────────┐                │
│         │            │         AWS AppSync                  │                │
│         └───────────▶│       GraphQL API                   │                │
│                      └─────────────────────────────────────┘                │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DynamoDB Tables                               │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Users  │ │ Games  │ │Friends │ │Sessions│ │Activity│ │Leader- │  │   │
│  │  │        │ │        │ │        │ │        │ │        │ │ board  │  │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Templates

| Template | Description |
|----------|-------------|
| [main.yaml](main.yaml) | Root stack that orchestrates all nested stacks |
| [cognito.yaml](cognito.yaml) | Cognito User Pool, Identity Pool, and IAM roles |
| [dynamodb.yaml](dynamodb.yaml) | DynamoDB tables for all game data |
| [appsync.yaml](appsync.yaml) | AppSync GraphQL API with schema and resolvers |
| [hosting.yaml](hosting.yaml) | S3 bucket and CloudFront distribution for frontend |

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS Account with permissions to create the required resources
- (Optional) Custom domain with ACM certificate for HTTPS

## Deployment

### Option 1: Deploy as Nested Stacks

```bash
# First, upload templates to S3
aws s3 sync .github/infrastructure s3://your-cfn-bucket/gamesphere/

# Deploy the main stack
aws cloudformation deploy \
  --template-file .github/infrastructure/main.yaml \
  --stack-name gamesphere-prod \
  --parameter-overrides \
    Environment=prod \
    ProjectName=gamesphere \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags Project=gamesphere Environment=prod
```

### Option 2: Deploy Individual Stacks

```bash
# 1. Deploy Cognito
aws cloudformation deploy \
  --template-file .github/infrastructure/cognito.yaml \
  --stack-name gamesphere-cognito-dev \
  --parameter-overrides Environment=dev ProjectName=gamesphere \
  --capabilities CAPABILITY_NAMED_IAM

# 2. Deploy DynamoDB
aws cloudformation deploy \
  --template-file .github/infrastructure/dynamodb.yaml \
  --stack-name gamesphere-dynamodb-dev \
  --parameter-overrides Environment=dev ProjectName=gamesphere

# 3. Deploy AppSync (requires outputs from Cognito and DynamoDB)
aws cloudformation deploy \
  --template-file .github/infrastructure/appsync.yaml \
  --stack-name gamesphere-appsync-dev \
  --parameter-overrides \
    Environment=dev \
    ProjectName=gamesphere \
    UserPoolId=<cognito-user-pool-id> \
    UsersTableName=<users-table-name> \
    UsersTableArn=<users-table-arn> \
    ... \
  --capabilities CAPABILITY_NAMED_IAM

# 4. Deploy Hosting
aws cloudformation deploy \
  --template-file .github/infrastructure/hosting.yaml \
  --stack-name gamesphere-hosting-dev \
  --parameter-overrides Environment=dev ProjectName=gamesphere
```

## Parameters

### Common Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Environment | dev | Deployment environment (dev/staging/prod) |
| ProjectName | gamesphere | Project name for resource naming |

### Hosting Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| DomainName | (empty) | Custom domain name |
| CertificateArn | (empty) | ACM certificate ARN |

## Outputs

After deployment, the following outputs are available:

| Output | Description |
|--------|-------------|
| UserPoolId | Cognito User Pool ID |
| UserPoolClientId | Cognito Web Client ID |
| GraphQLApiEndpoint | AppSync GraphQL endpoint URL |
| WebsiteURL | CloudFront distribution URL |
| S3BucketName | S3 bucket for frontend deployment |

## Environment Configuration

After deploying, update your `.env` file with the outputs:

```env
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=<UserPoolId>
VITE_AWS_USER_POOL_CLIENT_ID=<UserPoolClientId>
VITE_AWS_APPSYNC_ENDPOINT=<GraphQLApiEndpoint>
```

## Deploying Frontend

After infrastructure is deployed:

```bash
# Build the frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://<S3BucketName>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <CloudFrontDistributionId> \
  --paths "/*"
```

## Cost Estimation

| Resource | Estimated Monthly Cost (Dev) | Estimated Monthly Cost (Prod) |
|----------|------------------------------|-------------------------------|
| DynamoDB (On-Demand) | $1-10 | $10-100 |
| AppSync | $4 per million requests | $4 per million requests |
| Cognito | Free tier (50k MAU) | $0.0055/MAU after free tier |
| CloudFront | $0.085/GB | $0.085/GB |
| S3 | $0.023/GB | $0.023/GB |

## Security

- All S3 buckets have public access blocked
- CloudFront uses HTTPS only
- DynamoDB tables have encryption at rest
- AppSync uses Cognito authentication
- IAM roles follow least-privilege principle
- Security headers configured in CloudFront

## Cleanup

To delete all resources:

```bash
# Empty S3 buckets first
aws s3 rm s3://<website-bucket> --recursive
aws s3 rm s3://<logs-bucket> --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name gamesphere-prod

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name gamesphere-prod
```

## Troubleshooting

### Stack Creation Failed

1. Check CloudFormation events for error details
2. Ensure IAM permissions are sufficient
3. Verify parameter values are correct

### AppSync Errors

1. Check CloudWatch logs for resolver errors
2. Verify DynamoDB table permissions
3. Test queries in AppSync console

### CloudFront 403 Errors

1. Verify S3 bucket policy includes CloudFront OAC
2. Check that index.html exists in S3
3. Wait for CloudFront distribution to deploy (15-30 min)

## Contributing

When modifying templates:

1. Test changes in dev environment first
2. Use `aws cloudformation validate-template` before deploying
3. Document any new parameters or outputs
4. Update cost estimates if adding new resources
