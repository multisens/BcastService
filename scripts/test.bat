@echo off
setlocal

REM ============================================
REM USAGE:
REM ffmpeg-hls.bat input.mp4 output_folder
REM ============================================

set "INPUT_FILE=%~1"
set "OUTPUT_DIR=.\public\hls\%~2"

set "MASTER_PLAYLIST_NAME=master.m3u8"
set "CHILD_PLAYLIST_NAME=playlist_1080p.m3u8"

REM --------------------------------------------
REM Verificar argumentos
REM --------------------------------------------

if "%~1"=="" (
    echo USAGE: ffmpeg-hls.bat input_file output_folder
    exit /b 1
)

if "%~2"=="" (
    echo USAGE: ffmpeg-hls.bat input_file output_folder
    exit /b 1
)

REM --------------------------------------------
REM Verificar arquivo de entrada
REM --------------------------------------------

if not exist "%INPUT_FILE%" (
    echo ERROR: Input file not found: %INPUT_FILE%
    exit /b 1
)

REM --------------------------------------------
REM Criar diretório
REM --------------------------------------------

if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

REM --------------------------------------------
REM Informações
REM --------------------------------------------

echo(
echo(
echo -------------------------------------------------------------------
echo Creating playlist from %INPUT_FILE% to HLS.
echo Master Playlist: %OUTPUT_DIR%\%MASTER_PLAYLIST_NAME%
echo Child Playlist:  %OUTPUT_DIR%\%CHILD_PLAYLIST_NAME%
echo FFmpeg options:
echo -c:v libx264                                      : Using codec H.264/x264
echo -preset slow                                      : Uses slower compression
echo -b:v 4M                                           : 4 Mbps target bitrate
echo -maxrate 4M                                       : 4 Mbps maximum bitrate
echo -bufsize 8M                                       : Buffer size
echo -g 24                                              : Group of Pictures size
echo -keyint_min 24                                    : Minimum frames between keyframes
echo -sc_threshold 0                                   : Disable keyframe for scene change
echo -force_key_frames "expr:gte(t, n_forced * 1)"   : Force keyframes each 1 second
echo -c:a aac                                          : Audio codec AAC
echo -b:a 128k                                         : 128 kbps audio bitrate
echo -ac 2                                              : 2 audio channels
echo -hls_time 1                                       : HLS segment duration
echo -hls_list_size 0                                  : Keep all segments
echo -hls_flags independent_segments                  : Create independent segments
echo -------------------------------------------------------------------
echo(
echo(

REM --------------------------------------------
REM Executar FFmpeg
REM --------------------------------------------

C:\ffmpeg\bin\ffmpeg.exe ^
    -stream_loop -1 ^
    -i "%INPUT_FILE%" ^
    -c:v libx264 ^
    -preset slow ^
    -b:v 4M ^
    -maxrate 4M ^
    -bufsize 8M ^
    -g 24 ^
    -keyint_min 24 ^
    -sc_threshold 0 ^
    -force_key_frames "expr:gte(t,n_forced*1)" ^
    -c:a aac ^
    -b:a 128k ^
    -ac 2 ^
    -f hls ^
    -hls_time 1 ^
    -hls_list_size 0 ^
    -hls_flags independent_segments ^
    -hls_segment_type mpegts ^
    -master_pl_name "%MASTER_PLAYLIST_NAME%" ^
    -hls_segment_filename "%OUTPUT_DIR%\segment_%%03d.ts" ^
    "%OUTPUT_DIR%\%CHILD_PLAYLIST_NAME%"

if errorlevel 1 (
    echo(
    echo ERROR: FFmpeg failed.
    exit /b 1
)

echo(
echo(
echo -------------------------------------------------------------------
echo Playlist created.
echo Files generated in: %OUTPUT_DIR%
echo -------------------------------------------------------------------
echo(

endlocal