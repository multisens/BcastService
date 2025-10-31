import cuid from 'cuid';
import * as dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import mqtt, { MqttClient } from 'mqtt';
import { ServiceInterface, bamt } from './types';
dotenv.config();


const _PORT:string = process.env.PORT || '8081';

// express middleware configuration
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(function (req: Request, res: Response, next: NextFunction) {
  // allowing local clients to connect to the server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );
  next();
});

// mqtt client configuration
const client:MqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || 'localhost'}`, {
    clientId : 'bcast_svc',
    clean : true,
    connectTimeout : 4000,
    protocolVersion: 5
});


// modules for specific services
import webmedia from './modules/webmedia';
import uff from './modules/uff';
import eduplay from './modules/eduplay';

const services = new Map<string, ServiceInterface>([
  ['webmedia', webmedia],
  ['uff', uff],
  ['eduplay', eduplay]
]);

const bsid: string = cuid.slug();
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