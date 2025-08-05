#!/bin/bash

echo "=== Building Backend ==="

# Navigate to backend directory
cd backend

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js and npm first."
    exit 1
fi

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

# Install TypeScript locally if needed
if [ ! -f "../node_modules/.bin/tsc" ]; then
    echo "Installing TypeScript..."
    cd ..
    npm install
    cd backend
fi

# Compile TypeScript
echo "Compiling TypeScript files..."
../node_modules/.bin/tsc

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✓ TypeScript compilation successful!"
    echo ""
    echo "=== Compiled files ==="
    find dist -name "*.js" -type f | sort
else
    echo "✗ TypeScript compilation failed!"
    exit 1
fi

echo ""
echo "Build complete! You can now start the server with: npm start"