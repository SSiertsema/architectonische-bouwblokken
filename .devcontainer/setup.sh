#!/bin/bash

echo "📦 Installeren lokale dependencies..."
npm install

echo "🌐 Installeren Claude Code SDK globaal..."
npm install -g @anthropic-ai/claude-code

echo "✅ Setup klaar."

