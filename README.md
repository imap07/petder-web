# Petder Web

## Overview
Petder Web is the public-facing web application of Petder, a Tinder-like platform for pets. Users can browse pet profiles, swipe to express interest, match with other pet owners, and chat with matches in real-time.

## Tech Stack
| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.4.1 |
| **State Management** | React Context API |
| **Internationalization** | next-intl (English, Spanish) |
| **Real-time Chat** | socket.io-client |
| **Maps / Location** | @react-google-maps/api |
| **Validation** | Zod |
| **Auth** | Token-based (JWT in localStorage) |

## Main Features
- **User Authentication** - Register, login, forgot/reset password
- **Onboarding Flow** - Multi-step profile and pet setup
- **Pet Profiles** - Create, edit, activate/deactivate, soft-delete pets
- **Discovery/Swipe** - Browse and swipe on pets (like/dislike), undo last swipe
- **Match Creation** - Automatic matching when mutual likes occur
- **Real-time Chat** - Message matched pet owners via Socket.io
- **Notifications** - In-app notification feed with read/unread status
- **Theme Support** - Light/dark mode via ThemeContext
- **Owner Profile** - Edit profile info and avatar

## Pages / Routes
All routes are localized under `/[locale]/` (e.g., `/en/`, `/es/`):

| Route | Description |
|-------|-------------|
| `/` | Landing page with CTA |
| `/login` | User login |
| `/register` | User registration |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset password with token |
| `/onboarding` | Multi-step onboarding flow |
| `/discover` | Swipe/discovery feed |
| `/matches` | View matched pets |
| `/messages` | Conversations list |
| `/messages/[conversationId]` | Individual chat |
| `/notifications` | Notification feed |
| `/pets` | Manage user's pets |
| `/pets/[id]` | View/edit specific pet |
| `/profile` | User/owner profile |

## Project Structure
```
src/
├── app/              # Next.js App Router pages
│   └── [locale]/     # Localized routes
├── components/       # Reusable UI components
│   ├── ui/           # Button, Input, Card, etc.
│   ├── auth/         # Login/register forms
│   ├── discover/     # Swipe cards, discovery UI
│   ├── pets/         # Pet forms, cards
│   ├── layout/       # Header, sidebar, nav
│   └── notifications/
├── contexts/         # React Context providers
│   ├── auth-context.tsx
│   ├── active-pet-context.tsx
│   ├── notifications-context.tsx
│   ├── onboarding-context.tsx
│   └── theme-context.tsx
├── features/         # Feature-specific logic
│   ├── chat/
│   └── matches/
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization config
├── lib/              # API client, auth storage
│   ├── api.ts        # REST API wrapper
│   └── auth-storage.ts
└── types/            # TypeScript type definitions
```

## Data Flow
1. **Authentication**: Token-based auth using JWT stored in `localStorage` via `authStorage`
2. **API Communication**: REST API via `lib/api.ts` wrapper to `NEXT_PUBLIC_API_URL`
3. **Active Pet Header**: `X-Active-Pet-Id` header sent with requests for pet-specific context
4. **Real-time**: Socket.io client for chat messaging

```
┌──────────────┐      REST API       ┌──────────────┐
│  Petder Web  │  ◄─────────────────►│  Petder API  │
│  (Next.js)   │                     │  (Backend)   │
└──────────────┘      Socket.io      └──────────────┘
        ▲                                   ▲
        │                                   │
        └─────── Real-time Events ──────────┘
```

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5050` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSy...` |

## How to Run Locally
```bash
# Navigate to project directory
cd petder-web

# Install dependencies
npm install

# Create .env.local from example
cp .env.example .env.local
# Edit .env.local with your API URL and Google Maps key

# Start development server (runs on port 5051)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:5051](http://localhost:5051).

## Current Status
| Feature | Status |
|---------|--------|
| Auth (login/register/reset) | ✅ Working |
| Onboarding flow | ✅ Working |
| Pet CRUD | ✅ Working |
| Discovery/Swipe | ✅ Working |
| Matches | ✅ Working |
| Chat/Messages | ✅ Working |
| Notifications | ✅ Working |
| Profile management | ✅ Working |
| i18n (en/es) | ✅ Working |
| Theme (light/dark) | ✅ Working |

## Known Issues / TODO
- [ ] Add more locales beyond English and Spanish
- [ ] Implement push notifications (currently in-app only)
- [ ] Add comprehensive E2E tests
- [ ] Add PWA support for mobile
- [ ] Implement image optimization/lazy loading improvements
