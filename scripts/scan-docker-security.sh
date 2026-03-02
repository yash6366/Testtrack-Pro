#!/bin/sh
# =============================================================================
# Docker Security Scanner
# =============================================================================
# Scans Docker images for vulnerabilities using multiple tools
# Usage: ./scripts/scan-docker-security.sh

set -e

echo "======================================"
echo "  TestTrack Pro - Security Scanner"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Images to scan
API_IMAGE="testtrack-api:latest"
WEB_IMAGE="testtrack-web:latest"

# Build images first
echo "${YELLOW}Building images...${NC}"
docker build -t $API_IMAGE -f apps/api/Dockerfile .
docker build -t $WEB_IMAGE -f apps/web/Dockerfile .
echo "${GREEN}✓ Images built${NC}"
echo ""

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
    echo "${RED}✗ Trivy not installed${NC}"
    echo "Install with:"
    echo "  macOS: brew install trivy"
    echo "  Linux: wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-64bit.tar.gz"
    echo ""
fi

# Scan with Trivy
if command -v trivy &> /dev/null; then
    echo "${YELLOW}Scanning with Trivy...${NC}"
    echo ""
    
    echo "--- API Image ---"
    trivy image --severity HIGH,CRITICAL --format table $API_IMAGE
    echo ""
    
    echo "--- Web Image ---"
    trivy image --severity HIGH,CRITICAL --format table $WEB_IMAGE
    echo ""
    
    # Generate JSON report
    echo "${YELLOW}Generating detailed reports...${NC}"
    trivy image --severity HIGH,CRITICAL --format json --output trivy-api-report.json $API_IMAGE
    trivy image --severity HIGH,CRITICAL --format json --output trivy-web-report.json $WEB_IMAGE
    echo "${GREEN}✓ Reports saved: trivy-api-report.json, trivy-web-report.json${NC}"
    echo ""
fi

# Scan with Docker Scout
if command -v docker &> /dev/null && docker scout version &> /dev/null 2>&1; then
    echo "${YELLOW}Scanning with Docker Scout...${NC}"
    echo ""
    
    echo "--- API Image ---"
    docker scout cves $API_IMAGE
    echo ""
    
    echo "--- Web Image ---"
    docker scout cves $WEB_IMAGE
    echo ""
    
    echo "${YELLOW}Recommendations:${NC}"
    docker scout recommendations $API_IMAGE
    docker scout recommendations $WEB_IMAGE
else
    echo "${YELLOW}ℹ Docker Scout not available (requires Docker Desktop)${NC}"
    echo ""
fi

# Scan with Snyk
if command -v snyk &> /dev/null; then
    echo "${YELLOW}Scanning with Snyk...${NC}"
    echo ""
    
    echo "--- API Image ---"
    snyk container test $API_IMAGE --severity-threshold=high || true
    echo ""
    
    echo "--- Web Image ---"
    snyk container test $WEB_IMAGE --severity-threshold=high || true
    echo ""
else
    echo "${YELLOW}ℹ Snyk not installed (optional)${NC}"
    echo "Install with: npm install -g snyk"
    echo ""
fi

# Summary
echo "======================================"
echo "${GREEN}Security scan complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review vulnerability reports"
echo "2. Update .trivyignore for accepted risks"
echo "3. Patch HIGH/CRITICAL CVEs immediately"
echo "4. Schedule monthly security reviews"
echo ""
echo "Documentation: docs/DOCKER-SECURITY.md"
