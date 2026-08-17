#!/bin/bash
# USAGE: ./ffmpeg-hls.sh <path to file> <output subdir> [--once|--infinite]
#   --once      (default) Convert the video a single time and stop at its end.
#   --infinite  Loop the input forever, continuously generating segments.

INPUT_FILE=""
OUTPUT_SUBDIR=""
LOOP_MODE="once"

for arg in "$@"; do
  case "$arg" in
    --infinite)
      LOOP_MODE="infinite"
      ;;
    --once)
      LOOP_MODE="once"
      ;;
    *)
      if [ -z "$INPUT_FILE" ]; then
        INPUT_FILE="$arg"
      elif [ -z "$OUTPUT_SUBDIR" ]; then
        OUTPUT_SUBDIR="$arg"
      fi
      ;;
  esac
done

OUTPUT_DIR="./public/hls/${OUTPUT_SUBDIR}"
MASTER_PLAYLIST_NAME="master.m3u8"
CHILD_PLAYLIST_NAME="playlist_1080p.m3u8"

if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_SUBDIR" ]; then
  echo "USAGE: ./ffmpeg-hls.sh <path to file> <output subdir> [--once|--infinite]"
  exit 1
fi

if [ "$LOOP_MODE" = "infinite" ]; then
  STREAM_LOOP_OPT="-stream_loop -1"
else
  STREAM_LOOP_OPT=""
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo "ERROR: Input file not found: ${INPUT_FILE}"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo -e "\n\n-------------------------------------------------------------------"
echo "Creating playlist from ${INPUT_FILE} to HLS."
echo "Master Playlist: ${OUTPUT_DIR}/${MASTER_PLAYLIST_NAME}"
echo "Child Playlist:  ${OUTPUT_DIR}/${CHILD_PLAYLIST_NAME}"
echo "FFmpeg options:"
echo "-c:v libx264                                      : Using codec H.264/x264"
echo "-preset slow                                      : Uses slower compression"
echo "-b:v 4M                                           : 4 Mbps target bitrate"
echo "-maxrate 4M                                       : 4 Mbps maximum bitrate"
echo "-bufsize 8M                                       : Buffer size"
echo "-g 24                                             : Group of Pictures size (24 frames)"
echo "-keyint_min 24                                    : Minimum of frames between keyframes"
echo "-sc_threshold 0                                   : Disable keyframe for scene change"
echo "-force_key_frames \"expr:gte(t, n_forced * 1)\"   : Force keyframes at each 1 second"
echo "-c:a aac                                          : Audio codec AAC"
echo "-b:a 128k                                         : 128 kbps audio bitrate"
echo "-ac 2                                             : 2 audio channels"
echo "-hls_time 1                                       : HLS file segment with 1 seconds"
echo "-hls_list_size 0                                  : Keep all segments in the playlist"
echo "-hls_flags independent_segments                   : Create independent segments"
echo "Loop mode: ${LOOP_MODE}"
echo "-------------------------------------------------------------------\n\n"

ffmpeg \
    ${STREAM_LOOP_OPT} \
    -i "$INPUT_FILE" \
    -c:v libx264 -preset slow -b:v 4M -maxrate 4M -bufsize 8M \
    -g 24 -keyint_min 24 -sc_threshold 0 \
    -force_key_frames "expr:gte(t, n_forced * 1)" \
    -c:a aac -b:a 128k -ac 2 \
    -f hls \
    -hls_time 1 \
    -hls_list_size 0 \
    -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -master_pl_name "${MASTER_PLAYLIST_NAME}" \
    -hls_segment_filename "${OUTPUT_DIR}/segment_%03d.ts" \
    "${OUTPUT_DIR}/${CHILD_PLAYLIST_NAME}"

echo -e "\n\n-------------------------------------------------------------------"
echo "Playlist created."
echo "Files generated in: ${OUTPUT_DIR}"
echo "-------------------------------------------------------------------\n\n"