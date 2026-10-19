import express, { Request, Response } from 'express';
import fs from 'fs';
import logger from '../../logger';
import { MqttClient } from 'mqtt';
import path from 'path';
import { hlsPlaylist } from '../../types';
import cors from 'cors';

const router = express.Router();

router.use(cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
}));

let current_playlist: hlsPlaylist = {
    name: '',
    seg_name: 'segment',
    playlist_size: 6,
    target_dur: 1,
    segments_dur: '1.001000'
};

let max_seg = 60; // default number of segments to restart
let broker: MqttClient;

// Define diretório dos chunks DASH
const dashDir = path.join(__dirname, '../../../public/dash');
const fallbackDir = path.join(__dirname, '../../../dash');
const targetDir = fs.existsSync(dashDir) ? dashDir : fallbackDir;

let ultimoChunkDisponivel = 0;

function verificarChunks() {
    if (!fs.existsSync(targetDir)) return;

    try {
        const files = fs.readdirSync(targetDir);
        let maiorChunk = 0;

        for (const file of files) {
            if (!file.endsWith('.m4s')) continue;

            const match = file.match(/\d+/g);
            if (!match) continue;

            const chunk = parseInt(match[match.length - 1], 10);
            if (chunk > maiorChunk) {
                maiorChunk = chunk;
            }
        }

        if (maiorChunk !== ultimoChunkDisponivel) {
            ultimoChunkDisponivel = maiorChunk;
            logger.info(`Novo chunk disponível: ${ultimoChunkDisponivel}`);
        }
    } catch (error) {
        logger.error('Erro ao verificar diretório de chunks:', error);
    }
}

// Inicializa a verificação e monitora a pasta
verificarChunks();

if (fs.existsSync(targetDir)) {
    fs.watch(targetDir, (eventType, filename) => {
        if (!filename || !filename.endsWith('.m4s')) return;
        verificarChunks();
    });
    logger.info(`Monitorando chunks em: ${targetDir}`);
}

export function setBroker(client: MqttClient) {
    broker = client;
}

function resolveDashFilePath(file: string): string {
    const publicPath = path.join(__dirname, '../../../public/dash', file);
    if (fs.existsSync(publicPath)) {
        return publicPath;
    }
    return path.join(__dirname, '../../../dash', file);
}

// Injeta o EventStream com todos os eventos do events.json diretamente no XML do MPD
function generateMPDWithEvents(file_path: string): string {
    let mpdContent = fs.readFileSync(file_path, 'utf8');
    const events_path = path.join(__dirname, 'events.json');

    if (!fs.existsSync(events_path)) {
        return mpdContent;
    }

    try {
        const eventsData = JSON.parse(fs.readFileSync(events_path, 'utf8'));
        const timescale = 1000;
        const segmentDuration = 1;

        const maxSeg = eventsData.last_seg || 60;
        const lastSeg = eventsData.last_seg;
        let eventStreamXml = `  <EventStream schemeIdUri="urn:mpeg:dash:event:2012" timescale="${timescale}" maxSegment="${maxSeg}"> lastSegment="${lastSeg}"\n`;

        eventsData.actions.forEach((act: any, index: number) => {
            const presentationTime = act.seg_start * segmentDuration * timescale;
            const duration = (act.seg_end - act.seg_start) * segmentDuration * timescale;
            
            const payloadObject = {
                seg_start: act.seg_start,
                seg_end: act.seg_end,
                action: act.action
            };
            const payload = JSON.stringify(payloadObject);

            eventStreamXml += `    <Event presentationTime="${presentationTime}" duration="${duration}" id="${index + 1}" segStart="${act.seg_start}" segEnd="${act.seg_end}">\n`;
            eventStreamXml += `      ${payload}\n`;
            eventStreamXml += `    </Event>\n`;
        });

        eventStreamXml += `  </EventStream>`;

        mpdContent = mpdContent.replace(/<EventStream[\s\S]*?<\/EventStream>/g, '');
        return mpdContent.replace(/<Period([^>]*)>/, `<Period$1>\n${eventStreamXml}`);
    } catch (error) {
        logger.error('Erro ao injetar EventStream no MPD:', error);
        return mpdContent;
    }
}


// Retorna o último chunk identificado no disco
router.get('/dash/current-chunk', (req: Request, res: Response): void => {
    res.setHeader('Cache-Control', 'no-store');

    const dashDir = path.join(__dirname, '../../../public/dash');
    const fallbackDir = path.join(__dirname, '../../../dash');
    const targetDir = fs.existsSync(dashDir) ? dashDir : fallbackDir;

    try {
        if (!fs.existsSync(targetDir)) {
            res.json({ chunk: 0 });
            return;
        }

        const files = fs.readdirSync(targetDir);

        let ultimoChunk = 0;
        let ultimaModificacao = 0;

        for (const file of files) {
            if (!file.endsWith('.m4s')) continue;

            const match = file.match(/(\d+)\.m4s$/);
            if (!match) continue;

            const filePath = path.join(targetDir, file);
            const stats = fs.statSync(filePath);

            if (stats.mtimeMs > ultimaModificacao) {
                ultimaModificacao = stats.mtimeMs;
                ultimoChunk = Number(match[1]);
            }
        }

        res.json({ chunk: ultimoChunk });
        return;

    } catch (error) {
        logger.error('Erro ao verificar chunks:', error);

        res.status(500).json({ chunk: 0 });
        return;
    }
});


// http://<host>/live/dash/<playlist_name>.mpd
router.get('/dash/:file', (req: Request, res: Response) => {
    const file = req.params.file;
    logger.debug(`[${new Date().toISOString()}] Calling /live/dash/${file}`);

    const file_path = resolveDashFilePath(file);

    if (file.endsWith('.mpd')) {
        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (!fs.existsSync(file_path)) {
            res.status(404).send('File not found');
            return;
        }

        const annotatedMpd = generateMPDWithEvents(file_path);
        res.send(annotatedMpd);
        return;
    }

    if (file === 'events.json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.sendFile(file_path, (err) => {
            if (err && !res.headersSent) res.status(404).send('File not found');
        });
        return;
    }

    if (file.endsWith('.m4s')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Cache-Control', 'no-cache');

        res.sendFile(file_path, (err) => {
            if (err && !res.headersSent) res.status(404).send('File not found');
        });
        return;
    }

    res.status(404).send(`File not found: ${file}`);
});

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