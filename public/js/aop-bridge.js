// Ponte de eventos do AoP: a camada grafica abre cada aplicacao na propria
// origem (aop/src/app-hosts.js), e a politica de mesma origem impede o AoP de
// disparar eventos no document dela. O AoP manda keydown, timeupdate e
// stream_event por postMessage ({type: 'tv30-aop-event', event, key | detail});
// esta ponte os redespacha no document. So ouve a janela mae.
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
