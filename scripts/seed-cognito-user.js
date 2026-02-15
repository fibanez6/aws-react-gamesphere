#!/usr/bin/env node

/**
 * GameSphere - Seed Cognito User Script
 * 
 * This script creates a test user in AWS Cognito and outputs the user ID (sub).
 * Run this first, then use the output user ID with seed-data.js.
 * 
 * Usage:
 *   node scripts/seed-cognito-user.js
 *   AWS_PROFILE=bjss-cli-role npm run seed:cognito
 * 
 * Output:
 *   Prints the Cognito user ID (sub) to stdout on success.
 * 
 * Environment variables (from .env or AWS profile):
 *   AWS_REGION
 *   AWS_PROFILE (optional)
 *   COGNITO_USER_POOL_ID or VITE_COGNITO_USER_POOL_ID
 */

import {
    AdminCreateUserCommand,
    AdminGetUserCommand,
    AdminSetUserPasswordCommand,
    CognitoIdentityProviderClient,
    UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import dotenv from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import { stdin as input } from 'node:process';
import readline from 'node:readline/promises';

dotenv.config();

const getMfaCode = async () => {
  const rl = readline.createInterface({ input, output: process.stderr });
  const code = await rl.question('Enter MFA code: ');
  rl.close();
  return code.trim();
};

const profileHasSessionToken = (profile) => {
  try {
    const credentialsPath = `${os.homedir()}/.aws/credentials`;
    if (!fs.existsSync(credentialsPath)) {
      return false;
    }
    const content = fs.readFileSync(credentialsPath, 'utf8');
    const pattern = new RegExp(`\\[${profile}\\]([\\s\\S]*?)(?=\\n\\[|$)`, 'm');
    const match = content.match(pattern);
    if (!match) {
      return false;
    }
    return /aws_session_token\s*=\s*\S+/.test(match[1]);
  } catch {
    return false;
  }
};

// ============================================
// Configuration
// ============================================
const config = {
  region: process.env.AWS_REGION || process.env.VITE_AWS_REGION || 'ap-southeast-2',
  userPoolId: process.env.COGNITO_USER_POOL_ID || process.env.VITE_COGNITO_USER_POOL_ID,
};

// ============================================
// Cognito Client Setup
// ============================================

const createCognitoClient = () => {
  const clientConfig = {
    region: config.region,
  };

  if (process.env.AWS_PROFILE && !process.env.AWS_ACCESS_KEY_ID) {
    const profile = process.env.AWS_PROFILE;
    const hasSessionToken = profileHasSessionToken(profile);
    clientConfig.credentials = hasSessionToken
      ? fromIni({ profile })
      : fromIni({ profile, mfaCodeProvider: getMfaCode });
  }

  return new CognitoIdentityProviderClient(clientConfig);
};

// ============================================
// Cognito User Seeding
// ============================================

async function seedCognitoUser() {
  if (!config.userPoolId) {
    console.error('❌ Error: COGNITO_USER_POOL_ID not set');
    process.exit(1);
  }

  const cognitoClient = createCognitoClient();
  const testEmail = 'test@test.com';
  const testPassword = 'Qwer!234';

  try {
    // Create the user
    const createResponse = await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: config.userPoolId,
      Username: testEmail,
      UserAttributes: [
        { Name: 'email', Value: testEmail },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
    }));
    console.error(`✓ Created Cognito user: ${testEmail}`);

    // Set permanent password (bypasses temporary password flow)
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: config.userPoolId,
      Username: testEmail,
      Password: testPassword,
      Permanent: true,
    }));
    console.error(`✓ Set permanent password for: ${testEmail}`);

    // Get the user's sub (userId) from the create response
    const subAttribute = createResponse.User?.Attributes?.find(attr => attr.Name === 'sub');
    const userId = subAttribute?.Value;
    console.error(`✓ User ID (sub): ${userId}`);
    return userId;

  } catch (error) {
    if (error instanceof UsernameExistsException || error.name === 'UsernameExistsException') {
      console.error(`ℹ️  User ${testEmail} already exists, retrieving existing user ID`);
      
      // Still try to set the password in case it needs updating
      try {
        await cognitoClient.send(new AdminSetUserPasswordCommand({
          UserPoolId: config.userPoolId,
          Username: testEmail,
          Password: testPassword,
          Permanent: true,
        }));
        console.error(`✓ Updated password for existing user: ${testEmail}`);
      } catch (pwError) {
        console.error(`⚠️  Could not update password: ${pwError.message}`);
      }

      // Get the existing user's sub (userId)
      try {
        const getUserResponse = await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: config.userPoolId,
          Username: testEmail,
        }));
        const subAttribute = getUserResponse.UserAttributes?.find(attr => attr.Name === 'sub');
        const userId = subAttribute?.Value;
        console.error(`✓ User ID (sub): ${userId}`);
        return userId;
      } catch (getError) {
        console.error(`❌ Could not get user ID: ${getError.message}`);
        process.exit(1);
      }
    } else {
      console.error(`❌ Failed to create Cognito user: ${error.message}`);
      process.exit(1);
    }
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('  GameSphere - Cognito User Seed Script');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`  Region: ${config.region}`);
  console.error(`  User Pool ID: ${config.userPoolId}`);

  try {
    const userId = await seedCognitoUser();
    
    // Output only the user ID to stdout (for piping to other scripts)
    console.log(userId);
    
    console.error('\n✅ Cognito user seeding complete!');
    console.error(`\nTo seed data, run:`);
    console.error(`  node scripts/seed-data.js --cognito-user-id=${userId}`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
