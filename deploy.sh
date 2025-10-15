#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Slack Webhook URL
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Function to send Slack notification
send_slack_notification() {
    local message=$1
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"${message}\"}" $SLACK_WEBHOOK_URL
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    send_slack_notification "Deployment failed: $1"
    rollback
    exit 1
}

# Function to rollback
rollback() {
    echo -e "${YELLOW}Rolling back...${NC}"
    docker-compose up -d --force-recreate > /dev/null 2>&1 || handle_error "Failed to rollback."
    echo -e "${GREEN}Rollback successful.${NC}"
    send_slack_notification "Rollback successful."
}

# Step 1: Backup current containers + database
echo -e "${BLUE}Step 1: Backing up current containers and database...${NC}"
docker-compose exec db pg_dumpall -U postgres > backup.sql || handle_error "Failed to backup database."
echo -e "${GREEN}Backup completed.${NC}"

# Step 2: Pull latest code
echo -e "${BLUE}Step 2: Pulling latest code...${NC}"
git pull origin main || handle_error "Failed to pull latest code."
echo -e "${GREEN}Code pulled successfully.${NC}"

# Step 3: Build new Docker images
echo -e "${BLUE}Step 3: Building new Docker images...${NC}"
docker-compose build --no-cache || handle_error "Failed to build Docker images."
echo -e "${GREEN}Docker images built successfully.${NC}"

# Step 4: Run database migrations
echo -e "${BLUE}Step 4: Running database migrations...${NC}"
docker-compose run --rm web python manage.py migrate || handle_error "Failed to run database migrations."
echo -e "${GREEN}Database migrations completed.${NC}"

# Step 5: Start new containers (blue-green)
echo -e "${BLUE}Step 5: Starting new containers (blue-green)...${NC}"
docker-compose up -d --scale web=2 --no-recreate || handle_error "Failed to start new containers."
echo -e "${GREEN}New containers started successfully.${NC}"

# Step 6: Health checks
echo -e "${BLUE}Step 6: Performing health checks...${NC}"
sleep 10 # Wait for containers to stabilize
curl -f http://localhost:8000/health || handle_error "Health check failed."
echo -e "${GREEN}Health checks passed.${NC}"

# Step 7: Switch traffic
echo -e "${BLUE}Step 7: Switching traffic...${NC}"
docker-compose up -d --scale web=1 --no-recreate || handle_error "Failed to switch traffic."
echo -e "${GREEN}Traffic switched successfully.${NC}"

# Step 8: Cleanup old containers
echo -e "${BLUE}Step 8: Cleaning up old containers...${NC}"
docker-compose down --remove-orphans || handle_error "Failed to cleanup old containers."
echo -e "${GREEN}Old containers cleaned up.${NC}"

# Step 9: Rollback on failure
echo -e "${BLUE}Step 9: Rollback on failure...${NC}"
# Rollback is handled in the handle_error function

# Final success message
echo -e "${GREEN}Deployment completed successfully!${NC}"
send_slack_notification "Deployment completed successfully!"