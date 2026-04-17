import {
    ReceiveMessageCommand,
    DeleteMessageCommand,
    Message,
} from "@aws-sdk/client-sqs";

import { sqs } from "../config/sqs";
import { parseSQSMessage } from "../utils/parse-sqs";
import { NotificationEvent } from "../types/notification";
import { sendEmail } from "../services/email.service";

const QUEUE_URL = process.env.EMAIL_QUEUE!;

// Validate required env vars at startup
if (!QUEUE_URL) {
    console.error("❌ FATAL: EMAIL_QUEUE env var is not set.");
    process.exit(1);
}

/**
 * Deletes a message from SQS unconditionally.
 * Used for both successfully processed messages AND unrecoverable "poison pill" messages.
 */
async function deleteMessage(receiptHandle: string): Promise<void> {
    await sqs.send(
        new DeleteMessageCommand({
            QueueUrl: QUEUE_URL!,
            ReceiptHandle: receiptHandle,
        })
    );
}

/**
 * Handles a single SQS message.
 *
 * Error strategy:
 *  - TRANSIENT errors (e.g. SMTP down): rethrow → do NOT delete message → SQS
 *    will make it visible again after the visibility timeout.
 *  - PERMANENT errors (bad JSON, missing data): log + delete the message so it
 *    never blocks the queue again.
 */
async function processMessage(msg: Message): Promise<void> {
    const receiptHandle = msg.ReceiptHandle!;

    // --- Parse phase (permanent failures) ---
    let event: NotificationEvent;
    try {
        event = parseSQSMessage(msg.Body!) as NotificationEvent;
    } catch (parseErr) {
        console.error("🗑️  Unreadable message body (poison pill), discarding:", parseErr);
        await deleteMessage(receiptHandle);
        return;
    }

    // --- Validation phase (permanent failures) ---
    if (!event.parentEmail) {
        console.warn(
            `🗑️  Message for student "${event.studentName}" has no parentEmail – discarding.`
        );
        await deleteMessage(receiptHandle);
        return;
    }

    // --- Send phase (transient failures – let SQS retry) ---
    await sendEmail(
        event.parentEmail,
        "Student Created",
        `Student ${event.studentName} has been registered on Shiksha Intelligence.`
    );

    // Only delete after successful delivery
    await deleteMessage(receiptHandle);
    console.log(`✅ Email processed and deleted for student: ${event.studentName}`);
}

async function poll() {
    console.log("🚀 Email worker started, polling:", QUEUE_URL);

    while (true) {
        try {
            const res = await sqs.send(
                new ReceiveMessageCommand({
                    QueueUrl: QUEUE_URL!,
                    MaxNumberOfMessages: 5,
                    WaitTimeSeconds: 10,
                })
            );

            if (!res.Messages || res.Messages.length === 0) continue;

            // Process all messages in the batch concurrently instead of sequentially
            await Promise.allSettled(res.Messages.map(processMessage));
        } catch (err) {
            console.error("Polling error – retrying in 5 s:", err);
            // Backoff to avoid hammering SQS when it is unhealthy
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

poll();