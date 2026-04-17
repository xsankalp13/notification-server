import { SQSClient } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "test";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "test";

export const sqs = new SQSClient({
    region: process.env.AWS_REGION!,
    endpoint: process.env.SQS_ENDPOINT,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});