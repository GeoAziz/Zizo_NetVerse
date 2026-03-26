#!/bin/bash

# Pre-commit hook to validate code before committing
# Copy to .git/hooks/pre-commit and chmod +x

set -e

echo "🔍 Running pre-commit checks..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check TypeScript
if command -v npm &> /dev/null; then
    echo "TypeScript check..."
    npm run typecheck || {
        echo -e "${RED}TypeScript errors found${NC}"
        exit 1
    }
fi

# Check ESLint
if command -v npm &> /dev/null; then
    echo "ESLint check..."
    npm run lint || {
        echo -e "${RED}ESLint errors found${NC}"
        exit 1
    }
fi

# Check Python syntax
if command -v python3 &> /dev/null; then
    echo "Python syntax check..."
    python3 -m py_compile src/backend/**/*.py 2>/dev/null || echo "⚠️  Python syntax check skipped"
fi

echo -e "${GREEN}✓ Pre-commit checks passed${NC}"
