@echo off
nvidia-smi --query-supported-clocks=graphics,memory --format=csv,noheader,nounits > temp.txt

REM Read the first line from the temporary file
set /p firstLine=<temp.txt

REM Extract the first comma-separated string
for /f "tokens=1,2 delims=, " %%a in ("%firstLine%") do (
    set gpu_clock=%%a
    set memory_clock=%%b
)

REM Print the extracted string
echo GPU Clock: %gpu_clock%
echo Memory Clock: %memory_clock%

REM Clean up the temporary file
del temp.txt

:force_clocks
nvidia-smi --lock-gpu-clocks=%gpu_clock%
nvidia-smi --lock-memory-clocks=%memory_clock%
pause