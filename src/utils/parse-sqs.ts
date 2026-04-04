export function parseSQSMessage(message: string) {
    const body = JSON.parse(message);

    // SNS wraps message inside "Message"
    if (body.Message) {
        return JSON.parse(body.Message);
    }

    return body;
}