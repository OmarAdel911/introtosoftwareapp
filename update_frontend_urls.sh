#!/bin/bash

# Update all frontend files to use new Railway backend URL
cd "/Users/hazem/Desktop/egseekers vibe/egseekers"

# Find all TypeScript and TSX files and replace the old URL with new one
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "egbackend-1urid4jsb-hazemosama2553-gmailcoms-projects.vercel.app" "$file"; then
    echo "Updating $file"
    sed -i '' 's|https://egbackend-1urid4jsb-hazemosama2553-gmailcoms-projects.vercel.app|https://egbackend-1.onrender.com|g' "$file"
  fi
done

echo "All frontend files updated to use Railway backend!"
