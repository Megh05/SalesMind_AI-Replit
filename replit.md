# OmniReach - AI-Powered Sales Automation Platform

## Project Overview
OmniReach is a fully functional AI-powered sales automation platform with workflow-driven, multi-channel sales engagement capabilities.

## Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Flow
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Queue**: BullMQ + Redis for async workflow execution
- **AI**: OpenRouter/Mistral API for message generation
- **OAuth**: Custom implementation for Gmail, Google Calendar, LinkedIn

### Key Features Implemented

#### Phase 0 - Foundations ✅
- Full-stack setup with JWT authentication
- PostgreSQL database with Drizzle ORM
- Redis for queue management
- Docker configuration
- Logging infrastructure

#### Phase 1 - Core MVP ✅
- Lead CRUD operations with CSV import/export
- AI Persona creation and management
- Workflow builder using React Flow
- AI-powered message generation via OpenRouter/Mistral
- Email sending via SendGrid
- Webhook tracking for opens/replies
- Analytics dashboard

#### Phase 2 - Durable Workflow Engine ✅
- WorkflowRun + NodeRun models
- BullMQ worker for async execution
- Node types: AI Generate, Send Email, Send SMS, Wait, Decision
- Retry logic with exponential backoff
- Pause/resume functionality

#### Phase 3 - Multi-channel (In Progress - ~70%)
- ✅ Email adapter (SendGrid + Gmail OAuth)
- ✅ SMS adapter (Twilio)
- ✅ Calendar adapter (Google Calendar OAuth)
- ✅ LinkedIn adapter (OAuth with limitations)
- ✅ Channel fallback logic
- ✅ Webhook support for tracking

## OAuth Implementation

### Important Note
We implemented a **custom OAuth solution** instead of using Replit's Gmail/Google Calendar connectors. This provides several benefits:

1. **User-owned accounts**: Each user connects their own Gmail/Calendar/LinkedIn
2. **No shared API keys**: More secure, per-user authentication
3. **Higher limits**: Uses individual user quotas
4. **Better compliance**: Users control their own data

### Security Features

**CSRF Protection with Redis-Based State Validation:**
- OAuth state tokens are cryptographically random (32-byte hex)
- State is stored in Redis with userId and provider before auth URL generation
- 10-minute TTL prevents replay attacks
- State is validated on callback against authenticated user
- One-time use: State is deleted immediately after validation
- Callback endpoints require authentication to prevent unauthorized access

This prevents account-link poisoning attacks where an attacker could bind their OAuth tokens to a victim's account.

### OAuth Setup Required

To use the OAuth features, you need to set up OAuth credentials:

#### Google OAuth (Gmail + Calendar)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.repl.co/api/oauth/google/callback`
6. Set environment variables:
   - `GOOGLE_CLIENT_ID`: Your OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your OAuth client secret
   - `GOOGLE_REDIRECT_URI`: The callback URL

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URL: `https://your-domain.repl.co/api/oauth/linkedin/callback`
4. Set environment variables:
   - `LINKEDIN_CLIENT_ID`: Your app client ID
   - `LINKEDIN_CLIENT_SECRET`: Your app client secret
   - `LINKEDIN_REDIRECT_URI`: The callback URL

### How Users Connect Accounts

1. Go to Settings → Integrations tab
2. Click "Connect" on Gmail & Google Calendar or LinkedIn
3. Authorize the app in the OAuth flow
4. Tokens are securely stored in the database
5. Services automatically use OAuth-connected accounts for sending

### Database Schema

The `oauth_credentials` table stores:
- userId: Reference to the user
- provider: 'google' or 'linkedin'
- accessToken: OAuth access token (encrypted in production)
- refreshToken: For token refresh
- expiresAt: Token expiration timestamp
- email: Connected account email
- isActive: Connection status

### Service Architecture

#### Email Service
- **Primary**: Gmail API (if OAuth connected)
- **Fallback**: SendGrid (if configured)
- Automatically handles token refresh

#### Calendar Service
- **Google Calendar API**: Creates events with Meet links
- Supports custom scheduling times
- Auto-generates meeting invites

#### LinkedIn Service
- **LinkedIn API**: Posts/shares content
- Note: Direct messaging has limited API availability
- Uses Share API as alternative

## Environment Variables

Required environment variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain/api/oauth/google/callback
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://your-domain/api/oauth/linkedin/callback
```

Optional (fallback services):
```
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
OPENROUTER_API_KEY=your-openrouter-key
```

## Running the Application

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at the configured Replit URL.

## Future Enhancements (Phases 4-10)

- **Phase 4**: Relationship graph & RAG intelligence
- **Phase 5**: Advanced Persona Studio & Policy Engine
- **Phase 6**: Autonomous Negotiation Agent
- **Phase 7**: Marketplace & Plugin Ecosystem
- **Phase 8**: Enterprise & Security (SSO, Audit logs)
- **Phase 9**: Observability & Cost Optimization
- **Phase 10**: Growth & Monetization features
