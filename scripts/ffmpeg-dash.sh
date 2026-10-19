#!/bin/bash

INPUT_FILE="../public/counter.mp4"
OUTPUT_DIR="../public/dash"
MPD_NAME="playlist_1080p.mpd"

mkdir -p "$OUTPUT_DIR"

rm -f "$OUTPUT_DIR"/*

ffmpeg \
-re \
-stream_loop -1 \
-i "$INPUT_FILE" \
-map 0:v:0 \
-vf scale=1280:720 \
-c:v libx264 \
-preset ultrafast \
-tune zerolatency \
-g 48 \
-keyint_min 48 \
-sc_threshold 0 \
-seg_duration 2 \
-window_size 5 \
-extra_window_size 20 \
-use_template 1 \
-use_timeline 1 \
-adaptation_sets "id=0,streams=v" \
-f dash \
"$OUTPUT_DIR/$MPD_NAME"
#!/bin/bash
