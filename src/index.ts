import cors from 'cors';
import cuid from 'cuid';
import * as dotenv from 'dotenv';
import express, { Application } from 'express';
import mqtt, { MqttClient } from 'mqtt';
import logger from './logger';
import { ServiceInterface, bamt } from './types';
dotenv.config();

function assertEnv(required: string[]): void {
    const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
    if (missing.length) {
        logger.error(`[boot] missing required env vars: ${missing.join(', ')}`);
        logger.error(`[boot] check docker-compose.yml or .env`);
        process.exit(1);
    }
}
assertEnv(['MQTT_HOST', 'BCAST_HOSTNAME']);


const _PORT:string = process.env.PORT || '8081';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Cache (B.6.3): the origin declares the validity. A live playlist changes
// on every segment (1 s); a media segment is immutable.
app.use(express.static('public', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.m3u8') || filePath.endsWith('.mpd')) {
            res.setHeader('Cache-Control', 'public, max-age=1');
        } else if (/\.(ts|m4s|mp4|aac)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    },
}));
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8081', 'http://127.0.0.1:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
}));

const client:MqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || 'localhost'}`, {
    clientId : 'bcast_svc',
    clean : true,
    connectTimeout : 4000,
    protocolVersion: 5
});

import live_stream, { setBroker } from './modules/live_stream';
app.use('/live', live_stream);
setBroker(client);

import webmedia from './modules/webmedia';
import uff from './modules/uff';
import eduplay from './modules/eduplay';
import usersTest from './modules/users-test';

const services = new Map<string, ServiceInterface>([
  ['webmedia', webmedia],
  ['uff', uff],
  ['eduplay', eduplay],
  ['users-test', usersTest]
]);

const bsid: string = process.env.BSID || cuid.slug();
const bamt: bamt = [];

// In Docker, the AoP reaches bcast by the service name (bcast:8081):
// localhost inside the AoP container is not bcast.
const baseHost: string = process.env.BCAST_HOSTNAME || 'localhost';

services.forEach((mod, key) => {
  mod.init(`${baseHost}:${_PORT}`);
  bamt.push(mod.bam());

  if (mod.router) {
    app.use(`/${key}`, mod.router);
  }
});

app.get('/dispose', (req, res) => {
  clean_topics();
  res.status(200).send();
});

app.listen(_PORT, () => {
  console.log(`App running on port: ${_PORT}`);
});

client.on('connect', () => {
  console.log('MQTT client connected');

  client.publish(`tlm/lls/${bsid}/bamt`, JSON.stringify(bamt), { retain : true });
  services.forEach((mod, _) => {
    mod.sendSLS(client);
  });
});

client.on('disconnect', () => {
  clean_topics();
});

if (process.send) {
  process.send("ready");
}


// With a signal listener node does not exit by itself: without
// process.exit, the container only stops at the docker kill timeout, and the
// retained topics are left orphan.
function shutdown() {
  clean_topics();
  const hardExit = setTimeout(() => process.exit(0), 3000);
  hardExit.unref();
  client.end(false, {}, () => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown);

function clean_topics() {
  client.publish(`tlm/lls/${bsid}/bamt`, '', { retain : true });
  services.forEach((mod, _) => {
    mod.dispose(client);
  });
}