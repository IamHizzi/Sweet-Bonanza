#!/bin/bash

echo "🎰 Sweet Bonanza - Easy Deploy Script"
echo "======================================"
echo ""

# Check if dist exists, if not build
if [ ! -d "dist" ]; then
    echo "📦 Building game..."
    npm run build
fi

echo ""
echo "🚀 Choose your deployment method:"
echo ""
echo "1️⃣  Vercel (Recommended - 1 minute)"
echo "2️⃣  Netlify (30 seconds)"
echo "3️⃣  GitHub Pages (Permanent free hosting)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Vercel Deployment Steps:"
        echo ""
        echo "1. Go to: https://vercel.com/new"
        echo "2. Sign in with GitHub"
        echo "3. Import repository: IamHizzi/Sweet-Bonanza"
        echo "4. Branch: claude/html5-slot-game-9fjTu"
        echo "5. Framework Preset: Vite"
        echo "6. Build Command: npm run build"
        echo "7. Output Directory: dist"
        echo "8. Add Environment Variables:"
        echo "   VITE_API_BASE_URL=demo"
        echo "   VITE_API_KEY=demo_key"
        echo "   VITE_GAME_MODE=demo"
        echo "9. Click Deploy"
        echo ""
        echo "✅ Your game will be live at: https://sweet-bonanza-[random].vercel.app"
        echo ""
        read -p "Press Enter to open Vercel in browser..."
        xdg-open "https://vercel.com/new" 2>/dev/null || open "https://vercel.com/new" 2>/dev/null || echo "Please visit: https://vercel.com/new"
        ;;
    2)
        echo ""
        echo "📋 Netlify Deployment Steps:"
        echo ""
        echo "1. Go to: https://app.netlify.com/drop"
        echo "2. Drag the 'dist' folder onto the page"
        echo "3. Done! You'll get a live URL instantly"
        echo ""
        echo "✅ Your game will be live at: https://sweet-bonanza-[random].netlify.app"
        echo ""
        echo "📁 Your dist folder is ready at: $(pwd)/dist"
        echo ""
        read -p "Press Enter to open Netlify Drop in browser..."
        xdg-open "https://app.netlify.com/drop" 2>/dev/null || open "https://app.netlify.com/drop" 2>/dev/null || echo "Please visit: https://app.netlify.com/drop"
        ;;
    3)
        echo ""
        echo "📋 GitHub Pages Deployment Steps:"
        echo ""
        echo "1. Go to: https://github.com/IamHizzi/Sweet-Bonanza/settings/pages"
        echo "2. Under 'Build and deployment':"
        echo "   - Source: GitHub Actions"
        echo "3. Wait for deployment (check Actions tab)"
        echo ""
        echo "✅ Your game will be live at: https://iamhizzi.github.io/Sweet-Bonanza/"
        echo ""
        read -p "Press Enter to open GitHub Pages settings in browser..."
        xdg-open "https://github.com/IamHizzi/Sweet-Bonanza/settings/pages" 2>/dev/null || open "https://github.com/IamHizzi/Sweet-Bonanza/settings/pages" 2>/dev/null || echo "Please visit: https://github.com/IamHizzi/Sweet-Bonanza/settings/pages"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎮 Or test locally first: npm run dev"
echo ""
