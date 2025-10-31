import cuid from 'cuid';
import express, { Router, Request, Response } from "express";
import ejs from 'ejs';
import { MqttClient } from 'mqtt/*';
import path from 'path';
import { nanoid } from "nanoid";
import { ServiceInterface, bam, esg, bald } from '../../types';


const HOST_IP = process.env.HOST_IP || "localhost";

class eduplay implements ServiceInterface {
  base_rul!: string;
  router: Router;
  sid: string;

  constructor() {
    this.router = express.Router();
    this.sid = `urn:tv30:service:${cuid.slug()}`;
  }

  init(base_rul: string): void {
    this.base_rul = base_rul;
    this.router.get('/', this.get_root.bind(this));
    this.router.get('/play/:roomId', this.get_mobile.bind(this));
  }

  sendSLS(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, JSON.stringify(this.esg()), { retain : true });
  }

  dispose(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, '', { retain : true });
  }

  bam(): bam {
    return {
        globalServiceId: this.sid,
        appVersion: '1.0',
        appName: 'Eduplay Quiz',
        appIcon: '<svg viewBox="0 0 399.89018 124.72028" style="fill:#000000;stroke:none" preserveAspectRatio="xMidYMid meet">' +
                    '<path d="m 117.5,1.1202799 c -5.7,2.1 -12.1,9.4000001 -13.4,15.4000001 -1.7,8 1.8,18.1 7.5,21.9 l 2.4,1.5 v 41.8 c 0,37.2 0.2,41.9 1.6,42.4 2,0.8 16.8,0.8 18.8,0 1.4,-0.5 1.6,-5.2 1.6,-42.4 v -41.9 l 56.9,31.7 57,31.7 0.6,3.7 c 1.1,6.2 5.6,12.2 11.6,15.2 8.8,4.3 17.6,3 24.4,-3.9 8.9,-8.8 8.7,-21.6 -0.5,-31 l -4,-4.1 -0.2,-41.4 -0.3,-41.50000012 h -10 -10 L 261,42.42028 l -0.5,42.1 -56.9,-31.6 -56.9,-31.7 -1.2,-4.8 c -1.5,-5.9 -3.9,-9.3000001 -9.1,-13.0000001 -5,-3.50000002 -13,-4.40000002 -18.9,-2.3 z"/>'+
                    '<path d="m 0,61.99764 v 61.3 l 5.5,0.6 c 3,0.3 8,0.3 11,0 l 5.5,-0.6 v -22.8 -22.9 h 8.5 8.4 l 3.9,5.3 c 4.9,6.5 13.3,20.6 19.2,31.9 l 4.4,8.6 5.9,0.5 c 3.3,0.3 8.3,0.3 11.2,0 l 5.3,-0.6 -2.1,-4.6 c -3.4,-7.8 -12.6,-24.1 -19.2,-34.2 l -6.3,-9.6 4.2,-1.3 c 10,-3 18.1,-10.1 20.4,-17.8 1.8,-5.9 1.5,-28.8 -0.4,-34.4 -2.1,-6.4 -7.5,-12.2000001 -14,-15.3000001 -9.5,-4.5 -18,-5.50000002 -46,-5.50000002 H 0 Z m 56.6,-40.3 c 6.6,3.3 8.4,6.1 9.1,14.4 0.7,8.9 -0.8,14.6 -4.7,17.9 -4.3,3.6 -8.5,4.5 -24.7,5.2 l -14.3,0.7 v -20.8 -20.8 l 14.9,0.5 c 13.2,0.4 15.4,0.8 19.7,2.9 z"/>' +
                    '<path d="m 313,61.86014 v 61.4 l 4.9,0.7 c 2.7,0.4 7.4,0.4 10.5,0 l 5.6,-0.7 v -21.8 -21.7 l 16.8,-0.6 c 24.1,-0.9 34.7,-4 42.5,-12.6 5.5,-6.1 7,-12.4 6.5,-28.9 -0.3,-11.2 -0.7,-14.5 -2.4,-18.2 -4.1,-9 -12.5,-14.6000001 -26.1,-17.5000001 C 366.4,0.86013988 357.4,0.46013988 338.8,0.46013988 H 313 Z m 49.6,-42.3 c 12.3,2.2 15.4,6.5 15.4,21.1 0,7.3 -0.4,9.9 -1.9,12.4 -3.6,5.9 -12.9,8.4 -31.3,8.4 H 334 v -21.5 -21.5 h 11.3 c 6.2,0 14,0.5 17.3,1.1 z"/>' +
                  '</svg>',
        bannerIcon: '',
        // appDescription: '',
        backgroundColor: '#282828ff',
        foregroundColor: '#c8c8c8ff'
    }
  }

  private async get_root(req:Request, res:Response): Promise<void> {
    const roomId = nanoid(6).toUpperCase();

    const playerUrl = `${req.protocol}://${HOST_IP}:${process.env.PORT || 8081}/eduplay/play/${roomId}`;
    const logicServerUrl = `${req.protocol}://${HOST_IP}:8082`;

    const html = await ejs.renderFile(path.join(__dirname, 'quiz-presenter.ejs'),
      {
        pageTitle: "Eduplay - SetExpo Quiz",
        roomId,
        playerUrl,
        logicServerUrl,
      });
    res.send(html);
  }

  private async get_mobile(req: Request, res: Response): Promise<void> {
    const { roomId } = req.params;
    const logicServerUrl = `${req.protocol}://${req.hostname}:8082`;

    const html = await ejs.renderFile(path.join(__dirname, 'quiz-player.ejs'), 
        {
        pageTitle: "Play - SetExpo Quiz",
        roomId,
        logicServerUrl,
      });
    res.send(html);
  }

  private esg(): esg {
    return {
      Service : {
        validFrom: '14:10',
        validTo: '16:30',
        globalServiceID: this.sid,
        Name: {
          text: 'Sensações do Brasil',
          lang: 'pt-br'
        },
        Description: {
          text: 'Iremos realizar um passeio imersivo pela "Cidade das Flores", em Holambra-SP, com efeitos de luz e aroma. No óculos 360° realizaremos esse passeio com realidade virtual.',
          lang: 'pt-br'
        },
        ContentAdvisoryRatings: '10anos',
        Genre: {
          term: 'Genre A',
          color: '#f75a98ff'
        }
      }
    };
  }
}

export default new eduplay();