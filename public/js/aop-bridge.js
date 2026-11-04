// Event bridge of the AoP: the AoP sends keydown, timeupdate and
// stream_event by postMessage ({type: 'tv30-aop-event', event, key |
// detail}); this bridge dispatches them again on the document. It listens
// only to the parent window.
(function () {
  if (window.parent === window) return;
  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var m = e.data;
    if (!m || typeof m !== 'object' || m.type !== 'tv30-aop-event') return;
    if (m.event === 'keydown') {
      if (typeof m.key === 'string') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: m.key }));
      }
    } else if (m.event === 'timeupdate' || m.event === 'stream_event') {
      document.dispatchEvent(new CustomEvent(m.event, { detail: m.detail }));
    }
  });
})();
