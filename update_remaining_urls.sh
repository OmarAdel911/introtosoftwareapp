# Frontend URL Update Script
# This script updates all remaining hardcoded URLs to use Railway backend

echo "Updating frontend URLs to Railway backend..."

# Change to frontend directory
cd "/Users/hazem/Desktop/egseekers vibe/egseekers"

# Update all remaining files with the old URL
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "egbackend-1urid4jsb-hazemosama2553-gmailcoms-projects.vercel.app" | while read file; do
  echo "Updating $file"
  sed -i '' 's|https://egbackend-1urid4jsb-hazemosama2553-gmailcoms-projects.vercel.app|https://egbackend-1.onrender.com|g' "$file"
done

echo "✅ All frontend URLs updated!"
echo "Frontend now points to: https://egbackend-1.onrender.com"
