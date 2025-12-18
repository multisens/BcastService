import { MqttClient } from 'mqtt/*';
import { Router } from 'express';


export interface ServiceInterface {
  init(port: string): void;
  sendSLS(mqtt: MqttClient): void;
  dispose(mqtt: MqttClient): void;
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


export type playlist = {
  id: string;
  profiles: string;
  type: 'static' | 'dynamic';
  availabilityStartTime?: string;
  publishTime?: string;
  suggestedPresentationDelay?: string;
  maxSegmentDuration?: string;
  BaseURL?: string;
  AdaptationSet: {
    id?: string;
    lang?: string;
    contentType?: 'video' | 'audio' | 'text' | string;
    SupplementalProperty?: string[];
    Representation: {
      id: string;
      SegmentTemplate?: {
        media: string;
        initialization?: string;
      };
    }[];
  }[];
};

export type mpd = playlist[];

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


export type stream_action = {
  seg_start: number,
  seg_end: number,
  action: {
    name: string,
    description: string,
    color: number[]
  }
};

export type stream_events = {
  last_seg: number,
  max_seg: number,
  extinf?: string,
  active: Set<number>,
  actions : stream_action[]
};

export type hlsPlaylist = {
  name: string,
  seg_name: string,
  playlist_size: number,
  target_dur: number,
  segments_dur: string,
  events?: stream_events
}