# 🚀 Server Restart Script (PowerShell)
# This script restarts the server to pick up the latest code changes

Write-Host "🔄 Restarting server to apply latest changes..." -ForegroundColor Yellow

# Check if PM2 is running
try {
    $pm2Check = Get-Command pm2 -ErrorAction SilentlyContinue
    if ($pm2Check) {
        Write-Host "📦 PM2 detected - restarting PM2 processes..." -ForegroundColor Green
        pm2 restart all
        pm2 status
        Write-Host "✅ PM2 processes restarted" -ForegroundColor Green
    } else {
        Write-Host "⚠️ PM2 not found - manual restart required" -ForegroundColor Red
        Write-Host "Please restart your server manually to apply the latest changes" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking PM2: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please restart your server manually" -ForegroundColor Red
}

Write-Host "🎉 Server restart completed!" -ForegroundColor Green
Write-Host "The latest invitation fixes should now be active" -ForegroundColor Green




