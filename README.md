# Broadcaster Service

![Node Version](https://img.shields.io/badge/Node.js-23.11.0-blueviolet?logo=nodedotjs)  ![MQTT](https://img.shields.io/badge/MQTT-blueviolet?logo=mqtt)

The **Broadcaster Service** project provides an evironment for simulating a TV 3.0 service broadcasting.


# Features

* Distributed implementation of TV 3.0 components in a microservices fashion
   * Broadcaster apps with video streaming
* MQTT-based
   * TV 3.0 transport layer signaling


# Dependencies

* Mosquitto MQTT Broker
* Node JS
* [FFmpeg](https://ffmpeg.org)


# Environment

Required (server fails on boot if missing):

* `MQTT_HOST` : hostname of the MQTT broker (service name inside Docker)
* `BCAST_HOSTNAME` : hostname advertised in `bcastEntryPackageUrl` (must be the
  Docker service name so AoP can proxy to it via the internal DNS)

Optional (with defaults):

* `PORT` : HTTP server port (default `8081`)
* `BSID`, `EDUPLAY_SID`, `UFF_SID`, `WEBMEDIA_SID` : fixed service IDs (default
  generated via cuid.slug at each restart, which leaves orphan retained topics)
* `LOG_LEVEL` : `ERROR` | `INFO` | `DEBUG` (default `ERROR`)

See `.env.example` for the full list.


# Execution

Components managed by PM2.

```$ npm i```

```$ npm run build```

```$ npm run start```