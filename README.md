# AI Study Buddy

A fullstack AI-powered study assistant that allows users to upload lecture notes and ask questions using RAG (Retrieval-Augmented Generation) with Google Gemini.

## Features

- **Multi-user authentication** - Email/password login with JWT tokens
- **Study sessions** - Create and organize study sessions by subject
- **Document upload** - Upload lecture notes (PDF, TXT, MD, DOCX) for AI context
- **RAG-powered chat** - Ask questions with AI responses grounded in your uploaded materials
- **Note-taking** - Create and organize notes within each study session

## Tech Stack

### Backend
- FastAPI (Python web framework)
- LangGraph (AI conversation orchestration)
- PostgreSQL with pgvector (vector similarity search)
- SQLAlchemy (async ORM)
- Google Gemini (LLM and embeddings)

### Frontend
- React + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router (navigation)

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- Google AI API key (for Gemini)

## Quick Start

### 1. Clone and Setup

```bash
cd ai-study-buddy
```

### 2. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL with the pgvector extension on port 5432.

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:5173

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql+asyncpg://studybuddy:studybuddy_password@localhost:5432/studybuddy
SECRET_KEY=your-secret-key-change-in-production
GOOGLE_API_KEY=your-google-api-key
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Study Sessions
- `GET /api/v1/sessions` - List sessions
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/{id}` - Get session
- `PUT /api/v1/sessions/{id}` - Update session
- `DELETE /api/v1/sessions/{id}` - Delete session

### Documents
- `POST /api/v1/sessions/{id}/documents` - Upload document
- `GET /api/v1/sessions/{id}/documents` - List documents
- `GET /api/v1/documents/{id}/status` - Get processing status
- `DELETE /api/v1/documents/{id}` - Delete document

### Chat
- `GET /api/v1/sessions/{id}/messages` - Get chat history
- `POST /api/v1/sessions/{id}/chat` - Send message
- `DELETE /api/v1/sessions/{id}/messages` - Clear history

### Notes
- `GET /api/v1/sessions/{id}/notes` - List notes
- `POST /api/v1/sessions/{id}/notes` - Create note
- `PUT /api/v1/notes/{id}` - Update note
- `DELETE /api/v1/notes/{id}` - Delete note

## Project Structure

```
ai-study-buddy/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/v1/           # API routes
│   │   ├── core/             # Security, config
│   │   ├── db/models/        # SQLAlchemy models
│   │   ├── graph/            # LangGraph implementation
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript types
│   └── package.json
└── docker-compose.yml
```

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```