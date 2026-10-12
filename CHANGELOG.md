# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> This file is a record and has not been kept up to date. Changes to bcast made
> as part of TV30 are recorded in the `CHANGELOG.md` at the root of TV30. The
> current state is the code; `README.md` and `.env.example` describe it.

## Unreleased

### Changed (2026-10-12, evening: G8, Luis's decision; also in the root `CHANGELOG.md`)

- `src/modules/users-test/app.ejs`: the profile `avatar` is now the name of
  a file (Table 7, "file path"; G8), so the page asks for its content through
  C.6.14.6, `GET /tv3/current-service/users/files?path=<avatar>` (Table
  C.73), at the edge (44642). The request is a `fetch`, which carries the
  page's `Origin`, by which the edge recognizes the app as an associated
  client; one request per distinct avatar, and the grid is drawn again when
  they arrive (results of an older load are discarded). The content is shown
  as an `<img src="blob:...">`, where the SVG runs no script and loads
  nothing. No avatar, an error answer (305, 405...), a network failure or a
  `Content-Type` that is not `image/...` gives the page's default avatar,
  which stays inline. Before, the field held the inline SVG, shown as an
  `<img src="data:...">` (entry below).

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
