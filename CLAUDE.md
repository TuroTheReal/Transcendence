# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multiplayer Pong game application (Ft_transcendence project) with real-time features built using:
- **Backend**: Fastify server with TypeScript, Prisma ORM with SQLite database
- **Frontend**: Vanilla TypeScript with custom router, Vite build system, Tailwind CSS
- **Real-time**: WebSocket integration for live chat and multiplayer gameplay
- **Authentication**: JWT with 2FA support

## Architecture

### Backend Structure (`backend/src/`)
- `server.ts` - Main Fastify application entry point
- `routes/` - API endpoints for auth, chat, profile, notifications
- `plugins/websocket.ts` - WebSocket plugin for real-time features
- `prisma/schema.prisma` - Database schema with User, Match, Message, Block, GameInvite, Notification models

### Frontend Structure (`frontend/src/`)
- `main.ts` - Application entry point with router setup
- `pages/` - Page components (Login, Home, Game, Profile, Chat, SignUp)
- `router/router.ts` - Custom client-side routing
- `components/` - Reusable UI components

### Database Models
- **User**: Authentication, stats, 2FA, friends, matches
- **Match**: Game results with player relationships  
- **Message**: Direct messaging system
- **Block**: User blocking functionality
- **GameInvite**: Game invitation system
- **Notification**: User notification system

## Common Development Commands

### Development
```bash
npm run dev                    # Start both frontend and backend concurrently
npm run dev:backend           # Backend only (includes Prisma generation)
npm run dev:frontend          # Frontend only with Vite dev server
```

### Building
```bash
npm run build                 # Build both frontend and backend
npm run build:backend         # TypeScript compilation with Prisma generation
npm run build:frontend        # Vite production build
```

### Database
```bash
npm run db:seed              # Seed database with initial data
npx prisma generate          # Generate Prisma client (backend/)
npx prisma migrate dev       # Run database migrations (backend/)
```

### Production
```bash
npm start                    # Start production server
```

## Development Setup

The project uses Docker containers for development:
1. Install "Dev Container" extension in VS Code
2. Ensure port 3000 is available
3. Use Ctrl+Shift+P → "Dev Container: Reopen in Container"
4. Run `npm run dev` to start both servers

## Key Features Implementation

- **Real-time Chat**: WebSocket integration in `backend/plugins/websocket.ts` and `frontend/components/liveChat.ts`
- **Authentication**: JWT-based auth with 2FA support in `backend/routes/login.ts`
- **Game System**: Multiplayer game logic with match history tracking
- **Notifications**: Real-time notification system for game invites and messages
- **User Management**: Friend system, blocking, and profile management

## File Structure Notes

- Frontend uses custom TypeScript pages without a framework
- Backend follows modular route structure with Fastify
- Database uses SQLite with Prisma for ORM
- Static assets served from `public/` directory
- Frontend built with Vite and styled with Tailwind CSS