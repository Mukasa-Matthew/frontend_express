#!/bin/bash
# Script to fix the VITE_API_URL in .env file for production deployment
# This ensures the frontend connects to the backend using the correct IP/domain

ENV_FILE=".env"
BACKEND_URL="http://64.23.169.136:5000"

echo "🔧 Fixing VITE_API_URL for production deployment..."
echo ""

if [ -f "$ENV_FILE" ]; then
    echo "✅ Found .env file"
    
    # Check if VITE_API_URL exists in the file
    if grep -q "^VITE_API_URL=" "$ENV_FILE"; then
        echo "📝 Updating existing VITE_API_URL..."
        # Remove any existing VITE_API_URL line and add the correct one
        sed -i.bak '/^VITE_API_URL=/d' "$ENV_FILE"
        echo "VITE_API_URL=$BACKEND_URL" >> "$ENV_FILE"
        echo "✅ Updated VITE_API_URL to: $BACKEND_URL"
    else
        echo "➕ Adding VITE_API_URL..."
        echo "VITE_API_URL=$BACKEND_URL" >> "$ENV_FILE"
        echo "✅ Added VITE_API_URL: $BACKEND_URL"
    fi
else
    echo "📝 Creating new .env file..."
    echo "VITE_API_URL=$BACKEND_URL" > "$ENV_FILE"
    echo "✅ Created .env file with VITE_API_URL: $BACKEND_URL"
fi

echo ""
echo "📋 Current .env file contents:"
cat "$ENV_FILE"
echo ""
echo "⚠️  IMPORTANT: After updating .env, you MUST rebuild the frontend:"
echo "   npm run build"
echo ""
echo "   Then restart your frontend server to apply the changes."

