#!/bin/bash
set -e

echo "🚀 Starting installation..."

# 1. Check Ruby
if ! command -v ruby &> /dev/null; then
    echo "❌ Ruby is not installed."
    exit 1
fi
echo "✅ Ruby found: $(ruby -v)"

# 2. Install Bundler
echo "📦 Installing Bundler..."
gem install bundler

# 3. Install Dependencies
echo "📦 Installing dependencies..."
# Use 'bundle install' directly. 
# We add --platform=ruby to avoid issues with pre-compiled binaries if needed, 
# but standard install is usually best first.
bundle install

echo
echo "✅ Installation complete! Run './serve.sh' to start the website."
