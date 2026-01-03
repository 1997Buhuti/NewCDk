import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

/**
 * Secondary Stack - Demonstrates:
 * 1. Multiple stacks in a CDK application
 * 2. Sharing resources between stacks using Stack Exports/Imports
 * 3. Cross-stack references
 * All using L2 constructs
 */
export class SecondaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Method 1: Import the bucket using Fn.importValue (CloudFormation exports)
    // This demonstrates sharing resources via CloudFormation exports
    const bucketName = cdk.Fn.importValue('Level2S2Bucket-Name');
    const bucketArn = cdk.Fn.importValue('Level2S2Bucket-Arn');

    // Create a Lambda function using NodejsFunction (automatically handles TypeScript bundling)
    // that reads from the shared S3 bucket
    const bucketReaderFunction = new NodejsFunction(this, 'BucketReaderFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/bucket-reader/index.ts',
      handler: 'handler',
      functionName: 'bucket-reader-function',
      description: 'Lambda function that reads objects from the shared S3 bucket',
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: bucketName,
        BUCKET_ARN: bucketArn,
      },
    });

    // Grant permissions to read from the bucket using L2 convenience methods
    // Since we're importing the bucket, we need to use IAM policy statements
    bucketReaderFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:ListBucket',
        ],
        resources: [
          bucketArn,
          cdk.Fn.join('', [bucketArn, '/*']),
        ],
      })
    );

    // Create a CloudWatch alarm using L2 construct to monitor the Lambda function
    const alarm = new cloudwatch.Alarm(this, 'BucketReaderAlarm', {
      metric: bucketReaderFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when bucket reader function has errors',
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketReaderFunctionArn', {
      value: bucketReaderFunction.functionArn,
      description: 'The ARN of the bucket reader Lambda function',
    });

    new cdk.CfnOutput(this, 'ImportedBucketName', {
      value: bucketName,
      description: 'The imported bucket name from the primary stack',
    });

    new cdk.CfnOutput(this, 'AlarmName', {
      value: alarm.alarmName,
      description: 'CloudWatch alarm name for monitoring',
    });
  }
}

