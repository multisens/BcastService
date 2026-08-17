import cuid from "cuid";
import * as dotenv from 'dotenv';
import express, { Router, Request, Response } from "express";
import ejs from "ejs";
import { MqttClient } from "mqtt";
import path from "path";
import { ServiceInterface, bam, esg, bald } from "../../types";
dotenv.config();


class usp3 implements ServiceInterface {
  base_rul!: string;
  router: Router;
  sid: string;

  constructor() {
    this.router = express.Router();
    this.sid = process.env.USP3_SID || `urn:tv30:service:${cuid.slug()}`;
  }

  init(base_rul: string): void {
    this.base_rul = base_rul;
    this.router.get("/", this.get_root.bind(this));

  }

  sendSLS(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, JSON.stringify(this.esg()), {
      retain: true,
    });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, JSON.stringify(this.bald()), {
      retain: true,
    });
  }

  dispose(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`, "", { retain: true });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, "", { retain: true });
  }

  bam(): bam {
    return {
      globalServiceId: this.sid,
      appVersion: "1.0",
      appName: "USP - Programa 3",
      appIcon:
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="600.000000pt" height="338.000000pt" viewBox="0 0 600.000000 338.000000" preserveAspectRatio="xMidYMid meet">'+
          '<g transform="translate(0.000000,338.000000) scale(0.050000,-0.050000)" fill="#000000" stroke="none">'+
              '<path d="M85 3895 l6 -1965 56 -156 c140 -382 429 -644 822 -744 144 -36 2227 -45 2412 -10 237 45 520 222 680 423 l76 97 83 -105 c151 -189 386 -339 633 -403 164 -43 2083 -47 2278 -5 190 41 399 161 559 322 274 275 330 460 329 1079 l-1 422 -988 1000 -989 1000 -110 -109 c-61 -60 -111 -119 -110 -130 1 -12 424 -444 941 -961 l940 -940 -6 -380 c-9 -538 -117 -749 -473 -925 l-151 -75 -991 -6 c-689 -5 -1028 1 -1111 17 -336 64 -589 327 -655 678 l-22 121 -156 0 c-174 0 -161 12 -185 -168 -36 -270 -300 -544 -599 -624 -160 -43 -2158 -40 -2322 3 -248 64 -432 215 -545 445 l-56 114 -5 1815 -6 1815 811 0 810 0 0 -1700 0 -1700 160 0 160 0 0 1700 0 1700 805 5 805 5 6 155 6 155 -1952 0 -1951 0 6 -1965z"/>'+
              '<path d="M4688 5830 c-306 -66 -592 -289 -740 -578 -107 -206 -127 -339 -128 -822 l0 -420 985 -985 c542 -542 994 -985 1006 -985 11 0 65 45 119 100 l98 99 -328 336 c-181 184 -606 614 -945 955 l-617 620 7 390 c10 548 117 759 470 926 l135 64 1170 0 1170 0 135 -64 c247 -117 408 -329 460 -605 l22 -121 156 0 c174 0 158 -14 187 170 34 215 260 483 484 573 l116 47 1160 0 1160 0 134 -64 c447 -211 486 -338 486 -1586 l0 -930 -805 -5 c-443 -3 -805 1 -805 10 0 8 -2 411 -5 895 l-5 880 -160 0 -160 0 -5 -1705 -5 -1705 -810 0 -810 0 0 -160 0 -160 970 0 c534 0 971 7 973 15 10 61 13 224 15 870 l2 735 971 0 971 0 -6 1155 c-7 1131 -8 1158 -51 1285 -127 371 -393 638 -749 750 l-158 50 -1124 0 c-1443 -1 -1463 -5 -1810 -356 l-166 -167 -42 56 c-148 196 -414 376 -647 436 -161 42 -2289 43 -2481 1z"/>'+
        "</g>" +
        "</svg>",
      bannerIcon: "",
      appDescription: "A TV da USP",
      backgroundColor: "#282828ff",
      foregroundColor: "#c8c8c8ff",
      initialMediaURLs: [`http://${this.base_rul}/live/hls/usp3.m3u8`],
    };
  }

  private async get_root(req: Request, res: Response): Promise<void> {
    const html = await ejs.renderFile(path.join(__dirname, "app.ejs"), {
      //params
    });
    res.send(html);
  }


  private esg(): esg {
    return {
      Service: {
        validFrom: "10:00",
        validTo: "18:00",
        globalServiceID: this.sid,
        Name: {
          text: "Serra da Capivara",
          lang: "pt-br",
        },
        Description: {
          text: "Na caatinga brasileira, a Serra da Capivara, relicário da arqueologia mundial, guarda, em seus mais de 1.200 sítios arqueológicos, memórias e vestígios que desafiam teorias sobre as primeiras ocupações humanas no continente.",
          lang: "pt-br",
        },
        ContentAdvisoryRatings: "Livre",
        Genre: {
          term: "Live",
          color: "#ed6f6fff",
        },
      },
    };
  }

  private bald(): bald {
    let validFrom = new Date();
    let validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 3);

    return [
      {
        appContextId: `urn:tv30:appcontext:${cuid.slug()}`,
        appId: `urn:tv30:app:${cuid.slug()}`,
        appName: "USP App 3",
        // appIcon?: string,
        appType: "TV30-Ginga-HTML5",
        // bbandEntryPointUrl?: string,
        // bcastEntryPackageUrl: path.join(require.main?.path as string, '../public'),
        bcastEntryPackageUrl: `http://${this.base_rul}`,
        bcastEntryPointUrl: "/usp3",
        clearAppContextCacheDate: validFrom.toISOString(),
        controlCode: "AUTOSTART",
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      },
    ];
  }
}

export default new usp3();
