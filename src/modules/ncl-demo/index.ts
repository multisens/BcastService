import cuid from 'cuid';
import * as dotenv from 'dotenv';
import { MqttClient } from 'mqtt';
import { ServiceInterface, bam, esg, bald } from '../../types';
dotenv.config();

class nclDemo implements ServiceInterface {
  base_rul!: string;
  sid: string;

  constructor() {
    this.sid = process.env.NCL_DEMO_SID || `urn:tv30:service:${cuid.slug()}`;
  }

  init(base_rul: string): void {
    this.base_rul = base_rul;
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
      appName: 'NCL Demo',
      appIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 293.46 100" fill="#004B9B" role="img" aria-label="NCL">' + 
      '  <title>NCL</title>' +
      '  <path fill-rule="evenodd" d="M142.83 0L217.45 0.75L217.97 1.95L217.98 62.18C217.98 73.04 217.67 65.71 217.98 67.15C218.28 68.59 218.59 69.41 219.81 70.83C221.03 72.24 223.43 74.52 225.31 75.64C227.19 76.76 219.83 77.22 231.07 77.54L292.77 77.54L293.29 78.94L293.29 99.67L255.95 99.66L212.22 99.66C203.99 99.52 208.45 99.44 206.57 98.84C204.7 98.23 202.63 97.52 200.96 96.03C199.28 94.55 197.57 91.95 196.52 89.93C195.47 87.91 194.97 94.87 194.66 83.91L194.66 24.21L193.89 22.82L191.79 22.39L136.8 22.41L132.35 22.41C130.78 23.02 128.8 24.57 127.38 26.1C125.96 27.62 124.7 29.76 123.83 31.54C122.96 33.32 122.59 33.37 122.16 36.78L121.24 51.97L122.11 61.92C122.55 64.49 123.03 65.67 123.88 67.41C124.72 69.16 126.14 71.22 127.16 72.39C128.18 73.56 128.39 73.84 130 74.41C131.6 74.98 134.4 75.57 136.8 75.8C139.2 76.03 135.23 75.8 144.4 75.8L191.79 75.8L192.22 77.36L192.22 97.69L119.52 97.69C106.4 97.69 115.08 97.98 113.5 97.69C111.92 97.4 111.34 96.81 110.03 95.96C108.73 95.1 106.94 93.73 105.67 92.55C104.41 91.37 103.56 90.72 102.44 88.89L98.93 81.55L98.93 24.99L100.61 15.83C101.42 13.34 102.67 11.68 103.81 10.05C104.96 8.41 106.08 7.24 107.48 6C108.87 4.76 110.79 3.44 112.19 2.6C113.59 1.77 110.75 1.43 115.86 0.99L142.83 0ZM78.94 0.49L94.91 0.49L96.26 1.69L96.23 50.92L96.23 77.63C96.03 83.34 95.78 82.83 95.03 85.22C94.29 87.61 93.27 89.9 91.77 91.95L86.03 97.53L80.24 99.17L70.56 97.64L64.27 92.91L58.5 86.27L52.01 76.84L34.47 43.59L24.58 26.57L22.64 25.06L21.52 26.83L21.52 98.57L20.28 99.27L0.19 99.27L0.19 21.85L1.79 13.47C2.58 11.07 3.55 9.28 4.93 7.45C6.31 5.62 8.6 3.59 10.07 2.51C11.54 1.42 12.64 1.22 13.73 0.94C14.83 0.65 15.31 0.84 16.61 0.82C17.92 0.8 19.97 0.57 21.59 0.82C23.2 1.07 24.51 1.3 26.3 2.32C28.09 3.35 30.55 5.34 32.33 6.98C34.1 8.62 34.85 9.39 36.94 12.16L44.89 23.64L52.49 37.27L59.44 51.7L72.13 73.7L73.96 74.58L75.15 73.18L75.14 57.46L75.14 1.69L75.79 0.52L78.94 0.49Z"/>' +
      '</svg>',
      bannerIcon: '',
      appDescription: 'Aplicacao NCL de demonstracao (Ginga-NCL sobre TV30).',
      backgroundColor: '#282828ff',
      foregroundColor: '#c8c8c8ff'
    };
  }

  private esg(): esg {
    return {
      Service : {
        validFrom: '14:10',
        validTo: '16:30',
        globalServiceID: this.sid,
        Name: {
          text: 'NCL Demo',
          lang: 'pt-br'
        },
        Description: {
          text: 'Aplicacao NCL de demonstracao, apresentada pelo motor Ginga-NCL integrado ao TV30.',
          lang: 'pt-br'
        },
        ContentAdvisoryRatings: 'Livre',
        Genre: {
          term: 'Interactive',
          color: '#07812cff'
        }
      }
    };
  }

  private bald(): bald {
    let validFrom = new Date();
    let validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 3);

    return [
      {
        appContextId: `urn:tv30:appcontext:${cuid.slug()}`,
        appId: 'urn:tv30:app:ncl-demo',
        appName: 'NCL Demo',
        appType: 'TV30-Ginga-NCL',
        bcastEntryPackageUrl: `http://${this.base_rul}`,
        bcastEntryPointUrl: '/media/ncl-demo',
        clearAppContextCacheDate: validFrom.toISOString(),
        controlCode: 'AUTOSTART',
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      }
    ];
  }
}

export default new nclDemo();
