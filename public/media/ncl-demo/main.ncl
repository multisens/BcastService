<?xml version="1.0" encoding="UTF-8"?>
<!--
  Second app bundle: a deliberately minimal, visually distinct document used to
  demonstrate swap-app (issue #30). A centered logo and a bottom caption, no
  video and no links — just enough to prove the Active app flipped. Every src is
  relative to THIS document; the engine resolves them bundle-root-relative and
  the player prepends its single base URL (ADR-0001).
-->
<ncl id="helloApp" xmlns="http://www.ncl.org.br/NCL4.0/MainDTVProfile">
    <head>
        <regionBase>
            <region id="logoRegion" left="30%" top="30%" width="40%" height="40%" zIndex="1" />
            <region id="captionRegion" left="8%" top="82%" width="84%" height="10%" zIndex="2" />
        </regionBase>

        <descriptorBase>
            <descriptor id="descLogo" region="logoRegion" />
            <descriptor id="descCaption" region="captionRegion" />
        </descriptorBase>
    </head>

    <body>
        <port id="pLogo" component="logo" />
        <port id="pCaption" component="caption" />

        <media id="logo" src="media/logo.png" descriptor="descLogo" />
        <media id="caption" src="media/caption.txt" descriptor="descCaption" />
    </body>
</ncl>
