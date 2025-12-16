#!/bin/bash

# Script to fix all localhost URLs in the frontend
echo "🔧 Fixing all localhost URLs in frontend..."

# Find all TypeScript/JavaScript files with localhost references
find egseekers/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    if grep -q "localhost" "$file"; then
        echo "📝 Updating: $file"
        
        # Replace various localhost patterns with Railway backend URL
        sed -i '' 's|http://localhost:5001|https://egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|http://localhost:3000|https://egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|http://localhost:8000|https://egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|http://localhost:4000|https://egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|localhost:5001|egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|localhost:3000|egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|localhost:8000|egbackend-1.onrender.com|g' "$file"
        sed -i '' 's|localhost:4000|egbackend-1.onrender.com|g' "$file"
        
        # Fix API paths
        sed -i '' 's|egbackend-1.onrender.com/api|https://egbackend-1.onrender.com/api|g' "$file"
        sed -i '' 's|egbackend-1.onrender.com/auth|https://egbackend-1.onrender.com/api/auth|g' "$file"
        sed -i '' 's|egbackend-1.onrender.com/health|https://egbackend-1.onrender.com/api/health|g' "$file"
        
        echo "✅ Updated: $file"
    fi
done

echo "🎉 All localhost URLs have been updated!"
echo "📋 Summary of changes:"
echo "   - http://localhost:5001 → https://egbackend-1.onrender.com"
echo "   - http://localhost:3000 → https://egbackend-1.onrender.com"
echo "   - http://localhost:8000 → https://egbackend-1.onrender.com"
echo "   - http://localhost:4000 → https://egbackend-1.onrender.com"
echo "   - localhost:5001 → egbackend-1.onrender.com"
echo "   - localhost:3000 → egbackend-1.onrender.com"
echo "   - localhost:8000 → egbackend-1.onrender.com"
echo "   - localhost:4000 → egbackend-1.onrender.com"
