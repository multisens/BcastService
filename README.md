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
* `EDUPLAY_APP_ID`, `UFF_APP_ID`, `USERS_TEST_APP_ID`, `WEBMEDIA_APP_ID` : the
  `appId` of each application in its BALD (default `urn:tv30:app:<module>`,
  fixed; decision by Luis on 2026-10-11). The AoP derives the application's own
  host name from it (P1.3), so a fixed `appId` keeps the host, and what the app
  stores in the browser, across bcast restarts
* `LOG_LEVEL` : `ERROR` | `INFO` | `DEBUG` (default `ERROR`)

See `.env.example` for the full list.


# Broadcaster apps in the AoP graphics layer

Since P1.3 (decided by Luis on 10/10), the AoP opens each broadcaster app on
its own origin, and proxies that host to the `bcastEntryPackageUrl` of the
app (see `aop/src/app-hosts.js` in TV30). Since 2026-10-11 (decision by
Luis) the URL keeps the prefix of the old path:
`http://<app>.<APPS_DOMAIN>:<AoP port>/graphicsAppProxy<bcastEntryPointUrl>`
(default domain `apps.localhost`), for instance
`http://urn-tv30-app-users-test.apps.localhost:8080/graphicsAppProxy/users-test`.
The AoP strips the prefix before the request reaches bcast. `<app>` is
derived from the fixed `appId` (see Environment). The app's API calls then
carry its own `Origin` (scheme, host and port only), which the AoP registers
in `origins:associated` while the app runs.

Being cross-origin, the AoP can no longer dispatch events straight into the
app's document. It sends them by `postMessage`, and `public/js/aop-bridge.js`
re-dispatches them on `document` in the same shape as before: `keydown`
(`KeyboardEvent` with `key`), `timeupdate` (`CustomEvent`, `detail` = player
time) and `stream_event` (`CustomEvent`, `detail` = JSON text). **Every app
shown in the graphics layer must include it** (`<script
src="js/aop-bridge.js"></script>`), as `users-test`, `webmedia`, `uff` and
`eduplay` do; otherwise it gets no keys. Root-relative paths (`/js/...`,
`/media/...`) resolve against the app host and are served by bcast.


# Execution

Components managed by PM2.

```$ npm i```

```$ npm run build```

```$ npm run start```