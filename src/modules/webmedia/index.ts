import cuid from 'cuid';
import express, { Router, Request, Response } from 'express';
import ejs from 'ejs';
import { MqttClient } from 'mqtt/*';
import path from 'path';
import { ServiceInterface, bam, esg, bald } from '../../types';


class WebMedia implements ServiceInterface {
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
        appName: 'CEFET/RJ TV',
        appIcon: '<svg viewBox="0 0 150 155" style="fill:#003461;fill-opacity:1" preserveAspectRatio="xMidYMid meet">' +
                    '<path d="m 37.45375,154.48381 c -11.82503,-5.72511 -18.40396,-14.80762 -19.18356,-26.48381 -0.41716,-6.24775 0.2709,-8.63439 17.72997,-61.5 9.99018,-30.25 19.08734,-57.5875 20.2159,-60.75 l 2.05192,-5.75 34.40585,0 c 32.20656,0 34.6516,0.12537 38.25046,1.96138 5.00594,2.55384 9.97711,7.58125 11.87405,12.0084 1.61023,3.75802 2.01373,13.09865 0.83223,19.26541 l -0.71564,3.73518 -29.70746,0.26482 -29.70747,0.26481 -20,59.74923 c -11,32.86208 -20.225,59.73315 -20.5,59.71348 -0.275,-0.0197 -2.77081,-1.13517 -5.54625,-2.4789 z m 12.76902,1.26619 c 0.24021,-0.6875 3.09761,-9.0125 6.34977,-18.5 l 5.91303,-17.25 25.25722,0 c 13.89146,0 25.25721,0.29115 25.25721,0.64701 0,1.05285 -6.59236,8.78421 -11.38426,13.35119 -10.20338,9.72444 -22.56833,16.42023 -37.9161,20.53207 -10.31309,2.76299 -14.137,3.10908 -13.47687,1.21973 z m 19.80328,-59.5 c 0.0143,-0.4125 3.12817,-9.3 6.91964,-19.75 l 6.89359,-19 23.16205,0 c 30.43999,0 29.79183,-0.74711 19.72231,22.73322 -3.06786,7.1537 -6.50417,13.60237 -7.84213,14.71673 -2.22185,1.85053 -3.94022,1.98574 -25.63151,2.01678 -12.7875,0.0183 -23.23827,-0.30423 -23.22395,-0.71673 z m -70.02605,-57.82295 c 0,-1.77446 9.89402,-14.98246 14.45339,-19.29452 8.70425,-8.23212 22.57169,-15.87768 33.90722,-18.69412 2.49564,-0.62007 2.78393,-0.47011 2.25961,1.17542 -0.33055,1.03739 -3.23159,9.76117 -6.44676,19.38617 l -5.84577,17.5 -19.16385,0.27159 c -10.54011,0.14938 -19.16384,-0.006 -19.16384,-0.34454 z"/>' +
                '</svg>',
        bannerIcon: '',
        appDescription: 'A TV da imersão',
        backgroundColor: '#282828ff',
        foregroundColor: '#c8c8c8ff',
        initialMediaURLs: [
          `http://${this.base_rul}/media/uff/aquario1080.mp4`
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
          validFrom: '10:00',
          validTo: '18:00',
          globalServiceID: this.sid,
          Name: {
            text: 'Rio Carnaval 2025',
            lang: 'pt-br'
          },
          Description: {
            text: 'Acompanhe a emoção, samba no pé, inovações e muita cultura nos três dias de desfile das escolas de samba do grupo especial do Rio de Janeiro. No VR, uma imersão nas baterias das escolas de samba.',
            lang: 'pt-br'
          },
          ContentAdvisoryRatings: '10anos',
          Genre: {
            term: 'Live',
            color: '#ed6f6fff'
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
        appName: 'WebMedia App',
        // appIcon?: string,
        appType: 'TV30-Ginga-HTML5',
        // bbandEntryPointUrl?: string,
        // bcastEntryPackageUrl: path.join(require.main?.path as string, '../public'),
        bcastEntryPackageUrl: `http://${this.base_rul}`,
        bcastEntryPointUrl: '/webmedia',
        clearAppContextCacheDate: validFrom.toISOString(),
        controlCode: 'AUTOSTART',
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }
    ]
  }
}

export default new WebMedia();