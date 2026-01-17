# Vercel Deployment Guide for PROW Frontend

Vercel is the **easiest** and **best** option for Next.js apps. Made by the Next.js creators, it's optimized specifically for Next.js with zero configuration needed.

## Why Vercel?

- ✅ **Always-on free tier** - No sleep, instant responses
- ✅ **Zero config** - Auto-detects Next.js perfectly
- ✅ **Instant deployments** - Push to GitHub = auto-deploy
- ✅ **Free SSL** - Automatic HTTPS
- ✅ **Free custom domains** - Unlimited domains
- ✅ **Edge Network** - Global CDN included
- ✅ **Preview deployments** - Every PR gets a preview URL
- ✅ **Analytics included** - Built-in performance monitoring

## Quick Start (3 minutes)

### Option 1: GitHub Integration (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/prow-frontend.git
   git push -u origin main
   ```

2. **Sign up at Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" → "Continue with GitHub"
   - Authorize Vercel to access your repos

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select your `prow-frontend` repository
   - Vercel auto-detects Next.js (no config needed!)

4. **Deploy**
   - Click "Deploy"
   - Wait ~30 seconds
   - **Done!** Your site is live at `https://prow-frontend.vercel.app`

### Option 2: Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Configuration

### vercel.json (Already Created)

The `vercel.json` file is optional - Vercel auto-detects Next.js. But if you want custom settings:

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**You don't need to change anything** - Vercel handles everything automatically!

## Free Tier Limits

- ✅ **Always-on** - No sleep, instant responses
- ✅ **100 GB bandwidth/month** - More than enough
- ✅ **100 GB-hours build time** - Plenty for frequent deploys
- ✅ **Unlimited deployments** - Deploy as much as you want
- ✅ **Preview deployments** - Every PR gets a preview URL
- ✅ **Free SSL** - Automatic HTTPS
- ✅ **Free custom domains** - Unlimited domains

## Custom Domain Setup

1. Go to your project → "Settings" → "Domains"
2. Add your domain: `www.yourdomain.com`
3. Follow DNS instructions:
   - Add CNAME record pointing to Vercel
   - Or add A record (Vercel provides IP)
4. SSL certificate auto-provisioned (free, automatic)

## Environment Variables

If you need env vars:

1. Go to project → "Settings" → "Environment Variables"
2. Add variables:
   - `NODE_ENV=production`
   - Any other vars you need
3. Redeploy (or they auto-apply on next deploy)

## Auto-Deploy from GitHub

By default, Vercel auto-deploys:
- **Every push to `main`** → Production deployment
- **Every PR** → Preview deployment (unique URL)

To change:
1. Go to project → "Settings" → "Git"
2. Configure branch settings

## Preview Deployments

Every pull request automatically gets:
- ✅ Unique preview URL
- ✅ Comment on PR with preview link
- ✅ Perfect for testing before merge

## Performance Features

Vercel includes automatically:
- **Edge Network** - Global CDN
- **Image Optimization** - Automatic Next.js Image optimization
- **Automatic HTTPS** - Free SSL certificates
- **HTTP/2** - Fast protocol
- **Compression** - Automatic gzip/brotli

## Monitoring & Analytics

Vercel includes free:
- **Deployment logs** - View build and runtime logs
- **Analytics** - Page views, performance metrics
- **Web Vitals** - Core Web Vitals tracking
- **Error tracking** - Automatic error logging

## Upgrading (When Needed)

Vercel Pro ($20/month) adds:
- More bandwidth (1 TB)
- More build time
- Team collaboration
- Advanced analytics
- Password protection

**For a marketing site, free tier is perfect!**

## Troubleshooting

### Build Fails

1. Check deployment logs in Vercel dashboard
2. Verify `package.json` has correct scripts
3. Check for TypeScript errors: `npm run build` locally

### Domain Not Working

1. Verify DNS records are correct
2. Wait for DNS propagation (can take 24-48 hours)
3. Check domain settings in Vercel dashboard

### Environment Variables Not Working

1. Ensure variables are set in Vercel dashboard
2. Redeploy after adding variables
3. Check variable names match code exactly

## Comparison: Vercel vs Others

| Feature | Vercel | Render | GCP |
|---------|--------|--------|-----|
| Setup Time | 3 minutes | 5 minutes | 30+ minutes |
| Always-On Free | ✅ Yes | ❌ Sleeps | ✅ Yes |
| Next.js Optimized | ✅ Perfect | ✅ Good | ⚠️ Manual |
| Auto-Deploy | ✅ Yes | ✅ Yes | ⚠️ Manual |
| Preview Deploys | ✅ Free | ❌ Paid | ⚠️ Complex |
| Free Tier | ✅ Excellent | ⚠️ Sleeps | ✅ Good |
| Best For | Next.js | General | Enterprise |

## Next Steps

1. ✅ Deploy to Vercel (you're done!)
2. Set up custom domain
3. Enable analytics (optional)
4. Set up preview deployments for PRs

## Useful Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove
```

## Cost Estimate

- **Free tier**: $0/month (always-on, perfect for marketing sites)
- **Pro**: $20/month (if you need more bandwidth/features)

**For a marketing site, free tier is perfect and always-on!**

---

**That's it!** Vercel is the easiest option - just connect GitHub and deploy. Zero config, always-on, perfect for Next.js.


