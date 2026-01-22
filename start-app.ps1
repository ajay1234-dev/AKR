# AKR Workshop Application Startup Script

Write-Host 'Starting AKR Workshop Application...' -ForegroundColor Green
Write-Host ''

Write-Host '1. Starting Backend Server...' -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\MediMindAI\AKR\server'; node server.js"

Write-Host '2. Starting Frontend Mobile App...' -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\MediMindAI\AKR'; npx expo start"

Write-Host ''
Write-Host 'Your application is starting!' -ForegroundColor Green
Write-Host '- Backend server is running on http://0.0.0.0:3000'
Write-Host '- Mobile app is available via QR code in the new terminal'
Write-Host '- Scan the QR code with your phone''s camera or Expo Go app'
Write-Host ''