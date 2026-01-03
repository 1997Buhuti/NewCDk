import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});
const bucketName = process.env.BUCKET_NAME || '';

/**
 * Lambda handler that processes objects uploaded to S3
 * This function is triggered by S3 event notifications
 */
export const handler: S3Handler = async (event: S3Event) => {
  console.log('S3 Processor Function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const eventName = record.eventName;

    console.log(`Processing: ${eventName} for object ${key} in bucket ${bucket}`);

    try {
      // Get the object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(getObjectCommand);
      const body = await response.Body?.transformToString();

      console.log(`Object content length: ${body?.length || 0} bytes`);

      // Process the object (example: create a processed version)
      const processedContent = `Processed at ${new Date().toISOString()}\n${body || ''}`;
      const processedKey = `processed/${key}`;

      // Upload processed version back to S3
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: processedKey,
        Body: processedContent,
        ContentType: response.ContentType || 'text/plain',
      });

      await s3Client.send(putObjectCommand);
      console.log(`Processed object uploaded to: ${processedKey}`);

      results.push({
        success: true,
        originalKey: key,
        processedKey: processedKey,
        eventName: eventName,
      });
    } catch (error) {
      console.error(`Error processing object ${key}:`, error);
      results.push({
        success: false,
        key: key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log('Processing complete. Results:', JSON.stringify(results, null, 2));
};

