@echo off
REM Local Launch — deploy the upgraded site (index-new.html) to Vercel production
REM Run this AFTER you've eyeballed index-new.html in a browser and are happy with it.
cd /d D:\LocalLaunch

if not exist index-new.html (
  echo ERROR: index-new.html not found. Nothing to deploy.
  pause & exit /b 1
)

echo Backing up current live index.html...
copy /y index.html "index.html.backup-%date:~10,4%%date:~4,2%%date:~7,2%" >nul

echo Installing new site...
copy /y index-new.html index.html >nul

echo Deploying to Vercel production...
python vercel_deploy.py --prod

echo.
echo Done. Check https://local-launch-site.vercel.app on your PHONE (not the app preview).
echo To undo: copy the newest index.html.backup-* back over index.html and rerun vercel_deploy.py --prod
pause
