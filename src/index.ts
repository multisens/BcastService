import cors from 'cors';
import cuid from 'cuid';
import * as dotenv from 'dotenv';
import express, { Application } from 'express';
import mqtt, { MqttClient } from 'mqtt';
import { ServiceInterface, bamt } from './types';
dotenv.config();


const _PORT:string = process.env.PORT || '8081';

// express middleware configuration
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
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

const services = new Map<string, ServiceInterface>([
  ['webmedia', webmedia],
  ['uff', uff],
  ['eduplay', eduplay]
]);

const bsid: string = process.env.BSID || cuid.slug();
const bamt: bamt = [];

services.forEach((mod, key) => {
  mod.init(`localhost:${_PORT}`);
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


// for shutting down
// process.on('SIGTERM', clean_topics);
// process.on('SIGINT', clean_topics);
// process.on('SIGUSR2', clean_topics);

function clean_topics() {
  client.publish(`tlm/lls/${bsid}/bamt`, '', { retain : true });
  services.forEach((mod, _) => {
    mod.dispose(client);
  });
}