#!/bin/bash

# AI Resume Job Application - Start Script
# This script cleans up used ports and starts both backend and frontend

echo "🚀 AI Resume Job Application Startup Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports used by the application
BACKEND_PORT=5001
FRONTEND_PORT=3000

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use by PID $pid. Killing process...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ Port $port is now free${NC}"
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q; then
            echo -e "${GREEN}✓ PostgreSQL is running${NC}"
            return 0
        fi
    fi

    # Check if postgres is running via process
    if pgrep -x "postgres" > /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL process is running${NC}"
        return 0
    fi

    echo -e "${YELLOW}⚠️  PostgreSQL may not be running. Please ensure it's started.${NC}"
    echo -e "${BLUE}   On macOS: brew services start postgresql${NC}"
    echo -e "${BLUE}   On Linux: sudo systemctl start postgresql${NC}"
    return 1
}

# Function to create database if not exists
setup_database() {
    echo -e "${BLUE}📦 Setting up database...${NC}"

    # Check if database exists, create if not
    if command -v psql &> /dev/null; then
        psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw ai_resume_db
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Creating database ai_resume_db...${NC}"
            createdb ai_resume_db 2>/dev/null || psql -c "CREATE DATABASE ai_resume_db;" 2>/dev/null
        fi
    fi

    echo -e "${GREEN}✓ Database setup complete${NC}"
}

# Clean up ports
echo ""
echo -e "${BLUE}🔧 Cleaning up ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Check PostgreSQL
echo ""
echo -e "${BLUE}🐘 Checking PostgreSQL...${NC}"
check_postgres

# Setup database
setup_database

# Check if .env file exists and load it
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file in the root directory with the required configuration.${NC}"
    echo -e "${BLUE}Example .env file:${NC}"
    echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/ai_resume_db?schema=public\""
    echo "JWT_SECRET=\"your-super-secret-jwt-key\""
    echo "PORT=5001"
    echo "OPENROUTER_API_KEY=\"your-openrouter-api-key\""
    exit 1
fi

# Load environment variables from .env file
echo -e "${BLUE}📋 Loading environment variables...${NC}"
export $(grep -v '^#' .env | xargs)
echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Install dependencies if node_modules doesn't exist
echo ""
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
else
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
else
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

# Generate Prisma client and push schema
echo ""
echo -e "${BLUE}🔄 Setting up Prisma...${NC}"
cd backend
echo -e "${YELLOW}Generating Prisma client...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma generate
echo -e "${YELLOW}Pushing database schema...${NC}"
DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss
echo -e "${GREEN}✓ Database schema updated${NC}"

# Check if database needs seeding
echo ""
echo -e "${BLUE}🌱 Checking if seeding is needed...${NC}"
read -p "Do you want to seed the database with demo data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    DATABASE_URL="$DATABASE_URL" npm run db:seed
    echo -e "${GREEN}✓ Database seeded successfully${NC}"
fi

cd ..

# Start the applications
echo ""
echo -e "${GREEN}🎉 Starting applications...${NC}"
echo ""
echo -e "${BLUE}Backend will run on: http://localhost:$BACKEND_PORT${NC}"
echo -e "${BLUE}Frontend will run on: http://localhost:$FRONTEND_PORT${NC}"
echo ""
echo -e "${YELLOW}Demo credentials:${NC}"
echo -e "  Email: demo@example.com"
echo -e "  Password: demo123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
