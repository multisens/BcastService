import express, { Request, Response } from 'express';
import fs from 'fs';
import logger from '../../logger';
import { MqttClient } from 'mqtt';
import path from 'path';
import { hlsPlaylist } from '../../types';

const router = express.Router();
let current_playlist: hlsPlaylist = {
    name: '',
    seg_name: 'segment',
    playlist_size: 6,
    target_dur: 1,
    segments_dur: '1.001000'
};

let max_seg = 60; // default number of segments to restart
let broker: MqttClient;

export function setBroker(client: MqttClient) {
    broker = client;
}


// http://<host>/live/hls/<playlist_name>.m3u8
router.get('/hls/:file', (req: Request, res: Response) => {
    logger.debug(`[${new Date().toISOString()}] Calling /live/hls/${req.params.file}`);
    let file = req.params.file;

    if (file.endsWith('m3u8')) {
        let p = file.replace('.m3u8', '');
        logger.debug(`... asking for playlist: ${p}`);
        get_playlist(res, p);
    }
    else if (current_playlist !== null && file.endsWith('ts')) {
        logger.debug(`... asking for segment`);
        get_segment(res, file);
    }
    else {
        res.status(404).send(`File not found: ${req.params.file}`);
    }
});

function get_playlist(res: Response, playlist_name: string): void {
    if (current_playlist === null || playlist_name != current_playlist.name) {
        current_playlist.name = playlist_name;

        try {
            const events_path = path.join(__dirname, `../../../public/hls/${playlist_name}/events.json`);
            const data = fs.readFileSync(events_path, 'utf8');
            current_playlist.events = JSON.parse(data);
            current_playlist.events!.active = new Set<number>();
            max_seg = current_playlist.events!.max_seg + 1 - current_playlist.playlist_size;
            if (current_playlist.events!.extinf) {
                current_playlist.segments_dur = current_playlist.events!.extinf;
            }

            logger.debug(`Stream has events file: ${events_path}`);
        } catch (error) {
            logger.error('No events file found for stream');
        }
    }

    // elapsed grows without bound: it feeds a *monotonic* MEDIA-SEQUENCE, which
    // the HLS spec requires. current_segment (the on-disk file index) still wraps
    // back to zero so the video content loops.
    const elapsed = Math.floor(process.uptime());
    const loop_count = Math.floor(elapsed / max_seg);
    const current_segment = elapsed % max_seg; // return to zero after maximum of segments

    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:6\n'; // 6 required for EXT-X-DISCONTINUITY-SEQUENCE
    playlist += `#EXT-X-TARGETDURATION:${current_playlist.target_dur}\n`;
    // MEDIA-SEQUENCE must never go backwards, or VHS loses track of its buffered
    // segments and throws "duration"/"end" of undefined on every loop.
    playlist += `#EXT-X-MEDIA-SEQUENCE:${elapsed}\n`;
    // Number of loop-point discontinuities that already scrolled out of the window.
    playlist += `#EXT-X-DISCONTINUITY-SEQUENCE:${current_segment === 0 ? Math.max(0, loop_count - 1) : loop_count}\n`;
    playlist += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    let last_seg = null;
    for (let i = 0; i < current_playlist.playlist_size; i++) {
        let sn = current_segment + i;
        // At the wrap the timeline restarts from the beginning of the video; tell
        // the player so it resets its timestamp mapping instead of freezing.
        if (i === 0 && current_segment === 0 && loop_count > 0) {
            playlist += '#EXT-X-DISCONTINUITY\n';
        }
        playlist += `#EXTINF:${current_playlist.segments_dur},\n`;
        playlist += `${current_playlist.seg_name}_${sn.toString().padStart(3, '0')}.ts\n`;
        last_seg = sn;
    }

    logger.debug(`returning playlist for segments ${current_segment} to ${last_seg}`);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(playlist);

    if (current_playlist.events) {
        notify_event(current_segment + 3);
    }
}

function notify_event(current_segment: number){
    let sn = current_segment % current_playlist.events!.last_seg;

    for (let i = 0; i < current_playlist.events!.actions.length; i++) {
        const action = current_playlist.events!.actions[i];
        if (sn >= action!.seg_start && sn <= action!.seg_end) {
            if (!current_playlist.events!.active.has(i)) {
                current_playlist.events!.active.add(i);

                logger.info(`video/event -- ${JSON.stringify(action!.action)}`);
                if (broker) {
                    broker.publish('video/event', JSON.stringify(action.action));
                }
            }
        }
        else {
            current_playlist.events!.active.delete(i);
        }
    }
}

function get_segment(res: Response, file: string) {
    const file_path = path.join(__dirname, `../../../public/hls/${current_playlist.name}/${file}`);
    
    logger.debug(`... returning segment ${file}`);

	res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(file_path, (err) => {
        if (err) {
            logger.error('Error sending file:', err);
            res.status(404).send('File not found');
        }
    });
}

export default router;