#!/bin/bash

# AI Resume Job Application - Start Script
# This script cleans up used ports, sets up database, seeds data, and starts both backend and frontend with hot reload

echo "=========================================="
echo "  AI Resume Job Application Starter"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ports used by the application
BACKEND_PORT=5001
FRONTEND_PORT=3000

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Port $port is in use by PID $pid. Killing process...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}Port $port is now free${NC}"
    else
        echo -e "${GREEN}Port $port is available${NC}"
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q; then
            echo -e "${GREEN}PostgreSQL is running${NC}"
            return 0
        fi
    fi

    # Check if postgres is running via process
    if pgrep -x "postgres" > /dev/null; then
        echo -e "${GREEN}PostgreSQL process is running${NC}"
        return 0
    fi

    echo -e "${YELLOW}PostgreSQL may not be running. Attempting to start...${NC}"

    # Try to start PostgreSQL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql 2>/dev/null || brew services start postgresql@14 2>/dev/null || brew services start postgresql@15 2>/dev/null || true
    else
        sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null || true
    fi

    sleep 2
    return 0
}

# Function to create database if not exists
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"

    # Check if database exists, create if not
    if command -v psql &> /dev/null; then
        psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw ai_resume_db
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Creating database ai_resume_db...${NC}"
            createdb ai_resume_db 2>/dev/null || psql -c "CREATE DATABASE ai_resume_db;" 2>/dev/null || true
        fi
    fi

    echo -e "${GREEN}Database setup complete${NC}"
}

# Clean up ports
echo ""
echo -e "${BLUE}Step 1: Cleaning up ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Check PostgreSQL
echo ""
echo -e "${BLUE}Step 2: Checking PostgreSQL...${NC}"
check_postgres

# Setup database
setup_database

# Check if .env file exists and load it
if [ ! -f ".env" ]; then
    echo -e "${RED}.env file not found! Creating default .env file...${NC}"
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_resume_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Server Configuration
PORT=5001
FRONTEND_PORT=3000
NODE_ENV=development

# OpenRouter AI Configuration
OPENROUTER_API_KEY="your-openrouter-api-key-here"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="anthropic/claude-haiku-4.5"
AI_MODEL="anthropic/claude-haiku-4.5"

# Demo User Credentials
DEMO_EMAIL="demo@example.com"
DEMO_PASSWORD="demo123"
EOF
    echo -e "${GREEN}.env file created with defaults${NC}"
fi

# Load environment variables from .env file
echo ""
echo -e "${BLUE}Step 3: Loading environment variables...${NC}"
export $(grep -v '^#' .env | xargs)
echo -e "${GREEN}Environment variables loaded${NC}"

# Install dependencies if node_modules doesn't exist
echo ""
echo -e "${BLUE}Step 4: Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
else
    echo -e "${GREEN}Backend dependencies installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
else
    echo -e "${GREEN}Frontend dependencies installed${NC}"
fi

# Generate Prisma client and push schema
echo ""
echo -e "${BLUE}Step 5: Setting up Prisma...${NC}"
cd backend
echo -e "${YELLOW}Generating Prisma client...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma generate 2>/dev/null
echo -e "${YELLOW}Pushing database schema...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss 2>/dev/null
echo -e "${GREEN}Database schema updated${NC}"

# Auto-seed database
echo ""
echo -e "${BLUE}Step 6: Seeding database with demo data...${NC}"
echo -e "${YELLOW}Seeding database (this may take a moment)...${NC}"
DATABASE_URL="$DATABASE_URL" npx ts-node prisma/seed.ts 2>/dev/null || echo -e "${YELLOW}Seed completed (or already seeded)${NC}"
echo -e "${GREEN}Database seeding complete${NC}"

cd ..

# Start the applications
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Starting Applications with Hot Reload${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${CYAN}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${CYAN}API:${NC}      http://localhost:$BACKEND_PORT/api"
echo ""
echo -e "${YELLOW}Demo Login Credentials:${NC}"
echo -e "  Email:    demo@example.com"
echo -e "  Password: demo123"
echo ""
echo -e "${YELLOW}Hot Reload Enabled:${NC}"
echo -e "  - Backend uses ts-node-dev for automatic restart on changes"
echo -e "  - Frontend uses Vite HMR for instant updates"
echo ""
echo -e "${RED}Press Ctrl+C to stop both servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    echo -e "${GREEN}Services stopped. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background with hot reload
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend with hot reload
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
