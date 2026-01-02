import { S3Event } from 'aws-lambda';

export const handler = async (event: S3Event) => {
    console.log('S3 Event received:', JSON.stringify(event, null, 2));
    
    const bucketName = process.env.BUCKET_NAME;
    
    // Process each S3 record in the event
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const eventName = record.eventName;
        
        console.log(`Processing S3 event: ${eventName}`);
        console.log(`Bucket: ${bucket}, Key: ${key}`);
        
        const message = {
            event: eventName,
            bucket: bucket,
            key: key,
            timestamp: new Date().toISOString(),
            message: `Successfully processed ${key} from ${bucket}`
        };
        
        console.log('Processing result:', JSON.stringify(message, null, 2));
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'S3 event processed successfully',
            recordsProcessed: event.Records.length
        })
    };
};

