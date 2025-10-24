#!/bin/bash

# GoGaze Client Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_NAME="gogaze-client"

echo -e "${BLUE}🚀 Starting deployment to ${ENVIRONMENT} environment${NC}"

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

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_status "Environment: ${ENVIRONMENT}"
print_status "Version: ${VERSION}"

# Create necessary directories
mkdir -p logs/nginx
mkdir -p ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/provisioning

# Set environment variables
export ENVIRONMENT=$ENVIRONMENT
export VERSION=$VERSION
export IMAGE_TAG="${DOCKER_REGISTRY}/${IMAGE_NAME}:${VERSION}"

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if required files exist
required_files=(
    "Dockerfile"
    "docker-compose.${ENVIRONMENT}.yml"
    "nginx.${ENVIRONMENT}.conf"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file $file not found"
        exit 1
    fi
done

print_status "All required files found"

# Build Docker image
print_status "Building Docker image..."
docker build -t ${IMAGE_TAG} .

if [[ $? -eq 0 ]]; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Tag image for registry
docker tag ${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest

# Push to registry (if not local)
if [[ "$DOCKER_REGISTRY" != "localhost" ]]; then
    print_status "Pushing image to registry..."
    docker push ${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml down --remove-orphans

# Start new containers
print_status "Starting new containers..."
docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Health check
print_status "Running health checks..."

# Check if main application is responding
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Main application is healthy"
else
    print_warning "Main application health check failed"
fi

# Check if Redis is responding
if docker-compose -f docker-compose.${ENVIRONMENT}.yml exec -T redis redis-cli ping | grep -q PONG; then
    print_status "Redis is healthy"
else
    print_warning "Redis health check failed"
fi

# Show running containers
print_status "Deployment completed. Running containers:"
docker-compose -f docker-compose.${ENVIRONMENT}.yml ps

# Show logs
print_status "Recent logs:"
docker-compose -f docker-compose.${ENVIRONMENT}.yml logs --tail=20

# Show access information
echo -e "${BLUE}📋 Access Information:${NC}"
echo -e "Application: http://localhost:3000"
echo -e "Health Check: http://localhost:3000/health"

if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo -e "Grafana: http://localhost:3001 (admin/admin)"
    echo -e "Prometheus: http://localhost:9090"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "Grafana: http://localhost:3001"
    echo -e "Prometheus: http://localhost:9090"
    echo -e "Kibana: http://localhost:5601"
fi

print_status "Deployment to ${ENVIRONMENT} completed successfully! 🎉"
