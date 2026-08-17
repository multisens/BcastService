<?xml version="1.0" encoding="UTF-8"?>
<!--
  Guided-recipe demo: a video cut into steps, driven hands-free by hand poses.

    POINTING_UP -> next step        VICTORY -> previous step
    OPEN_PALM   -> pause            THUMBS_UP -> play (resume)

  Left alone, the steps chain themselves: a step reaches its natural end and the
  next one starts, looping 4 -> 1 forever. Advancing by gesture rides the SAME
  path: POINTING_UP just STOPS the current step, and a step ending (naturally
  or by that stop) is what starts the next (onEndAdvance). One advance rule,
  fed by both.

  Going back cannot use stop. In this engine a natural end and a commanded stop
  are the same `stops` transition, so a stop always fires onEndAdvance and would
  jump FORWARD. VICTORY therefore ABORTS the current step (aborts != stops, so no
  advance fires) and starts the previous one explicitly. That is also the honest
  model: "back" cancels the step before it completes, which is what abort means.

  Consequence the layout relies on: at every instant exactly one step is
  Occurring (or Paused). The playing step is never Sleeping, so gesture routing
  (the engine gates recognitions on presentation) always reaches it.

  ADD OR REMOVE A STEP (keep them contiguous step1..stepN, loop wraps N -> 1):
    1. drop stepN.mp4 in media/ and add the <media> stepN
    2. add its next(stop) / prev(abort+start) / pause / resume / onEnd links
    3. fix the wrap links on the old first/last step
-->
<ncl id="cookApp" xmlns="http://www.ncl.org.br/NCL4.0/MainDTVProfile">
    <head>
        <regionBase>
            <region id="videoRegion" left="0%" top="0%" width="100%" height="100%" zIndex="1" />
            <region id="logoRegion" left="2%" top="3%" width="160" height="80" zIndex="3" />
            <region id="legendRegion" left="78%" top="62%" width="285" height="256" zIndex="4" />
        </regionBase>

        <descriptorBase>
            <descriptor id="descVideo" region="videoRegion" />
            <descriptor id="descLogo" region="logoRegion" />
            <descriptor id="descLegend" region="legendRegion" />
        </descriptorBase>

        <connectorBase>
            <causalConnector id="onGestureNext">
                <simpleCondition role="onHandPoseRecognition" key="POINTING_UP" />
                <simpleAction role="stop" />
            </causalConnector>
            <causalConnector id="onGesturePrev">
                <simpleCondition role="onHandPoseRecognition" key="VICTORY" />
                <compoundAction operator="par">
                    <simpleAction role="abort" />
                    <simpleAction role="start" />
                </compoundAction>
            </causalConnector>

            <causalConnector id="onPalmPause">
                <simpleCondition role="onHandPoseRecognition" key="OPEN_PALM" />
                <simpleAction role="pause" />
            </causalConnector>
            <causalConnector id="onThumbPlay">
                <simpleCondition role="onHandPoseRecognition" key="THUMBS_UP" />
                <simpleAction role="resume" />
            </causalConnector>

            <causalConnector id="onEndAdvance">
                <simpleCondition role="onEnd" />
                <simpleAction role="start" />
            </causalConnector>
        </connectorBase>
    </head>

    <body>
        <port id="pStep" component="step1" />
        <port id="pLegend" component="legend" />
        <port id="pLogo" component="logo" />

        <media id="step1" src="media/step1.mp4" descriptor="descVideo" />
        <media id="step2" src="media/step2.mp4" descriptor="descVideo" />
        <media id="step3" src="media/step3.mp4" descriptor="descVideo" />
        <media id="step4" src="media/step4.mp4" descriptor="descVideo" />

        <media id="legend" src="media/legend-open.svg" descriptor="descLegend" />
        <media id="logo" src="media/logo.png" descriptor="descLogo" />

        <!-- Auto-advance / loop: a step's natural end (or a next-gesture stop)
             starts the following step; step4 wraps back to step1. -->
        <link xconnector="onEndAdvance">
            <bind role="onEnd" component="step1" />
            <bind role="start" component="step2" />
        </link>
        <link xconnector="onEndAdvance">
            <bind role="onEnd" component="step2" />
            <bind role="start" component="step3" />
        </link>
        <link xconnector="onEndAdvance">
            <bind role="onEnd" component="step3" />
            <bind role="start" component="step4" />
        </link>
        <link xconnector="onEndAdvance">
            <bind role="onEnd" component="step4" />
            <bind role="start" component="step1" />
        </link>

        <!-- POINTING_UP -> next: stop the current step; onEndAdvance does the rest. -->
        <link xconnector="onGestureNext">
            <bind role="onHandPoseRecognition" component="step1" />
            <bind role="stop" component="step1" />
        </link>
        <link xconnector="onGestureNext">
            <bind role="onHandPoseRecognition" component="step2" />
            <bind role="stop" component="step2" />
        </link>
        <link xconnector="onGestureNext">
            <bind role="onHandPoseRecognition" component="step3" />
            <bind role="stop" component="step3" />
        </link>
        <link xconnector="onGestureNext">
            <bind role="onHandPoseRecognition" component="step4" />
            <bind role="stop" component="step4" />
        </link>

        <!-- VICTORY -> prev: abort the current step (no advance) + start the previous;
             step1 wraps back to step4. -->
        <link xconnector="onGesturePrev">
            <bind role="onHandPoseRecognition" component="step1" />
            <bind role="abort" component="step1" />
            <bind role="start" component="step4" />
        </link>
        <link xconnector="onGesturePrev">
            <bind role="onHandPoseRecognition" component="step2" />
            <bind role="abort" component="step2" />
            <bind role="start" component="step1" />
        </link>
        <link xconnector="onGesturePrev">
            <bind role="onHandPoseRecognition" component="step3" />
            <bind role="abort" component="step3" />
            <bind role="start" component="step2" />
        </link>
        <link xconnector="onGesturePrev">
            <bind role="onHandPoseRecognition" component="step4" />
            <bind role="abort" component="step4" />
            <bind role="start" component="step3" />
        </link>

        <!-- OPEN_PALM -> pause the current step. -->
        <link xconnector="onPalmPause">
            <bind role="onHandPoseRecognition" component="step1" />
            <bind role="pause" component="step1" />
        </link>
        <link xconnector="onPalmPause">
            <bind role="onHandPoseRecognition" component="step2" />
            <bind role="pause" component="step2" />
        </link>
        <link xconnector="onPalmPause">
            <bind role="onHandPoseRecognition" component="step3" />
            <bind role="pause" component="step3" />
        </link>
        <link xconnector="onPalmPause">
            <bind role="onHandPoseRecognition" component="step4" />
            <bind role="pause" component="step4" />
        </link>

        <!-- THUMBS_UP -> play (resume) the current step. -->
        <link xconnector="onThumbPlay">
            <bind role="onHandPoseRecognition" component="step1" />
            <bind role="resume" component="step1" />
        </link>
        <link xconnector="onThumbPlay">
            <bind role="onHandPoseRecognition" component="step2" />
            <bind role="resume" component="step2" />
        </link>
        <link xconnector="onThumbPlay">
            <bind role="onHandPoseRecognition" component="step3" />
            <bind role="resume" component="step3" />
        </link>
        <link xconnector="onThumbPlay">
            <bind role="onHandPoseRecognition" component="step4" />
            <bind role="resume" component="step4" />
        </link>
    </body>
</ncl>