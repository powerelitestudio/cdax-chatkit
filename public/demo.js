// DAX GPT demo - loader oficial + diagnóstico detallado + fallbacks + watchdog
// Coloca este archivo en: public/demo.js  (Vercel lo servirá en /demo.js)

const box   = document.getElementById('cdax-demo');
const logEl = document.getElementById('log');
const mount = document.getElementById('mount');
const ENDPOINT = box?.dataset?.endpoint || '/api/create-session';

const log = (msg, cls='') =>
  logEl.insertAdjacentHTML('beforeend', `<div class="${cls}">${msg}</div>`);

// ==== util: carga el script de ChatKit con fallbacks =========================
function loadChatKitScript(sources) {
  return new Promise((resolve, reject) => {
    const tryNext = (i) => {
      if (i >= sources.length) {
        reject(new Error('No se pudo cargar ChatKit desde ningún origen.'));
        return;
      }
      const src = sources[i];
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => {
        const def = customElements.get && customElements.get('openai-chatkit');
        if (def) return resolve(src);
        (customElements.whenDefined ? customElements.whenDefined('openai-chatkit') : Promise.resolve())
          .then(() => resolve(src))
          .catch(() => resolve(src));
      };
      s.onerror = () => {
        s.remove();
        tryNext(i + 1);
      };
      document.head.appendChild(s);
    };
    tryNext(0);
  });
}

// ==== util: hooks de errores globales (para verlos en pantalla) =============
(function attachGlobalErrorHooks(){
  if (window.__cdaxErrHooksAttached) return;
  window.__cdaxErrHooksAttached = true;
  window.addEventListener('error', e => log('⚠️ [page error] ' + (e?.message || e), 'bad'));
  window.addEventListener('unhandledrejection', e => log('⚠️ [unhandled] ' + (e?.reason || e), 'bad'));
})();

// ==== flujo principal ========================================================
(async function main(){
  try{
    log('1) Script cargado ✅', 'ok');
    log(`1.1) Origen: <code>${location.origin}</code> · Endpoint: <code>${ENDPOINT}</code>`, 'muted');

    // Altura mínima para evitar 0px mientras hidrata
    mount.style.minHeight = '520px';

    // 2) Cargar ChatKit (script oficial con fallback local opcional)
    try{
      const from = await loadChatKitScript([
        'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js', // oficial
        '/vendor/chatkit.js', // <- si lo subes a /public/vendor/chatkit.js
      ]);
      const def = customElements.get && customElements.get('openai-chatkit');
      log(`2) Web component cargado desde <code>${from}</code> ✅`, 'ok');
      log(`2.1) customElement: <code>${def ? def.name || 'definido' : 'no definido'}</code>`, 'muted');
    }catch(e){
      log('2) Error cargando web component ❌<br><code>'+String(e).replace(/</g,'&lt;')+'</code>', 'bad');
      log('Sugerencia: si tu red bloquea CDNs, auto-aloja <code>/public/vendor/chatkit.js</code> con el script oficial de OpenAI.', 'muted');
      return;
    }

    // 3) Pedir client_secret a tu endpoint
    let data;
    try{
      log('3) Pidiendo client_secret a '+ENDPOINT+' …', 'muted');
      const r   = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const raw = await r.text();
      log(`3.1) Respuesta HTTP: ${r.status}`, r.ok ? 'ok' : 'bad');
      if(!r.ok){ log('<code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      data = JSON.parse(raw);
      if(!data.client_secret){
        log('3.2) JSON sin <code>client_secret</code> ❌ → <code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad');
        return;
      }
      log('3.2) client_secret recibido ✅', 'ok');
    }catch(e){
      log('3) Excepción en fetch ❌ → '+String(e), 'bad');
      return;
    }

    // 4) Montar el componente
    try{
      const el = document.createElement('openai-chatkit');

      // Forzamos tamaño y display, por si el CSS del tema es restrictivo
      el.style.cssText = 'display:block;width:100%;height:100%';

      // Escucha errores internos del widget (si los emite)
      el.addEventListener('chatkit.error', ({ detail }) => {
        const msg = (detail && (detail.error?.message || detail.error)) || 'Error desconocido';
        log('ChatKit error ❌ → <code>'+String(msg).replace(/</g,'&lt;')+'</code>', 'bad');
      });
      // (algunos builds exponen un evento de “ready”)
      el.addEventListener?.('chatkit.ready', () => log('4.x) ChatKit ready ✅', 'ok'));

      // Montaje con opciones mínimas
      el.setOptions({
        api: { async getClientSecret(){ return data.client_secret; } },
        theme: {
          colorScheme: "light",
          color: { accent: { primary: "#EF4C1D" } },
          radius: "round",
          typography: { fontFamily: "Inter, system-ui, sans-serif" }
        },
        startScreen: {
          greeting: "👋 Hola, soy DAX GPT. Demo embebida en Vercel."
        }
      });

      mount.innerHTML = '';
      mount.appendChild(el);
      log('4) Componente añadido al DOM ✅', 'ok');

      // 4.1) Watchdog: revisa altura varias veces
      let tries = 0;
      const check = async () => {
        tries++;
        const h = el.getBoundingClientRect().height|0;
        log(`4.${tries}) altura actual: ${h}px`, h>50 ? 'ok' : 'muted');

        if (h > 50) return; // ya renderizó

        if (tries === 2) {
          // Pista: dominios en allowlist del dashboard de OpenAI
          log('ℹ️ Sugerencia: añade tu dominio a <strong>OpenAI Dashboard → Settings → Organization → Security → Domain allowlist</strong>.', 'muted');
          log(`Añade: <code>${location.origin}</code> (y los dominios de producción)`, 'muted');
        }

        if (tries === 3) {
          // Pista: CSP / bloqueos de red
          log('ℹ️ Revisa en pestaña Network si hay llamadas a <code>api.openai.com</code> en rojo (403/401/CORS).', 'muted');
        }

        if (tries < 6) setTimeout(check, 1200);
        else {
          log('⚠️ La UI no se inicializó tras varios intentos.', 'bad');
          log('Posibles causas: dominio no allowlisteado en el dashboard, CSP bloqueando, o error interno (mira Console).', 'bad');
        }
      };
      check();

      // Exponer objeto de diagnóstico por si lo necesitamos
      window.cdaxDiag = {
        element: el,
        customElement: customElements.get && customElements.get('openai-chatkit'),
        endpoint: ENDPOINT,
        origin: location.origin
      };
    }catch(e){
      log('4) Excepción montando componente ❌ → '+String(e), 'bad');
    }
  }catch(e){
    log('∑ Error inesperado: '+String(e), 'bad');
  }
})();
