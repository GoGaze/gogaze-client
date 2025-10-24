#!/bin/bash

# GoGaze Client Rollback Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-previous}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_NAME="gogaze-client"

echo -e "${BLUE}🔄 Starting rollback for ${ENVIRONMENT} environment${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_status "Environment: ${ENVIRONMENT}"
print_status "Rolling back to version: ${VERSION}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Get current version for backup
CURRENT_VERSION=$(docker-compose -f docker-compose.${ENVIRONMENT}.yml config | grep image | head -1 | cut -d: -f3 || echo "unknown")
print_status "Current version: ${CURRENT_VERSION}"

# Create backup of current deployment
print_status "Creating backup of current deployment..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Save current docker-compose configuration
docker-compose -f docker-compose.${ENVIRONMENT}.yml config > $BACKUP_DIR/docker-compose.yml

# Save current container logs
docker-compose -f docker-compose.${ENVIRONMENT}.yml logs > $BACKUP_DIR/container-logs.log

print_status "Backup created in: $BACKUP_DIR"

# Pull the rollback version
if [[ "$VERSION" == "previous" ]]; then
    # Get the previous version from backup or use a default
    ROLLBACK_VERSION="latest"
    print_warning "Using latest version as rollback target"
else
    ROLLBACK_VERSION=$VERSION
fi

print_status "Pulling rollback version: ${ROLLBACK_VERSION}"

# Set environment variables
export ENVIRONMENT=$ENVIRONMENT
export VERSION=$ROLLBACK_VERSION
export IMAGE_TAG="${DOCKER_REGISTRY}/${IMAGE_NAME}:${ROLLBACK_VERSION}"

# Pull the rollback image
if [[ "$DOCKER_REGISTRY" != "localhost" ]]; then
    docker pull ${IMAGE_TAG}
fi

# Stop current containers gracefully
print_status "Stopping current containers gracefully..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml stop

# Wait for graceful shutdown
sleep 10

# Start rollback containers
print_status "Starting rollback containers..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Health check
print_status "Running health checks..."

# Check if main application is responding
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Main application is healthy after rollback"
else
    print_error "Main application health check failed after rollback"
    print_warning "You may need to investigate the issue"
fi

# Check if Redis is responding
if docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T redis redis-cli ping | grep -q PONG; then
    print_status "Redis is healthy after rollback"
else
    print_warning "Redis health check failed after rollback"
fi

# Show running containers
print_status "Rollback completed. Running containers:"
docker-compose -f docker-compose.${ENVIRONMENT}.yml ps

# Show logs
print_status "Recent logs after rollback:"
docker-compose -f docker-compose.${ENVIRONMENT}.yml logs --tail=20

# Cleanup old images (optional)
read -p "Do you want to clean up old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Cleaning up old Docker images..."
    docker image prune -f
fi

print_status "Rollback to ${ROLLBACK_VERSION} completed successfully! 🎉"
print_warning "Remember to investigate the original issue that caused the rollback"
