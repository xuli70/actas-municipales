# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Municipal Acts Management System (Sistema de Actas Municipales) - a web application for managing and viewing municipal government meeting minutes, designed with accessibility for elderly users. It's a vanilla JavaScript application with Supabase backend.

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (no frameworks or build tools)
- **Backend**: Supabase (PostgreSQL + file storage)
- **PDF Processing**: PDF.js for text extraction
- **AI Integration**: OpenAI API (optional)
- **Deployment**: Docker with Caddy web server on Coolify platform

## Development Commands

This is a static site with no build process:
- **Run locally**: Open `index.html` directly or use a local server
- **Docker build**: `docker build -t actas-municipales .`
- **No npm/yarn commands** - vanilla JavaScript project

## Current Architecture (Post-Refactorización Sesión 1)

The application now uses a modular structure with separated JavaScript modules:

```
actas-municipales/
├── index.html           # Main entry point (~850 lines, down from 1,111)
├── config.js            # Local configuration fallback
├── config.js.template   # Template for Coolify environment variables
├── js/
│   ├── core/
│   │   ├── config.js    # Centralized configuration system
│   │   └── utils.js     # Shared utility functions
│   ├── auth/
│   │   └── auth.js      # Authentication system
│   └── ui/
│       └── navigation.js # Navigation between views
├── styles.css           # Main stylesheet
└── *.js files          # Legacy modules (PDF processing, OpenAI, etc.)
```

### Key Architectural Decisions

1. **Modular JavaScript**: Core functionality extracted to separate modules
2. **Backward Compatibility**: All global functions maintained for legacy code
3. **Centralized Configuration**: Multi-source config system (env vars + local)
4. **No Build Process**: Static files served directly
5. **Coolify Integration**: Docker deployment with environment variable injection

### Core Functionality Modules

- **Configuration** (`js/core/config.js`): Handles env vars from Coolify + local fallbacks
- **Authentication** (`js/auth/auth.js`): Password-based role selection (User vs Admin)
- **Navigation** (`js/ui/navigation.js`): View switching and routing
- **Utils** (`js/core/utils.js`): Shared utilities (file formatting, status badges, etc.)

## Database Schema

PostgreSQL via Supabase with these main tables:
- `actas`: Stores meeting records with metadata
- `documentos`: PDF files and extracted text
- Storage bucket: `actas-bucket` for PDF files

Row Level Security (RLS) is implemented for data protection.

## Configuration

### Development (Local)
Uses `config.js` with fallback values:
```javascript
window.APP_CONFIG = {
    SUPABASE_URL: 'https://supmcp.axcsol.com',
    SUPABASE_ANON_KEY: '',
    PASSWORD_USER: 'usuario123',
    PASSWORD_ADMIN: 'admin123'
};
```

### Production (Coolify)
Environment variables are injected via `config.js.template`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PASSWORD_USER`
- `PASSWORD_ADMIN`
- `OPENAI_API_KEY` (optional)
- `AI_MODEL` (optional)

## Important Notes

1. **Spanish UI**: All user-facing text is in Spanish
2. **No TypeScript**: Pure JavaScript only
3. **No Testing Framework**: Manual testing approach
4. **Accessibility**: Maintain large fonts and high contrast for elderly users
5. **Error Handling**: User-friendly Spanish error messages throughout
6. **Modular Loading**: Scripts load in specific order with dependency management

## Common Tasks

- **Add new feature**: Create new JS file in appropriate js/ subdirectory
- **Modify UI**: Edit styles.css and relevant HTML
- **Database changes**: Update SQL files in MDySQLyMCP/
- **Deploy changes**: Build Docker image and deploy via Coolify

## Recent Changes (2025-07-19)

### Refactorización Sesión 1: Modularization Base (COMPLETED)
- **Objective**: Extract JavaScript from index.html into organized modules
- **Result**: Reduced index.html from 1,111 to ~850 lines (-23%)
- **Structure**: Created js/core/, js/auth/, js/ui/ directories
- **Compatibility**: 100% backward compatibility maintained
- **Configuration**: Multi-source config system implemented

#### Technical Implementation Details:
- **js/core/utils.js**: Shared utilities (formatFileSize, getStatusBadge, showMessage)
- **js/auth/auth.js**: Complete authentication system with state management
- **js/ui/navigation.js**: View switching and routing logic
- **js/core/config.js**: Centralized configuration with priority system
- **Deployment**: Fixed Docker integration and Coolify environment variables

#### Compatibility Layer:
- All global functions maintained: `authenticate()`, `showActas()`, `logout()`, etc.
- Global variables preserved: `userRole`, `currentView`, `selectedFiles`
- Zero breaking changes to existing functionality

### Next Phase: Refactorización Sesión 2 (PLANNED)
- **Target**: Extract actas management (~300 lines)
- **Target**: Extract upload system (~400 lines)  
- **Target**: Extract AI system (~200 lines)
- **Goal**: Reduce index.html to ~200 lines total (-82% from original)

## Security Notes

- `.gitignore` configured to exclude sensitive files (.mcp.json, config.js in some contexts)
- Environment variables properly handled via Coolify injection
- No hardcoded secrets in repository
- RLS policies protect database access

## Testing

- `test-final.html`: Validates module loading and configuration
- Manual testing for core functionality
- No automated test suite (vanilla JS project)

## Deployment

Uses Docker with Caddy web server:
1. Coolify builds from Dockerfile
2. Environment variables injected via config.js.template
3. Static files served with UTF-8 encoding
4. Health checks and logging configured