# Render Deployment Guide for PROW Frontend

Render is much easier than GCP - it auto-detects Next.js apps and deploys with minimal configuration. Perfect for getting started quickly!

## Why Render?

- ✅ **Super easy setup** - Connect GitHub, auto-deploys
- ✅ **Generous free tier** - 750 hours/month (enough for 24/7)
- ✅ **Auto SSL** - HTTPS included
- ✅ **Custom domains** - Free SSL certificates
- ✅ **Zero config** - Auto-detects Next.js
- ✅ **Great for MVP** - Easy to scale later

## Quick Start (5 minutes)

### Option 1: GitHub Integration (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/prow-frontend.git
   git push -u origin main
   ```

2. **Sign up at Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (easiest)

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect Next.js

4. **Configure (or use defaults)**
   - **Name**: `prow-frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build` (auto-filled)
   - **Start Command**: `npm start` (auto-filled)
   - **Plan**: `Free` (or Starter for $7/month)

5. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically
   - Get your URL: `https://prow-frontend.onrender.com`

### Option 2: Manual Deploy (No GitHub)

1. **Sign up at Render**
   - Go to [render.com](https://render.com)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Choose "Deploy without Git" or use Render CLI

3. **Upload your code**
   - Use Render CLI or connect via Git manually

## Configuration

### Using render.yaml (Already Created)

The `render.yaml` file in your repo configures everything:

```yaml
services:
  - type: web
    name: prow-frontend
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
```

Render will automatically use this file if present.

### Environment Variables

If you need env vars later:

1. Go to your service dashboard
2. Click "Environment"
3. Add variables:
   - `NODE_ENV=production`
   - Any other vars you need

### Custom Domain

1. Go to your service → "Settings"
2. Scroll to "Custom Domains"
3. Add your domain: `www.yourdomain.com`
4. Update DNS records (Render provides instructions)
5. SSL certificate auto-provisioned (free)

## Free Tier Limits

- **750 hours/month** - Enough for 24/7 uptime
- **512 MB RAM** - Plenty for Next.js
- **Auto-sleep after 15 min inactivity** - Wakes on first request
- **100 GB bandwidth** - More than enough for marketing site

**Note**: Free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up. This is fine for a marketing site. Upgrade to Starter ($7/month) for always-on.

## Upgrading (When Ready)

When you need:
- **Always-on** (no sleep): Starter plan ($7/month)
- **More resources**: Professional plans ($25+/month)
- **Better performance**: Auto-scaling, more RAM/CPU

## Auto-Deploy from GitHub

By default, Render auto-deploys on every push to `main` branch.

To change:
1. Go to service → "Settings"
2. Under "Build & Deploy"
3. Change branch or disable auto-deploy

## Manual Deploy

```bash
# Install Render CLI (optional)
npm install -g render-cli

# Login
render login

# Deploy
render deploy
```

## Monitoring & Logs

- **Live logs**: Available in dashboard
- **Metrics**: CPU, memory, response times
- **Alerts**: Set up email alerts for errors

## Troubleshooting

### Build Fails

1. Check logs in Render dashboard
2. Verify `package.json` has correct scripts
3. Ensure Node version is compatible (Render uses Node 18+)

### App Won't Start

1. Check start command: `npm start`
2. Verify port: Render uses `PORT` env var (Next.js handles this)
3. Check logs for errors

### Slow First Load (Free Tier)

- Free tier services sleep after 15 min
- First request wakes them up (~30 sec)
- Upgrade to Starter for always-on

## Comparison: Render vs GCP

| Feature | Render | GCP Cloud Run |
|---------|--------|--------------|
| Setup Time | 5 minutes | 30+ minutes |
| Configuration | Minimal | Complex |
| Free Tier | 750 hrs/month | 2M requests |
| Auto SSL | ✅ Free | ✅ Included |
| Custom Domain | ✅ Free | ✅ Included |
| Always-On Free | ❌ (sleeps) | ✅ Yes |
| Scaling | Easy | More complex |
| Best For | MVP/Startups | Enterprise |

## Next Steps

1. ✅ Deploy to Render (you're done!)
2. Set up custom domain
3. Configure monitoring/alerts
4. Upgrade when you need always-on

## Useful Commands

```bash
# View logs (via Render CLI)
render logs

# Deploy manually
render deploy

# View service status
render status
```

## Cost Estimate

- **Free tier**: $0/month (sleeps after inactivity)
- **Starter**: $7/month (always-on, better performance)
- **Professional**: $25+/month (auto-scaling, more resources)

For a marketing site, **free tier is perfect** to start!

---

**That's it!** Render is much simpler than GCP - just connect GitHub and deploy. No Docker, no complex configs, no CLI setup needed.

