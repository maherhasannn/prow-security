# GCP Deployment Guide for PROW Frontend

This guide walks you through deploying the PROW frontend to Google Cloud Platform using Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud SDK (gcloud)**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install from [docker.com](https://www.docker.com/get-started)

## Step 1: Initial GCP Setup

### 1.1 Create a GCP Project

```bash
# Login to GCP
gcloud auth login

# Create a new project (or use existing)
gcloud projects create prow-frontend --name="PROW Frontend"

# Set as active project
gcloud config set project prow-frontend

# Get your project ID (you'll need this)
gcloud config get-value project
```

### 1.2 Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build API (for CI/CD)
gcloud services enable cloudbuild.googleapis.com
```

### 1.3 Set Up Billing

- Go to [Console > Billing](https://console.cloud.google.com/billing)
- Link a billing account to your project
- Cloud Run has a generous free tier, but billing is required

## Step 2: Build and Deploy Locally (First Time)

### 2.1 Configure Next.js for GCP

Set the environment variable for GCP deployment:

```bash
export GCP_DEPLOY=true
```

Or add it to your `.env.local`:
```
GCP_DEPLOY=true
```

### 2.2 Build Docker Image Locally (Optional Test)

```bash
# Build the image
docker build -t prow-frontend .

# Test locally
docker run -p 3000:3000 prow-frontend

# Visit http://localhost:3000 to verify
```

### 2.3 Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/prow-frontend

# Deploy to Cloud Run
gcloud run deploy prow-frontend \
  --image gcr.io/$(gcloud config get-value project)/prow-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_DEPLOY=true
```

### 2.4 Get Your URL

After deployment, you'll get a URL like:
```
https://prow-frontend-xxxxx-uc.a.run.app
```

## Step 3: Set Up Custom Domain (Optional)

### 3.1 Map Domain to Cloud Run

```bash
gcloud run domain-mappings create \
  --service prow-frontend \
  --domain yourdomain.com \
  --region us-central1
```

### 3.2 Update DNS

Follow the DNS instructions provided by GCP to point your domain to Cloud Run.

## Step 4: Set Up CI/CD with Cloud Build (Recommended)

### 4.1 Grant Cloud Build Permissions

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Cloud Build service account permission to deploy
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 4.2 Connect GitHub Repository (Optional)

1. Go to [Cloud Build > Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Connect your GitHub repository
4. Set build configuration to use `cloudbuild.yaml`
5. Set trigger to run on push to `main` branch

### 4.3 Manual Cloud Build Deployment

```bash
# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## Step 5: Environment Variables

### Required Environment Variables

The application requires the following environment variable:

- `OLLAMA_API_KEY` - Ollama Cloud API key for AI chat functionality

Set environment variables in Cloud Run:

```bash
gcloud run services update prow-frontend \
  --region us-central1 \
  --set-env-vars "OLLAMA_API_KEY=your_ollama_api_key_here,GCP_DEPLOY=true"
```

Or set additional variables:

```bash
gcloud run services update prow-frontend \
  --region us-central1 \
  --set-env-vars "OLLAMA_API_KEY=your_key,GCP_DEPLOY=true,OTHER_VAR=value"
```

Or use a secrets manager for sensitive values:

```bash
# Create secret
echo -n "your-secret-value" | gcloud secrets create my-secret --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding my-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Use in Cloud Run
gcloud run services update prow-frontend \
  --region us-central1 \
  --update-secrets SECRET_NAME=my-secret:latest
```

## Step 6: Monitoring and Logs

### View Logs

```bash
# Stream logs
gcloud run services logs read prow-frontend --region us-central1 --follow

# Or view in console
# https://console.cloud.google.com/run/detail/us-central1/prow-frontend/logs
```

### Set Up Monitoring

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Enable monitoring for your Cloud Run service
3. Set up alerts for errors, latency, etc.

## Step 7: Security & Compliance

### 7.1 Enable VPC Connector (for private resources)

```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create prow-connector \
  --region=us-central1 \
  --subnet=default \
  --subnet-project=$(gcloud config get-value project)

# Attach to Cloud Run service
gcloud run services update prow-frontend \
  --region us-central1 \
  --vpc-connector prow-connector
```

### 7.2 Set Up IAM

```bash
# Restrict access (remove --allow-unauthenticated if needed)
gcloud run services update prow-frontend \
  --region us-central1 \
  --no-allow-unauthenticated

# Grant specific users/groups access
gcloud run services add-iam-policy-binding prow-frontend \
  --region us-central1 \
  --member="user:email@example.com" \
  --role="roles/run.invoker"
```

### 7.3 Enable Audit Logging

Audit logs are automatically enabled. View them at:
- [Cloud Audit Logs](https://console.cloud.google.com/logs/query)

## Step 8: Scaling Configuration

```bash
# Set min/max instances
gcloud run services update prow-frontend \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Container Won't Start

```bash
# Check Cloud Run logs
gcloud run services logs read prow-frontend --region us-central1 --limit=50
```

### Port Issues

Ensure your Dockerfile exposes port 3000 and Cloud Run is configured correctly.

## Cost Estimation

- **Cloud Run**: Free tier includes 2 million requests/month, 360,000 GB-seconds memory, 180,000 vCPU-seconds
- **Container Registry**: First 0.5 GB storage free, then $0.026/GB/month
- **Cloud Build**: 120 build-minutes/day free, then $0.003/build-minute

For a small marketing site, expect **$0-10/month** on the free tier.

## Next Steps

1. Set up custom domain
2. Configure CDN (Cloud CDN) for better performance
3. Set up monitoring alerts
4. Configure backup/DR if needed
5. Review security best practices in GCP documentation

## Useful Commands Reference

```bash
# List services
gcloud run services list

# Update service
gcloud run services update prow-frontend --region us-central1

# Delete service
gcloud run services delete prow-frontend --region us-central1

# View service details
gcloud run services describe prow-frontend --region us-central1

# Get service URL
gcloud run services describe prow-frontend --region us-central1 --format="value(status.url)"
```


