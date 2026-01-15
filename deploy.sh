#!/bin/bash

# PROW Frontend GCP Deployment Script
# Usage: ./deploy.sh [region]

set -e

REGION=${1:-us-central1}
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "🚀 Deploying PROW Frontend to GCP Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Set GCP_DEPLOY environment variable
export GCP_DEPLOY=true

# Build and submit to Cloud Build
echo "📦 Building and pushing container..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/prow-frontend

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy prow-frontend \
  --image gcr.io/$PROJECT_ID/prow-frontend:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GCP_DEPLOY=true \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe prow-frontend --region $REGION --format="value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "To view logs: gcloud run services logs read prow-frontend --region $REGION --follow"

