# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> This file is a record and has not been kept up to date. Changes to bcast made
> as part of TV30 are recorded in the `CHANGELOG.md` at the root of TV30. The
> current state is the code; `README.md` and `.env.example` describe it.

## Unreleased

### Security (2026-10-12, afternoon; also in the root `CHANGELOG.md`)

- `src/modules/users-test/app.ejs`: the profile avatar is shown as an
  `<img src="data:image/svg+xml;base64,...">`, the same treatment as the AoP
  (`aop/src/html.js`), with the SVG namespace added when it is missing.
  Before, the SVG stored in the profile (the AoP stores the avatar from
  `POST /profile/create` without checking its format) went raw into
  `innerHTML`, and an event attribute in it ran on the page (measured in
  Chrome 154). The page's own default avatar stays inline.
- `src/modules/eduplay/quiz-player.ejs` and `quiz-presenter.ejs`: messages
  from the quiz logic server (socket.io), the countdown, the end and error
  messages and the statistics, go into the page as text (`textContent`), and
  not as HTML. Before, HTML in them ran on the player's and the presenter's
  page (measured in Chrome 154).

### Added

- Basic HTML application to simulate a DTV+ service
