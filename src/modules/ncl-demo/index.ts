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
      appIcon: '',
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
