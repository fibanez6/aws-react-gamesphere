import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});

// Customize the User DynamoDB table
// const userTable = backend.data.resources.cfnResources.amplifyDynamoDbTables['User'];
