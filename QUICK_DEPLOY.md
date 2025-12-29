# Quick Deployment Guide

The Sweet Bonanza game is **ready to deploy** and works in demo mode with a mock backend API. Choose any deployment option below:

---

## ⚡ Option 1: GitHub Pages (Recommended - Free & Easy)

### Setup (One-Time)

1. Go to your GitHub repository: https://github.com/IamHizzi/Sweet-Bonanza

2. Click **Settings** → **Pages** (left sidebar)

3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"

4. The GitHub Actions workflow is already configured (`.github/workflows/deploy.yml`)

5. Push to trigger deployment:
   ```bash
   git push origin claude/html5-slot-game-9fjTu
   ```

6. **Your game will be live at**:
   ```
   https://iamhizzi.github.io/Sweet-Bonanza/
   ```

**Status**: Check deployment status at:
https://github.com/IamHizzi/Sweet-Bonanza/actions

---

## 🚀 Option 2: Vercel (Instant Deploy)

### Method A: Deploy from GitHub

1. Go to: https://vercel.com/new

2. Import your repository: `IamHizzi/Sweet-Bonanza`

3. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   VITE_API_BASE_URL=demo
   VITE_API_KEY=demo_key
   VITE_GAME_MODE=demo
   VITE_DEBUG_MODE=false
   ```

5. Click **Deploy**

6. **Your game will be live at**: `https://sweet-bonanza-xyz.vercel.app`

### Method B: Deploy with CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Navigate to project
cd /home/user/Sweet-Bonanza

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

---

## 🌐 Option 3: Netlify (Drag & Drop)

### Method A: Drag & Drop (Easiest)

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to: https://app.netlify.com/drop

3. **Drag the `dist/` folder** onto the page

4. **Your game will be live immediately** at: `https://random-name.netlify.app`

### Method B: Deploy from GitHub

1. Go to: https://app.netlify.com/start

2. Connect to GitHub and select `IamHizzi/Sweet-Bonanza`

3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Branch**: `claude/html5-slot-game-9fjTu`

4. Add Environment Variables:
   ```
   VITE_API_BASE_URL=demo
   VITE_API_KEY=demo_key
   VITE_GAME_MODE=demo
   VITE_DEBUG_MODE=false
   ```

5. Click **Deploy site**

6. **Your game will be live at**: `https://sweet-bonanza-xyz.netlify.app`

---

## 🎮 Test Locally First

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open browser to: http://localhost:3000
```

---

## 📊 Deployment Status

| Platform | Status | URL | Setup Time |
|----------|--------|-----|------------|
| **GitHub Pages** | ✅ Ready | `https://iamhizzi.github.io/Sweet-Bonanza/` | 2 min |
| **Vercel** | ✅ Ready | `https://your-app.vercel.app` | 1 min |
| **Netlify** | ✅ Ready | `https://your-app.netlify.app` | 30 sec (drag & drop) |

---

## 🎯 What You'll See

Once deployed, the game features:

✅ **Full 6x5 slot grid** with animated symbols
✅ **Cluster pay mechanics** (8+ matching symbols)
✅ **Tumble/cascade feature** with continuous wins
✅ **Free spins bonus** (4+ scatters)
✅ **Multiplier system** (2x-100x)
✅ **Ante bet** option
✅ **Autoplay** with stop conditions
✅ **Responsive design** (mobile/desktop)
✅ **Demo balance**: $1,000 (resets on refresh)

---

## ⚙️ Configuration Files

All deployment configs are included:

- `.github/workflows/deploy.yml` - GitHub Pages
- `vercel.json` - Vercel configuration
- `netlify.toml` - Netlify configuration
- `.env` - Environment variables (local dev)

---

## 🔧 Troubleshooting

### Game shows blank screen
- Check browser console for errors
- Ensure all dependencies installed: `npm install`
- Try rebuilding: `npm run build`

### Deployment fails
- Check build logs in platform dashboard
- Verify Node.js version is 18+
- Ensure environment variables are set

### Game doesn't work on mobile
- Clear cache and hard refresh
- Check if browser supports WebGL
- Try different browser

---

## 🎬 Next Steps After Deployment

1. **Test the game** thoroughly
2. **Share the URL** with stakeholders
3. **Collect feedback**
4. **Implement real backend** API (see `docs/API_SPECIFICATION.md`)
5. **Add real assets** (replace emoji symbols)
6. **Configure analytics** (Google Analytics, DataDog, etc.)

---

## 📞 Need Help?

- Check the main [README.md](./README.md)
- Review [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- Check [docs/INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)

---

**Ready to Deploy? Pick an option above and follow the steps!** 🚀
