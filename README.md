# Task Manager - Advanced Features Assignment

## Student Information
- **Name:** [Your Name]
- **Course:** MIS-233
- **Assignment:** Advanced Features Implementation

## Implemented Features

###  1. User Accounts & Login/Logout (+ Bonus Registration)
- User database table with username and password fields
- Registration screen for creating new accounts
- Login screen with authentication
- Logout functionality that clears session
- Toggle between login and registration forms

###  2. JWT Authentication
- JWT token generation on successful login
- Token stored in localStorage
- Protected API endpoints requiring valid JWT
- Authorization header (`Bearer token`) sent with all requests
- Middleware protection on all `/api/tasks/*` routes
- User identification from JWT payload

###  3. WebSocket Integration (Real-time Updates)
- WebSocket endpoint at `/ws`
- Real-time task synchronization across multiple tabs/windows
- Broadcast system that notifies all connected clients
- Multi-tab support (each user can have multiple active connections)
- Live indicator showing connection status
- Automatic refresh when tasks are created, updated, or deleted

## Tech Stack

### Frontend
- **React** (TypeScript)
- **Vite** for build tooling
- **WebSocket API** for real-time communication

### Backend
- **Deno** runtime
- **Hono** web framework
- **sql.js** for SQLite database
- **Drizzle ORM** for database operations
- **JWT** for authentication
- **WebSocket** for real-time updates

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── db/
│   │   ├── connection.ts       # Database connection
│   │   ├── drizzle.ts          # Drizzle ORM setup
│   │   └── schema.ts           # Database schema (users, tasks)
│   ├── middleware/
│   │   └── logger.ts           # Request logging
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   └── tasks.ts            # Task CRUD routes (JWT protected)
│   ├── ws.ts                   # WebSocket management
│   └── main.ts                 # Server entry point
├── src/
│   ├── App.tsx                 # Main app with auth state
│   ├── Login.tsx               # Login/Register screen
│   ├── TaskApp.tsx             # Task management UI + WS connection
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── Modal.tsx               # Modal component
└── README.md
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  module TEXT,
  user_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);
```

## How to Run

### Prerequisites
- Node.js (v18+)
- Deno (v1.40+)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser at: `http://localhost:5173`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Run the server:
```bash
deno task dev
```

Server will start at: `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Tasks (JWT Protected)
- `GET /api/tasks` - Get all user's tasks
- `GET /api/tasks?q=search` - Search tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### WebSocket
- `WS /ws?token=JWT_TOKEN` - Real-time updates connection

## Features Demo

### 1. User Registration
- Open the app
- Click "Register" link
- Enter username and password
- Successfully create account

### 2. User Login
- Enter credentials
- Receive JWT token (stored in localStorage)
- Redirect to task manager

### 3. Task Management
- Create, update, delete tasks
- Filter by status (todo, in progress, done, blocked, archived)
- Search tasks
- Change priority levels

### 4. Real-time Updates (WebSocket)
- Open two browser tabs/windows
- Login with same user in both
- Create/update/delete a task in one tab
- **See automatic update in the other tab** (no refresh needed)
- Green "● Live" indicator shows connection status

### 5. Logout
- Click logout button
- Token removed from localStorage
- Redirect back to login screen

## Security Features

- JWT-based authentication
- Protected API routes
- User-specific data isolation (users only see their own tasks)
- Token validation on every request
- WebSocket authentication via token

## Key Implementation Details

### JWT Flow
1. User logs in with credentials
2. Backend validates and returns JWT token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend middleware verifies token before processing requests

### WebSocket Real-time Updates
1. Client connects to WebSocket with JWT token
2. Backend maintains a map of userId → Set of WebSocket connections
3. When any task is created/updated/deleted:
   - Backend calls `broadcast(userId, "update")`
   - All connected tabs for that user receive "update" message
   - Frontend triggers automatic data refresh
4. Multi-tab support: Each user can have multiple active connections

### Database Operations
- Using Drizzle ORM for type-safe queries
- sql.js for embedded SQLite database
- Automatic database file persistence
- User-scoped queries (WHERE user_id = currentUserId)

## Testing the Features

1. **Registration & Login:**
   - Register a new user "testuser"
   - Login with the created credentials
   - Verify JWT token in browser DevTools → Application → Local Storage

2. **JWT Protection:**
   - Try accessing `/api/tasks` without token → 401 Unauthorized
   - Login and access with token → Success

3. **WebSocket Live Updates:**
   - Login in two separate browser tabs
   - Create a task in Tab 1
   - Watch it appear instantly in Tab 2
   - Update/delete in Tab 2, see changes in Tab 1

## Bonus Points Earned

User Registration (beyond basic login)  
Real-time WebSocket integration  
Multi-tab support  
User-specific data isolation  

## Known Limitations

- Passwords stored in plain text (demo purposes only)
- No password reset functionality
- No email verification
- In-memory WebSocket connections (cleared on server restart)

## Future Enhancements

- Password hashing (bcrypt)
- Refresh token support
- JWT blacklist with Bloom filter
- Connection pooling
- Redis caching
- Rate limiting

---

