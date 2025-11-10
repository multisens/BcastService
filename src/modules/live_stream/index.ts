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
// let max_seg = 4284 - current_playlist.playlist_size;
let max_seg = 3120;
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

            logger.debug(`Stream has events file: ${events_path}`);
        } catch (error) {
            logger.error('No events file found for stream');
        }
    }

    const current_segment = Math.floor(process.uptime() % max_seg); // return to zero after maximum of segments

    let playlist = '#EXTM3U\n';
    playlist += `#EXT-X-VERSION:${current_playlist.playlist_size}\n`;
    playlist += `#EXT-X-TARGETDURATION:${current_playlist.target_dur}\n`;
    playlist += `#EXT-X-MEDIA-SEQUENCE:${current_segment}\n`;
    playlist += '#EXT-X-INDEPENDENT-SEGMENTS\n';
    let last_seg = null;
    for (let i = 0; i < current_playlist.playlist_size; i++) {
        let sn = current_segment + i;
        playlist += `#EXTINF:${current_playlist.segments_dur},\n`;
        playlist += `${current_playlist.seg_name}_${sn.toString().padStart(3, '0')}.ts\n`;
        last_seg = sn;
    }

    logger.debug(`returning playlist for segments ${current_segment} to ${last_seg}`);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(playlist);

    if (current_playlist.events) {
        notify_event(current_segment);
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