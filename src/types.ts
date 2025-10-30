import { MqttClient } from 'mqtt/*';
import { Router } from 'express';


export interface ServiceInterface {
  init(port: string, mqtt: MqttClient): void;
  dispose(): void;
  bam(): bam;
  router?: Router;
}


export type bam = {
  globalServiceId: string,
  appVersion: string,
  appName: string,
  appIcon: string,
  bannerIcon: string,
  appDescription?: string,
  backgroundColor: string,
  foregroundColor: string,
  initialMediaURLs?: string[]
};

export type bamt = bam[];


type esg_service = {
  validFrom: string,
  validTo: string,
  globalServiceID: string,
  Name: {
    text: string,
    lang: string
  },
  Description: {
    text: string,
    lang: string
  },
  ContentAdvisoryRatings: string,
  Genre: {
    term: string,
    color: string
  }
};

export type esg = {
  Service: esg_service
};


export type entryPackage = {
  appContextId: string,
  appId: string,
  appName: string,
  appIcon?: string,
  appType: 'TV30-Ginga-HTML5' | 'TV30-Ginga-NCL',
  bbandEntryPointUrl?: string,
  bcastEntryPackageUrl?: string,
  bcastEntryPointUrl?: string,
  clearAppContextCacheDate?: string,
  controlCode?: 'AUTOSTART' | 'PRESENT' | 'STORED_AUTOSTART' | 'STORED_PRESENT' | 'DESTROY' | 'KILL' | 'STORED_REMOVE',
  validFrom?: string,
  validUntil?: string,
}

export type bald = entryPackage[];