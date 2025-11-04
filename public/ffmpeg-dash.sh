#!/bin/bash

# Define o caminho do arquivo de entrada (assumindo que está no diretório pai)
INPUT_FILE="videoplayback.mp4"
# Define o diretório de saída como 'dash' no diretório pai (fora da pasta scripts)
OUTPUT_DIR="./dash"
MPD_NAME="playlist_1080p.mpd"

# 1. Verifica a existência do arquivo de entrada
if [ ! -f "$INPUT_FILE" ]; then
    echo "ERRO: O arquivo de entrada não foi encontrado: ${INPUT_FILE}"
    exit 1
fi

# 2. Cria apenas o diretório raiz de saída
mkdir -p "$OUTPUT_DIR"

echo -e "\n\n-------------------------------------------------------------------"
echo "Streaming (Live Loop) de ${INPUT_FILE} para MPEG-DASH."
echo "MPD: ${OUTPUT_DIR}/${MPD_NAME}"
echo "Usando loop infinito e Perfil Dinâmico (Live)."
echo "Arquivos de Saída: ${OUTPUT_DIR}"
echo -e "-------------------------------------------------------------------\n\n"

# 3. Comando FFmpeg formatado para Live DASH.
# TZ=UTC garante que os tempos no MPD sejam corretos (embora o DASH use UTC por padrão)

TZ='UTC' ffmpeg \
    -stream_loop -1 -re \
    -i "$INPUT_FILE" \
    -fflags +nobuffer \
    -map 0:v:0 -map 0:a:0 \
    -b:v 3000k \
    -b:a 128k \
    -c:v libx264 \
    -c:a aac \
    -g 48 -keyint_min 48 \
    -movflags isml+frag_keyframe \
    -use_template 1 \
    -use_timeline 1 \
    -seg_duration 5 \
    -adaptation_sets "id=0,streams=v id=1,streams=a" \
    -f dash \
    -streaming 1 \
    "${OUTPUT_DIR}/${MPD_NAME}"

echo -e "\n\n-------------------------------------------------------------------"
echo "Streaming (Live Loop) encerrado."
echo "Os arquivos estão localizados em: ${OUTPUT_DIR}"
echo -e "-------------------------------------------------------------------\n\n"