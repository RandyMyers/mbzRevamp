@echo off
echo Starting test execution...
set PAGER=
set GIT_PAGER=
node scripts/testPersonalizedTemplates.js
echo.
echo Test completed. Press any key to continue...
pause
