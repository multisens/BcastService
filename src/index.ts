import cors from 'cors';
import cuid from 'cuid';
import * as dotenv from 'dotenv';
import express, { Application } from 'express';
import mqtt, { MqttClient } from 'mqtt';
import logger from './logger';
import { ServiceInterface, bamt } from './types';
dotenv.config();

// Fail-fast: garante que envs obrigatorias estao setadas antes de qualquer
// inicializacao (MQTT, HTTP server). Se faltar alguma, loga claro e termina
// com exit 1.
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

// express middleware configuration
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Cache (B.6.3): a ORIGEM declara a validade dos artefatos e o proxy do AoP
// respeita (a politica antiga de des-cachear playlists no proxy era o
// contrario do que a norma pede). Playlist de live muda a cada segmento ->
// validade de 1s; segmentos de midia sao imutaveis -> cache longo.
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

// mqtt client configuration
const client:MqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || 'localhost'}`, {
    clientId : 'bcast_svc',
    clean : true,
    connectTimeout : 4000,
    protocolVersion: 5
});

// live stream simmulation
import live_stream, { setBroker } from './modules/live_stream';
app.use('/live', live_stream);
setBroker(client);

// modules for specific services
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

// Em Docker, AoP precisa fazer proxy pro bcast via service-name (bcast:8081),
// nao localhost (que dentro do container AoP nao resolve pro bcast).
// BCAST_HOSTNAME=bcast no compose. Fora de container, default localhost.
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

// notify loading is complete
if (process.send) {
  process.send("ready");
}


// for shutting down: limpa os topicos retidos e encerra o processo.
// clean_topics sozinho nao basta como handler — registrar um listener de
// sinal impede o node de encerrar por conta propria, e sem process.exit o
// container ficaria vivo ate o kill-timeout do docker (deixando, na
// pratica, topicos orfaos retidos no broker a cada parada).
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