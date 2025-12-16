#!/bin/bash

# Update all localhost URLs to Railway backend
cd "/Users/hazem/Desktop/egseekers vibe/egseekers"

echo "Updating all localhost URLs to Railway backend..."

# Find all TypeScript and TSX files and replace localhost URLs
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "localhost:5001" "$file"; then
    echo "Updating $file"
    sed -i '' 's|http://localhost:5001|https://egbackend-1.onrender.com|g' "$file"
  fi
done

echo "✅ All localhost URLs updated to Railway backend!"
echo "Frontend now points to: https://egbackend-1.onrender.com"
