import {
    ReceiveMessageCommand,
    DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

import { sqs } from "../config/sqs";
import { parseSQSMessage } from "../utils/parse-sqs";
import { NotificationEvent } from "../types/notification";
import { sendWhatsapp } from "../services/whatsapp.service";

const QUEUE_URL = process.env.WHATSAPP_QUEUE!;

async function poll() {
    while (true) {
        try {
            const res = await sqs.send(
                new ReceiveMessageCommand({
                    QueueUrl: QUEUE_URL,
                    MaxNumberOfMessages: 5,
                    WaitTimeSeconds: 10,
                })
            );

            if (!res.Messages) continue;

            for (const msg of res.Messages) {
                try {
                    const event =
                        parseSQSMessage(msg.Body!) as NotificationEvent;

                    if (!event.parentPhone) continue;

                    await sendWhatsapp(
                        event.parentPhone,
                        `Student ${event.studentName} created`
                    );

                    await sqs.send(
                        new DeleteMessageCommand({
                            QueueUrl: QUEUE_URL,
                            ReceiptHandle: msg.ReceiptHandle!,
                        })
                    );
                } catch (err) {
                    console.error("Whatsapp processing error", err);
                }
            }
        } catch (err) {
            console.error("Polling error", err);
        }
    }
}

poll();