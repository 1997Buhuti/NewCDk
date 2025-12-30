#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { NewCDkStack } from '../lib/new_c_dk-stack';
import { SecondaryStack } from '../lib/secondary-stack';

const app = new cdk.App();

// Primary Stack - Contains S3 bucket and Lambda function
const primaryStack = new NewCDkStack(app, 'NewCDkStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Secondary Stack - Demonstrates multiple stacks and resource sharing
// This stack imports the S3 bucket from the primary stack using CloudFormation exports
const secondaryStack = new SecondaryStack(app, 'SecondaryStack', {
  // Ensure both stacks are in the same environment for cross-stack references
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// Add a dependency to ensure primary stack is deployed before secondary stack
secondaryStack.addDependency(primaryStack);
