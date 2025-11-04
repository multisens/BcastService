import cuid from 'cuid';
import express, { Router, Request, Response } from 'express';
import ejs from 'ejs';
import { MqttClient } from 'mqtt';
import path from 'path';
import { ServiceInterface, bam, esg, bald } from '../../types';


class UFF implements ServiceInterface {
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
  }

  sendSLS(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, JSON.stringify(this.esg()), { retain : true });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, JSON.stringify(this.bald()), { retain : true });
  }

  dispose(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, '', { retain : true });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, '', { retain : true });
  }

  bam(): bam {
    return {
        globalServiceId: this.sid,
        appVersion: '1.0',
        appName: 'UFF TV',
        appIcon: '<svg viewBox="0 0 180 95" style="fill:#003461;fill-opacity:1;fill-rule:evenodd;stroke:none" preserveAspectRatio="xMidYMid meet">' +
                    '<path d="m 101.375,0 c -12.408054,0 -22.5,10.091948 -22.5,22.5 l 0,0.53125 0,15.09375 -23.0625,0 0,32.5625 -0.03125,0.5 c -0.246865,3.707996 -3.22521,6.625 -6.84375,6.625 -3.618034,0 -6.564884,-2.914791 -6.8125,-6.625 l -0.03125,-0.5 0,-32.5625 -38.15625,0 0,16.03125 22.0625,0 0,16.53125 0,0.53125 c 0,12.664481 10.272113,22.968749 22.9375,22.96875 12.665385,0 22.968753,-10.303368 22.96875,-22.96875 l 0,-0.53125 0,-16.53125 6.96875,0 0,40.03125 15.34375,0 0,-40.03125 29.625,0 0,40.03125 15.34375,0 0,-40.03125 44.65625,0 0,-16.03125 -44.65625,0 0,-15.09375 0.0312,0 0.0312,-0.5 c 0.25591,-3.745927 3.30223,-6.6875 7.0625,-6.6875 3.76026,0 6.83802,2.944279 7.09375,6.6875 l 0.0312,0.5 0,9.125 15.375,0 0,-9.125 0,-0.53125 c 0,-12.408052 -10.09194,-22.5 -22.5,-22.5 -12.40806,0 -22.46875,10.09285 -22.46875,22.5 0,-12.40715 -10.0607,-22.5 -22.46875,-22.5 z m 0,15.84375 c 3.76847,0 6.81584,2.932396 7.0625,6.6875 l 0.0312,0.5 0,9.125 15.375,0 0,5.96875 -29.625,0 0,-15.09375 0.03125,0 0.03125,-0.5 c 0.245979,-3.752902 3.324834,-6.6875 7.09375,-6.6875 z"/>' +
                 '</svg>',
        bannerIcon: '',
        appDescription: 'A TV multisensorial',
        backgroundColor: '#282828ff',
        foregroundColor: '#c8c8c8ff',
        initialMediaURLs: [
          `http://${this.base_rul}/live/hls/aquario.m3u8`
        ]
      }
  }

  private async get_root(req:Request, res:Response): Promise<void> {
    const html = await ejs.renderFile(path.join(__dirname, 'app.ejs'),
      {
        //params
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
            text: 'Experiência Multissensorial',
            lang: 'pt-br'
          },
          Description: {
            text: 'Uma apresentação imersiva com efeitos sensoriais de luz e aroma! Somente na TV UFF!',
            lang: 'pt-br'
          },
          ContentAdvisoryRatings: 'Livre',
          Genre: {
            term: 'Nature',
            color: '#07812cff'
          }
        }
      };
  }

  private bald(): bald{
    let validFrom = new Date();
    let validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 3);

    return [
      {
        appContextId: `urn:tv30:appcontext:${cuid.slug()}`,
        appId: `urn:tv30:app:${cuid.slug()}`,
        appName: 'UFF App',
        appType: 'TV30-Ginga-HTML5',
        bcastEntryPackageUrl: `http://${this.base_rul}`,
        bcastEntryPointUrl: '/uff',
        clearAppContextCacheDate: validFrom.toISOString(),
        controlCode: 'AUTOSTART',
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }
    ]
  }
}

export default new UFF();