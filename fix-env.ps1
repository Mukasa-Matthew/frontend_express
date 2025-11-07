# Script to fix the .env file for frontend_express
# This script removes trailing commas and ensures VITE_API_URL is properly formatted

$envFile = ".env"

if (Test-Path $envFile) {
    Write-Host "Found .env file. Fixing VITE_API_URL..."
    
    # Read all lines
    $lines = Get-Content $envFile
    
    # Fix VITE_API_URL line
    $fixedLines = $lines | ForEach-Object {
        if ($_ -match "^VITE_API_URL=(.+)") {
            $url = $matches[1].Trim()
            # Remove any trailing commas and whitespace
            $url = $url -replace ",.*$", ""
            $url = $url.Trim()
            # Ensure no trailing comma or slash
            $url = $url -replace "[,/]+$", ""
            Write-Host "Fixed VITE_API_URL to: $url"
            "VITE_API_URL=$url"
        } else {
            $_
        }
    }
    
    # Write back to file
    $fixedLines | Set-Content $envFile
    Write-Host "✅ .env file has been fixed!"
} else {
    Write-Host "Creating new .env file..."
    "VITE_API_URL=http://64.23.169.136:5000" | Set-Content $envFile
    Write-Host "✅ Created .env file with correct configuration"
}

# Also ensure the URL is set correctly (not localhost)
$fixedLines = Get-Content $envFile
$hasCorrectUrl = $false
foreach ($line in $fixedLines) {
    if ($line -match "^VITE_API_URL=http://64\.23\.169\.136:5000") {
        $hasCorrectUrl = $true
        break
    }
}

if (-not $hasCorrectUrl) {
    Write-Host ""
    Write-Host "⚠️  WARNING: VITE_API_URL should be http://64.23.169.136:5000 for production"
    Write-Host "   Removing any localhost entries..."
    $correctedLines = $fixedLines | Where-Object { $_ -notmatch "^VITE_API_URL=http://localhost" }
    "VITE_API_URL=http://64.23.169.136:5000" | Add-Content -Path $envFile -Force
    Write-Host "✅ Set VITE_API_URL to http://64.23.169.136:5000"
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Verify the .env file: Get-Content .env"
Write-Host "2. Rebuild the frontend: npm run build"
Write-Host "3. Restart your frontend server"



