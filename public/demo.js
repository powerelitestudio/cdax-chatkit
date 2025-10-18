// DAX GPT demo - loader oficial + diagnóstico + fallbacks + watchdog + auto-fix altura
const box   = document.getElementById('cdax-demo');
const logEl = document.getElementById('log');
const mount = document.getElementById('mount');
const ENDPOINT = box?.dataset?.endpoint || '/api/create-session';

const log = (msg, cls='') => logEl.insertAdjacentHTML('beforeend', `<div class="${cls}">${msg}</div>`);

// Carga el script de ChatKit (oficial + fallback local opcional)
function loadChatKitScript(sources){
  return new Promise((resolve, reject) => {
    const tryNext = i => {
      if (i >= sources.length) return reject(new Error('No se pudo cargar ChatKit.'));
      const src = sources[i], s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = () => (customElements.whenDefined ? customElements.whenDefined('openai-chatkit') : Promise.resolve())
        .then(()=>resolve(src)).catch(()=>resolve(src));
      s.onerror = () => { s.remove(); tryNext(i+1); };
      document.head.appendChild(s);
    };
    tryNext(0);
  });
}

// Hooks para ver errores en pantalla
(() => {
  if (window.__cdaxErrHooksAttached) return; window.__cdaxErrHooksAttached = true;
  window.addEventListener('error', e => log('⚠️ [page error] ' + (e?.message || e), 'bad'));
  window.addEventListener('unhandledrejection', e => log('⚠️ [unhandled] ' + (e?.reason || e), 'bad'));
})();

(async function main(){
  try{
    log('1) Script cargado ✅', 'ok');
    log(`1.1) Origen: <code>${location.origin}</code> · Endpoint: <code>${ENDPOINT}</code>`, 'muted');

    // 1) Cargar ChatKit
    try{
      const from = await loadChatKitScript([
        'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js',
        '/vendor/chatkit.js' // (opcional) si auto-alojas el script en /public/vendor/chatkit.js
      ]);
      const def = customElements.get && customElements.get('openai-chatkit');
      log(`2) Web component cargado desde <code>${from}</code> ✅`, 'ok');
      log(`2.1) customElement: <code>${def ? (def.name || 'definido') : 'no definido'}</code>`, 'muted');
    }catch(e){
      log('2) Error cargando web component ❌<br><code>'+String(e).replace(/</g,'&lt;')+'</code>', 'bad');
      return;
    }

    // 2) Pedir client_secret
    let data;
    try{
      log('3) Pidiendo client_secret a '+ENDPOINT+' …', 'muted');
      const r = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const raw = await r.text();
      log(`3.1) Respuesta HTTP: ${r.status}`, r.ok ? 'ok' : 'bad');
      if(!r.ok){ log('<code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      data = JSON.parse(raw);
      if(!data.client_secret){ log('3.2) JSON sin <code>client_secret</code> ❌ → <code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      log('3.2) client_secret recibido ✅', 'ok');
    }catch(e){
      log('3) Excepción en fetch ❌ → '+String(e), 'bad'); return;
    }

    // 3) Montar el componente
    try{
      const el = document.createElement('openai-chatkit');
      // 👇 claves: dales altura real al host y al contenedor
      el.style.cssText = 'display:block;width:100%;height:100%';

      el.addEventListener('chatkit.error', ({ detail }) => {
        const msg = (detail && (detail.error?.message || detail.error)) || 'Error desconocido';
        log('ChatKit error ❌ → <code>'+String(msg).replace(/</g,'&lt;')+'</code>', 'bad');
      });
      el.addEventListener?.('chatkit.ready', () => log('4.x) ChatKit ready ✅', 'ok'));

      el.setOptions({
        api: { async getClientSecret(){ return data.client_secret; } },
        theme: {
          colorScheme: "light",
          color: { accent: { primary: "#EF4C1D" } },
          radius: "round",
          typography: { fontFamily: "Inter, system-ui, sans-serif" }
        },
        startScreen: { greeting: "👋 Hola, soy DAX GPT. Demo embebida en Vercel." }
      });

      mount.innerHTML = '';
      mount.appendChild(el);
      log('4) Componente añadido al DOM ✅', 'ok');

      // 4.1) Watchdog + auto-fix de altura si hace falta
      let tries = 0;
      const check = () => {
        tries++;
        const h = el.getBoundingClientRect().height|0;
        log(`4.${tries}) altura actual: ${h}px`, h>50 ? 'ok' : 'muted');

        if (h > 50) return; // ya renderizó

        if (tries === 2) {
          // fuerza altura al mount y al host (por si el % no resuelve)
          mount.style.height = '600px';
          el.style.height = '600px';
          log('➡️ Ajuste aplicado: height 600px a #mount y <openai-chatkit>.', 'muted');
        }

        if (tries === 3) {
          log('ℹ️ Si sigue en 0px: añade tu dominio a OpenAI → Settings → Organization → Security → Domain allowlist.', 'muted');
          log(`Añade: <code>${location.origin}</code> (y los de producción)`, 'muted');
        }

        if (tries === 4) {
          log('ℹ️ Revisa Network por llamadas a <code>api.openai.com</code> en rojo (403/401/CORS).', 'muted');
        }

        if (tries < 6) setTimeout(check, 1200);
        else log('⚠️ La UI no se inicializó tras varios intentos.', 'bad');
      };
      check();
    }catch(e){
      log('4) Excepción montando componente ❌ → '+String(e), 'bad');
    }
  }catch(e){
    log('∑ Error inesperado: '+String(e), 'bad');
  }
})();
