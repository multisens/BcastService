# Broadcaster Service

![Node Version](https://img.shields.io/badge/Node.js-23.11.1-blueviolet?logo=nodedotjs)  ![MQTT](https://img.shields.io/badge/MQTT-blueviolet?logo=mqtt)

The **Broadcaster Service** project provides an evironment for simulating a TV 3.0 service broadcasting.


# Features

* Distributed implementation of TV 3.0 components in a microservices fashion
   * Broadcaster apps with video streaming
* MQTT-based
   * TV 3.0 transport layer signaling


# Dependencies

* Mosquitto MQTT Broker
* Node JS
* [FFmpeg](https://ffmpeg.org), only to prepare the media beforehand
  (`scripts/ffmpeg-hls.sh`, `scripts/ffmpeg-dash.sh`). The service itself
  serves the HLS segments already in `public/hls/<name>/` and builds the
  playlist on each request (`src/modules/live_stream`); the TV30 image does
  not include FFmpeg


# Environment

Required (server fails on boot if missing):

* `MQTT_HOST` : hostname of the MQTT broker (service name inside Docker)
* `BCAST_HOSTNAME` : hostname advertised in `bcastEntryPackageUrl` (must be the
  Docker service name so AoP can proxy to it via the internal DNS)

Optional (with defaults):

* `PORT` : HTTP server port (default `8081`). In the TV30 compose the
  container port stays 8081, and Docker publishes it on a free host port of
  its choice (`docker compose port bcast 8081` shows which). `BCAST_PUBLISH`
  in the TV30 root `.env` sets what goes in `ports:`; `8081:8081` pins it, as
  the AoP running on the host needs. The AoP in a container reaches bcast at
  `bcast:8081` on the Docker network, regardless of the host port
* `BSID`, `EDUPLAY_SID`, `UFF_SID`, `WEBMEDIA_SID` : fixed service IDs (default
  generated via cuid.slug at each restart, which leaves orphan retained topics;
  the TV30 compose sets all four)
* `USERS_TEST_SID` : service ID of users-test (default
  `urn:tv30:service:users-test`, fixed)
* `EDUPLAY_LOGIC_PORT` : port of the eduplay quiz logic server, used in the
  presenter page URL on the `BCAST_HOSTNAME` host (default `8082`; the TV30
  compose does not start that server)
* `EDUPLAY_APP_ID`, `UFF_APP_ID`, `USERS_TEST_APP_ID`, `WEBMEDIA_APP_ID` : the
  `appId` of each application in its BALD (default `urn:tv30:app:<module>`,
  fixed). The AoP derives the application's own host name from it, so a fixed
  `appId` keeps the host, and what the app stores in the browser, across bcast
  restarts
* `LOG_LEVEL` : `ERROR` | `INFO` | `DEBUG` (default `ERROR`)

See `.env.example` for the full list.


# Broadcaster apps in the AoP graphics layer

The AoP opens each broadcaster app on its own origin, and proxies that host
to the `bcastEntryPackageUrl` of the app (see `aop/src/app-hosts.js` in TV30).
The URL carries the `/graphicsAppProxy` prefix:
`http://<app>.<APPS_DOMAIN>:<AoP port>/graphicsAppProxy<bcastEntryPointUrl>`
(default domain `apps.localhost`), for instance
`http://urn-tv30-app-users-test.apps.localhost:8080/graphicsAppProxy/users-test`.
The AoP strips the prefix before the request reaches bcast. `<app>` is
derived from the fixed `appId` (see Environment). The app's API calls then
carry its own `Origin` (scheme, host and port only), which the AoP registers
in `origins:associated` while the app runs.

Being cross-origin, the AoP cannot dispatch events straight into the app's
document. It sends them by `postMessage`, and `public/js/aop-bridge.js`
re-dispatches them on `document`: `keydown`
(`KeyboardEvent` with `key`), `timeupdate` (`CustomEvent`, `detail` = player
time) and `stream_event` (`CustomEvent`, `detail` = JSON text). **Every app
shown in the graphics layer must include it** (`<script
src="js/aop-bridge.js"></script>`), as `users-test`, `webmedia`, `uff` and
`eduplay` do; otherwise it gets no keys. Root-relative paths (`/js/...`,
`/media/...`) resolve against the app host and are served by bcast.


# Execution

In TV30, bcast runs as the `bcast` container of the root `docker-compose.yml`
(image `tv30-bcast`, `node dist/index.js`). Outside a container:

```$ npm i```

```$ npm run build```

```$ npm run start```

`npm run build` compiles the TypeScript to `dist/` and copies the EJS
templates; `npm run start` runs `node dist/index.js`. For development,
`npm run dev` runs `src/index.ts` with nodemon and ts-node.