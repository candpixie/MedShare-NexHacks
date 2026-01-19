#!/bin/bash
# Quick Vercel Deployment Script

set -e

echo "🚀 MedShare - Quick Vercel Deployment"
echo "======================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Deploy backend
echo "🔧 Deploying Backend..."
echo "----------------------"
cd express_backend
vercel --prod --yes
BACKEND_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
cd ..

echo ""
echo "✅ Backend deployed!"
echo "URL: $BACKEND_URL"
echo ""

# Update frontend with backend URL
echo "🎨 Deploying Frontend..."
echo "------------------------"
cd frontend

# Set environment variable for build
export VITE_BACKEND_URL=$BACKEND_URL

vercel --prod --yes
FRONTEND_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
cd ..

echo ""
echo "✅ Frontend deployed!"
echo "URL: $FRONTEND_URL"
echo ""

echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📊 Your MedShare App:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "🔑 Don't forget to set environment variables in Vercel dashboard:"
echo "  1. Go to vercel.com/dashboard"
echo "  2. Select your projects"
echo "  3. Go to Settings > Environment Variables"
echo "  4. Add the variables from VERCEL_DEPLOY.md"
echo ""
echo "✅ CSV Upload is now serverless-ready!"
echo ""
