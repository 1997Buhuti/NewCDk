import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class NewCDkStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket using L2 construct
    this.bucket = new s3.Bucket(this, 'Level2S2Bucket', {
      bucketName: 'level2-s2-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    });

    // Create Lambda function using NodejsFunction which handles TypeScript bundling automatically
    const s3ProcessorFunction = new NodejsFunction(this, 'S3ProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: 'lambda/index.ts',
      handler: 'handler',
      functionName: 's3-processor-function',
      description: 'Lambda function that processes objects in S3 bucket',
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
      bundling: {
        externalModules: ['aws-sdk'], // AWS SDK is available in Lambda runtime
      },
    });

    // Grant the Lambda function permissions to read/write to the bucket (L2 convenience method)
    this.bucket.grantReadWrite(s3ProcessorFunction);

    // Add an S3 event trigger - Lambda will be invoked when objects are uploaded (L2 convenience method)
    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3ProcessorFunction)
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'The name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'The ARN of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: s3ProcessorFunction.functionArn,
      description: 'The ARN of the Lambda function',
    });
  }
}