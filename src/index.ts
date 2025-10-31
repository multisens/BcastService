import cuid from 'cuid';
import * as dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import mqtt, { MqttClient } from 'mqtt';
import { ServiceInterface, bamt, mpd, playlist } from './types';
dotenv.config();


const _PORT:string = process.env.PORT || '8081';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(function (req: Request, res: Response, next: NextFunction) {
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

app.use(express.static('public')); 

const client:MqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || 'localhost'}`, {
    clientId : 'bcast_svc',
    clean : true,
    connectTimeout : 4000,
    protocolVersion: 5
});


import webmedia from './modules/webmedia';

const services = new Map<string, ServiceInterface>([
  ['webmedia', webmedia]
]);

const bsid: string = cuid.slug();
const bamt: bamt = [];
// const mpd: playlist = {
//   id: 'mpd001',
//   profiles: 'urn:mpeg:dash:profile:isoff-main:2011',
//   type: 'dynamic',
//   availabilityStartTime: new Date().toISOString(),
//   publishTime: new Date().toISOString(),
//   suggestedPresentationDelay: 'PT2S',
//   maxSegmentDuration: 'PT6S',
//   BaseURL: 'http://localhost:8081/dash/',
//   AdaptationSet: [
//     {
//       id: 'video1',
//       contentType: 'video',
//       SupplementalProperty: ['HD'],
//       Representation: [
//         {
//           id: '1080p',
//           SegmentTemplate: {
//             media: 'segment_$Number$.m4s',
//             initialization: 'init.mp4'
//           }
//         }
//       ]
//     }
//   ]
// };
const m3u8 = {
  BaseURL: 'http://localhost:8081/hls/',
};


services.forEach((mod, key) => {
  mod.init(`localhost:${_PORT}`, client);
  bamt.push(mod.bam());

  if (mod.router) {
    app.use(`/${key}`, mod.router);
  }
});

client.publish(`tlm/lls/${bsid}/bamt`, JSON.stringify(bamt), { retain : true });
// client.publish(`slt/sls/${bsid}/mpd`, JSON.stringify(mpd), { retain: true });
client.publish(`slt/sls/${bsid}/m3u8`, JSON.stringify(m3u8), { retain: true });


app.listen(_PORT, () => {
  console.log(`App running on port: ${_PORT}`);
});

if (process.send) {
  process.send("ready");
}


process.on('SIGTERM', clean_topics);
process.on('SIGINT', clean_topics);
process.on('SIGUSR2', clean_topics);

function clean_topics() {
  client.publish(`tlm/lls/${bsid}/bamt`, '', { retain : true });
  services.forEach((mod, _) => {
    mod.dispose();
  });
}