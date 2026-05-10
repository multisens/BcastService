import cuid from "cuid";
import * as dotenv from "dotenv";
import express, { Router, Request, Response } from "express";
import ejs from "ejs";
import { MqttClient } from "mqtt";
import path from "path";
import { ServiceInterface, bam, esg, bald } from "../../types";
dotenv.config();


class UsersTest implements ServiceInterface {
  base_rul!: string;
  router: Router;
  sid: string;

  constructor() {
    this.router = express.Router();
    this.sid = process.env.USERS_TEST_SID || "urn:tv30:service:users-test";
  }

  init(base_rul: string): void {
    this.base_rul = base_rul;
    this.router.get("/", this.get_root.bind(this));
  }

  sendSLS(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`,  JSON.stringify(this.esg()),  { retain: true });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, JSON.stringify(this.bald()), { retain: true });
  }

  dispose(mqtt: MqttClient): void {
    mqtt.publish(`tlm/sls/${this.sid}/esg`,  "", { retain: true });
    mqtt.publish(`tlm/sls/${this.sid}/bald`, "", { retain: true });
  }

  bam(): bam {
    return {
      globalServiceId: this.sid,
      appVersion: "1.0",
      appName: "Trocar Usuário",
      appIcon:
        '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
          '<rect x="2" y="2" width="96" height="96" rx="14" fill="#4f8ef7"/>' +
          '<circle cx="36" cy="40" r="11" fill="#ffffff"/>' +
          '<circle cx="64" cy="40" r="11" fill="#ffffff"/>' +
          '<path d="M16 78 c0-12 9-19 20-19 c11 0 20 7 20 19 z" fill="#ffffff"/>' +
          '<path d="M44 78 c0-12 9-19 20-19 c11 0 20 7 20 19 z" fill="#ffffff"/>' +
        "</svg>",
      bannerIcon: "",
      appDescription: "Lista usuários e troca o ativo (navegação por teclas)",
      backgroundColor: "#1a1a2eff",
      foregroundColor: "#e2e8f0ff",
    };
  }

  private async get_root(req: Request, res: Response): Promise<void> {
    const html = await ejs.renderFile(path.join(__dirname, "app.ejs"), {});
    res.send(html);
  }

  private esg(): esg {
    return {
      Service: {
        validFrom: "00:00",
        validTo:   "23:59",
        globalServiceID: this.sid,
        Name:        { text: "Trocar Usuário",                                            lang: "pt-br" },
        Description: { text: "Lista usuários do serviço atual e permite trocar o ativo.", lang: "pt-br" },
        ContentAdvisoryRatings: "Livre",
        Genre: { term: "Test", color: "#4f8ef7ff" },
      },
    };
  }

  private bald(): bald {
    const validFrom  = new Date();
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 12);

    return [
      {
        appContextId: `urn:tv30:appcontext:${cuid.slug()}`,
        appId:        `urn:tv30:app:${cuid.slug()}`,
        appName:      "Trocar Usuário",
        appType:      "TV30-Ginga-HTML5",
        bcastEntryPackageUrl: `http://${this.base_rul}`,
        bcastEntryPointUrl:   "/users-test",
        clearAppContextCacheDate: validFrom.toISOString(),
        controlCode: "AUTOSTART",
        validFrom:   validFrom.toISOString(),
        validUntil:  validUntil.toISOString(),
      },
    ];
  }
}

export default new UsersTest();
