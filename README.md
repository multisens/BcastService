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

* PORT : Port used for broadcaster apps
* BROKER : MQTT broker url


# Execution

Components managed by PM2.
```$ npm i```
```$ npm run build```
```$ npm run start```