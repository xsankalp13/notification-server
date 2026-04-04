#!/bin/bash

set -e

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

ENDPOINT=http://localhost:4566

echo "Creating SNS topic..."
aws --endpoint-url=$ENDPOINT sns create-topic --name notification-topic

echo "Creating email queue..."
aws --endpoint-url=$ENDPOINT sqs create-queue --queue-name email-queue

echo "Creating whatsapp queue..."
aws --endpoint-url=$ENDPOINT sqs create-queue --queue-name whatsapp-queue

echo "Subscribing email queue..."
aws --endpoint-url=$ENDPOINT sns subscribe \
--topic-arn arn:aws:sns:us-east-1:000000000000:notification-topic \
--protocol sqs \
--notification-endpoint arn:aws:sqs:us-east-1:000000000000:email-queue

echo "Subscribing whatsapp queue..."
aws --endpoint-url=$ENDPOINT sns subscribe \
--topic-arn arn:aws:sns:us-east-1:000000000000:notification-topic \
--protocol sqs \
--notification-endpoint arn:aws:sqs:us-east-1:000000000000:whatsapp-queue

echo "Done"