import { Handler } from 'aws-lambda';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const bucketName = process.env.BUCKET_NAME || '';
const bucketArn = process.env.BUCKET_ARN || '';

/**
 * Lambda handler that reads objects from the shared S3 bucket
 * This function can be invoked manually or via API Gateway
 */
export const handler: Handler = async (event) => {
  console.log('Bucket Reader Function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log(`Bucket Name: ${bucketName}`);
  console.log(`Bucket ARN: ${bucketArn}`);

  try {
    // List objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10, // Limit to 10 objects for demonstration
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    console.log(`Found ${objects.length} objects in bucket`);

    // Read metadata for each object (without downloading full content)
    const objectSummaries = objects.map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified?.toISOString(),
      etag: obj.ETag,
    }));

    // Optionally read the first object's content if requested
    let firstObjectContent: string | undefined;
    if (objects.length > 0 && event.readFirstObject) {
      const firstKey = objects[0].Key!;
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: firstKey,
      });

      const getResponse = await s3Client.send(getCommand);
      firstObjectContent = await getResponse.Body?.transformToString();
      console.log(`Read content from first object: ${firstKey}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully read bucket contents',
        bucketName: bucketName,
        bucketArn: bucketArn,
        objectCount: objects.length,
        objects: objectSummaries,
        firstObjectContent: firstObjectContent || undefined,
      }),
    };
  } catch (error) {
    console.error('Error reading from bucket:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error reading from bucket',
        error: error instanceof Error ? error.message : 'Unknown error',
        bucketName: bucketName,
        bucketArn: bucketArn,
      }),
    };
  }
};

