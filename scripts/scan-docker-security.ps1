# Docker Security Scanning Script (PowerShell)
# =============================================================================
# Scans Docker images for vulnerabilities using multiple tools
# Usage: .\scripts\scan-docker-security.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TestTrack Pro - Security Scanner" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Images to scan
$API_IMAGE = "testtrack-api:latest"
$WEB_IMAGE = "testtrack-web:latest"

# Build images first
Write-Host "Building images..." -ForegroundColor Yellow
docker build -t $API_IMAGE -f apps/api/Dockerfile .
docker build -t $WEB_IMAGE -f apps/web/Dockerfile .
Write-Host "✓ Images built" -ForegroundColor Green
Write-Host ""

# Check if Trivy is installed
$trivyInstalled = Get-Command trivy -ErrorAction SilentlyContinue
if (-not $trivyInstalled) {
    Write-Host "✗ Trivy not installed" -ForegroundColor Red
    Write-Host "Install with: choco install trivy" -ForegroundColor Yellow
    Write-Host "Or download from: https://github.com/aquasecurity/trivy/releases" -ForegroundColor Yellow
    Write-Host ""
}

# Scan with Trivy
if ($trivyInstalled) {
    Write-Host "Scanning with Trivy..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "--- API Image ---" -ForegroundColor Cyan
    trivy image --severity HIGH,CRITICAL --format table $API_IMAGE
    Write-Host ""
    
    Write-Host "--- Web Image ---" -ForegroundColor Cyan
    trivy image --severity HIGH,CRITICAL --format table $WEB_IMAGE
    Write-Host ""
    
    # Generate JSON report
    Write-Host "Generating detailed reports..." -ForegroundColor Yellow
    trivy image --severity HIGH,CRITICAL --format json --output trivy-api-report.json $API_IMAGE
    trivy image --severity HIGH,CRITICAL --format json --output trivy-web-report.json $WEB_IMAGE
    Write-Host "✓ Reports saved: trivy-api-report.json, trivy-web-report.json" -ForegroundColor Green
    Write-Host ""
}

# Scan with Docker Scout
try {
    docker scout version | Out-Null
    $scoutAvailable = $true
} catch {
    $scoutAvailable = $false
}

if ($scoutAvailable) {
    Write-Host "Scanning with Docker Scout..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "--- API Image ---" -ForegroundColor Cyan
    docker scout cves $API_IMAGE
    Write-Host ""
    
    Write-Host "--- Web Image ---" -ForegroundColor Cyan
    docker scout cves $WEB_IMAGE
    Write-Host ""
    
    Write-Host "Recommendations:" -ForegroundColor Yellow
    docker scout recommendations $API_IMAGE
    docker scout recommendations $WEB_IMAGE
} else {
    Write-Host "ℹ Docker Scout not available (requires Docker Desktop)" -ForegroundColor Yellow
    Write-Host ""
}

# Scan with Snyk
$snykInstalled = Get-Command snyk -ErrorAction SilentlyContinue
if ($snykInstalled) {
    Write-Host "Scanning with Snyk..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "---API Image ---" -ForegroundColor Cyan
    snyk container test $API_IMAGE --severity-threshold=high
    Write-Host ""
    
    Write-Host "--- Web Image ---" -ForegroundColor Cyan
    snyk container test $WEB_IMAGE --severity-threshold=high
    Write-Host ""
} else {
    Write-Host "ℹ Snyk not installed (optional)" -ForegroundColor Yellow
    Write-Host "Install with: npm install -g snyk" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Security scan complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review vulnerability reports"
Write-Host "2. Update .trivyignore for accepted risks"
Write-Host "3. Patch HIGH/CRITICAL CVEs immediately"
Write-Host "4. Schedule monthly security reviews"
Write-Host ""
Write-Host "Documentation: docs/DOCKER-SECURITY.md" -ForegroundColor Cyan
