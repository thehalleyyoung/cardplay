# Sharing & Collaboration Features

CardPlay provides comprehensive sharing and collaboration features for team projects, all while maintaining complete privacy and offline capability.

## Core Principles

### 🔒 Security First
- **All sharing is local/manual** - no cloud dependency
- **No automatic uploads** - you control what gets shared and when
- **No tracking** - we never collect or transmit usage data
- **Offline-first** - all features work without internet connection

### 🔐 Privacy Guarantees
- **No external servers** - files stay on your machine
- **No telemetry** - zero analytics or reporting
- **No accounts required** - no sign-up, login, or personal data collection
- **Complete control** - you own all your data

## Project Export/Import

See `/src/export/project-exchange.ts` for implementation.

### Security Notes
- All operations are local-only
- No network calls are made
- Files are never uploaded automatically
- You control all file operations

### Privacy Notes
- No usage tracking
- No analytics collection
- No personal data transmission
- Complete offline functionality

## API Reference

See:
- `/src/export/project-exchange.ts` - Project import/export
- `/src/export/board-export.ts` - Board config sharing
- `/src/export/deck-preset-export.ts` - Deck preset sharing
- `/src/export/collaboration-metadata.ts` - Contributors & changelog
- `/src/export/project-diff.ts` - Version comparison
- `/src/export/comments.ts` - Comments & annotations
