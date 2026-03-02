/**
 * Seed script to create test users in Amazon Cognito (Amplify Gen 2).
 *
 * Reads the User Pool ID from amplify_outputs.json so it works regardless of
 * the auto-generated pool name.
 *
 * Creates users with confirmed accounts and verified emails.
 *
 * Usage:
 *   node scripts/seed-cognito-user.js            # create users
 *   node scripts/seed-cognito-user.js --delete    # remove the seeded users
 */

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadAmplifyOutputs() {
  const raw = readFileSync(
    join(__dirname, "..", "amplify_outputs.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

const outputs = loadAmplifyOutputs();
const REGION = outputs.auth.aws_region;
const USER_POOL_ID = outputs.auth.user_pool_id;

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

// Parse CLI flags
const args = process.argv.slice(2);
const DELETE_MODE = args.includes("--delete");

// ---------------------------------------------------------------------------
// Test users
// ---------------------------------------------------------------------------

const TEST_USERS = [
  { email: "test@test.com", password: "Qwer!234" },
  { email: "friend01@test.com", password: "Qwer!234" },
  { email: "friend02@test.com", password: "Qwer!234" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function userExists(email) {
  try {
    await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      })
    );
    return true;
  } catch (err) {
    if (err.name === "UserNotFoundException") return false;
    throw err;
  }
}

async function createUser({ email, password }) {
  // 1. Create the user (suppress welcome email)
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      MessageAction: "SUPPRESS", // don't send invite email
    })
  );

  // 2. Set a permanent password (moves user out of FORCE_CHANGE_PASSWORD)
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
}

async function deleteUser(email) {
  await cognitoClient.send(
    new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    })
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔐 GameSphere Cognito User Seed Script");
  console.log(`   Region    : ${REGION}`);
  console.log(`   User Pool : ${USER_POOL_ID}`);
  console.log(`   Mode      : ${DELETE_MODE ? "DELETE" : "CREATE"}\n`);

  if (DELETE_MODE) {
    for (const { email } of TEST_USERS) {
      const exists = await userExists(email);
      if (!exists) {
        console.log(`   ⏭ ${email} — not found, skipping`);
        continue;
      }
      await deleteUser(email);
      console.log(`   🗑 ${email} — deleted`);
    }
    console.log("\n✅ Cleanup complete!");
    return;
  }

  for (const user of TEST_USERS) {
    const exists = await userExists(user.email);
    if (exists) {
      console.log(`   ⏭ ${user.email} — already exists, skipping`);
      continue;
    }
    await createUser(user);
    console.log(`   ✓ ${user.email} — created & confirmed`);
  }

  console.log("\n✅ All users ready!");
  console.log("   You can sign in with any of these emails and password: Qwer!234");
  console.log(
    "\n💡 To remove these users run: node scripts/seed-cognito-user.js --delete"
  );
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err.message ?? err);
  process.exit(1);
});
