// Ponte de eventos da plataforma (AoP) para a aplicacao de emissora.
//
// Desde o P1.3 (decisao do Luis em 10/10), a camada grafica do AoP abre cada
// aplicacao na sua propria origem (http://<app>.<APPS_DOMAIN>:<porta do AoP>,
// ver aop/src/app-hosts.js), e a politica de mesma origem do navegador impede
// o AoP de disparar eventos direto no documento da aplicacao, como fazia
// quando ela abria pelo proxy /graphicsAppProxy, na origem do AoP. O AoP
// passa a mandar esses eventos por postMessage
// ({type: 'tv30-aop-event', event, key | detail}); esta ponte os redespacha
// no document com o MESMO formato de antes, e o codigo da aplicacao nao muda:
// - keydown: KeyboardEvent('keydown', {key}) — teclas que o AoP repassa;
// - timeupdate: CustomEvent('timeupdate', {detail: segundos do player});
// - stream_event: CustomEvent('stream_event', {detail: texto JSON do evento}).
// So aceita mensagem da janela mae (a camada grafica do AoP). Fora de iframe
// nao faz nada; na mesma origem da janela mae (nao acontece desde 11/10: o
// /graphicsAppProxy no host do AoP redireciona para o host da aplicacao), o
// AoP dispara direto e nenhuma mensagem chega aqui.
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
