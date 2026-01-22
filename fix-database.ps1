# Prisma Migration Script
# This script will create the database tables in PostgreSQL

Write-Host "🚀 Starting Prisma Migration Process..." -ForegroundColor Green

# Navigate to server directory
Set-Location "server"

# Check if Prisma schema exists
if (Test-Path "prisma/schema.prisma") {
    Write-Host "✅ Prisma schema found" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma schema not found!" -ForegroundColor Red
    exit 1
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Run database migration
Write-Host "💾 Creating database tables..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Check if migration was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migration completed successfully!" -ForegroundColor Green
    Write-Host "📊 You can now run Prisma Studio:" -ForegroundColor Cyan
    Write-Host "   npx prisma studio" -ForegroundColor White
} else {
    Write-Host "❌ Database migration failed!" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL connection and try again." -ForegroundColor Yellow
}

# Return to original directory
Set-Location ".."