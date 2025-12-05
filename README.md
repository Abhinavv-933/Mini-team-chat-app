# Mini Team Chat Application

A real-time team collaboration chat application built with Next.js, Express, Socket.io, and PostgreSQL.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Secure registration and login with JWT
- ✅ **Real-Time Messaging** - Instant message delivery using Socket.io WebSockets
- ✅ **Channels** - Create, join, and leave channels
- ✅ **Online Presence** - See who's currently online (supports multiple tabs/devices)
- ✅ **Message History** - Persistent message storage with pagination
- ✅ **Responsive Design** - Works on desktop and mobile devices

### Bonus Features
- ✅ **Typing Indicators** - See when other users are typing
- ✅ **Message Timestamps** - Relative time display
- ✅ **Channel Descriptions** - Optional description field for channels
- ✅ **Member Count** - See how many members are in each channel

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** (App Router) - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Socket.io-client** - WebSocket client
- **Zustand** - State management

### Backend
- **Node.js** with **Express** - Server framework
- **TypeScript** - Type safety
- **Socket.io** - WebSocket server
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)

## 🔧 Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd Mini-team-chat-app
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Create a .env file with the following:
PORT=4000
DATABASE_URL="postgresql://username:password@localhost:5432/minichat?schema=public"
JWT_SECRET="your-secret-key-here"
FRONTEND_URL="http://localhost:3000"

# Generate Prisma client
npx prisma generate

# Push database schema (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate dev

# Start the backend server
npm run dev
\`\`\`

The backend will run on `http://localhost:4000`

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Create a .env.local file with the following:
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000

# Start the frontend server
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

## 🎯 Usage

1. **Register** - Create a new account at `/auth/register`
2. **Login** - Sign in at `/auth/login`
3. **Create Channel** - Click "Create Channel" in the sidebar
4. **Join Channel** - Select a channel from the list
5. **Send Messages** - Type and press Enter to send (Shift+Enter for new line)
6. **See Online Users** - Check the right sidebar for online status

## 📁 Project Structure

\`\`\`
Mini-team-chat-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Request handlers
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Auth middleware
│   │   ├── socket/                # Socket.io handlers
│   │   ├── lib/                   # Prisma client
│   │   └── server.ts              # Entry point
│   ├── .env                       # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/                   # Next.js pages
    │   │   ├── auth/              # Auth pages
    │   │   └── chat/              # Chat page
    │   ├── components/            # React components
    │   ├── hooks/                 # Custom hooks
    │   ├── store/                 # Zustand stores
    │   └── lib/                   # Utilities
    ├── .env.local                 # Environment variables
    └── package.json
\`\`\`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Channels
- `GET /api/channels` - List all channels
- `POST /api/channels` - Create new channel
- `GET /api/channels/:id` - Get channel details
- `POST /api/channels/:id/join` - Join channel
- `POST /api/channels/:id/leave` - Leave channel

### Messages
- `GET /api/messages/:channelId?limit=50&cursor=<messageId>` - Get messages with pagination

## 🔄 WebSocket Events

### Client → Server
- `join_channel` - Join a channel room
- `leave_channel` - Leave a channel room
- `send_message` - Send a new message
- `typing` - User is typing

### Server → Client
- `new_message` - New message in channel
- `presence_update` - User online/offline status changed
- `user_typing` - Another user is typing

## 🗄️ Database Schema

### User
- id, email, username, password, createdAt, updatedAt

### Channel
- id, name, description, createdAt, updatedAt

### ChannelMember
- id, userId, channelId, joinedAt

### Message
- id, content, userId, channelId, createdAt

### Presence
- id, userId, socketId, online, lastSeen

## 🚀 Deployment

### Database (Neon/Supabase/Railway)
1. Create a PostgreSQL database
2. Copy the connection string
3. Update `DATABASE_URL` in backend `.env`
4. Run migrations: `npx prisma migrate deploy`

### Backend (Render/Railway/Fly.io)
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install && npx prisma generate && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend (Vercel/Netlify)
1. Import GitHub repository
2. Set root directory to `frontend`
3. Add environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
4. Deploy

## 🎥 Demo Video

The demo video includes:
- User registration and login
- Creating and joining channels
- Real-time messaging between two browser windows
- Online/offline presence indicators
- Message pagination
- Codebase walkthrough

## 🔐 Security Considerations

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Protected API routes with middleware
- Socket.io authentication on connection
- Environment variables for sensitive data

## 🐛 Known Limitations

- No message editing or deletion (can be added)
- No private channels (can be added)
- No file uploads (can be added)
- No message search (can be added)
- Pagination loads older messages but doesn't implement infinite scroll UI

## 📝 Design Decisions

1. **Cursor-based Pagination** - More efficient for real-time data than offset pagination
2. **Separate Presence Table** - Tracks each socket connection to handle multiple tabs/devices
3. **Socket.io Rooms** - Each channel is a room for efficient message broadcasting
4. **Zustand with Persist** - Lightweight state management with localStorage persistence
5. **JWT with 7-day Expiry** - Balance between security and user experience

## 🤝 Contributing

This is a demonstration project for a full-stack internship assignment.

## 📄 License

MIT

## 👤 Author

**Abhinav Dwivedi**

For questions or feedback, please contact: ajay@deeref.co
