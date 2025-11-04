#!/bin/bash
# usage: ./ffmpeg-hls.sh <path to file> <output subdir>

INPUT_FILE=$1
OUTPUT_DIR="./hls/$2"
MASTER_PLAYLIST_NAME="master.m3u8"
CHILD_PLAYLIST_NAME="playlist_1080p.m3u8"

if [ ! -f "$INPUT_FILE" ]; then
    echo "ERRO: O arquivo de entrada não foi encontrado: ${INPUT_FILE}"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo -e "\n-------------------------------------------------------------------"
echo "Streaming (Live Loop) de ${INPUT_FILE} para HLS (1 resolução)."
echo "Master Playlist: ${OUTPUT_DIR}/${MASTER_PLAYLIST_NAME}"
echo "Child Playlist:  ${OUTPUT_DIR}/${CHILD_PLAYLIST_NAME}"
echo "Segmentação de 2 segundos, resetando segmentos a cada loop."
echo "-------------------------------------------------------------------\n"

TZ='UTC' ffmpeg \
  -re \
  -i "$INPUT_FILE" \
  -fflags +nobuffer \
  -c:v libx264 -preset slow -b:v 4M -maxrate 4M -bufsize 8M -g 48 -sc_threshold 0 -keyint_min 48 \
  -c:a aac -b:a 128k -ac 2 \
  -f hls \
  -hls_time 2 \
  -hls_list_size 0 \
  -hls_flags program_date_time+independent_segments \
  -hls_segment_type mpegts \
  -master_pl_name "${MASTER_PLAYLIST_NAME}" \
  -hls_segment_filename "${OUTPUT_DIR}/segment_%03d.ts" \
  "${OUTPUT_DIR}/${CHILD_PLAYLIST_NAME}"

echo -e "\n-------------------------------------------------------------------"
echo "Streaming (Live Loop) encerrado."
echo "Arquivos gerados em: ${OUTPUT_DIR}"
echo "-------------------------------------------------------------------\n"
