// DAX GPT demo - loader con script oficial de OpenAI + fallback local
const box   = document.getElementById('cdax-demo');
const logEl = document.getElementById('log');
const mount = document.getElementById('mount');
const ENDPOINT = box?.dataset?.endpoint || '/api/create-session';

const log = (msg, cls='') =>
  logEl.insertAdjacentHTML('beforeend', `<div class="${cls}">${msg}</div>`);

// Carga <script> y espera a que el custom element esté definido
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
      s.onload = () => {
        // ChatKit registra <openai-chatkit> al cargar
        (customElements.whenDefined
          ? customElements.whenDefined('openai-chatkit')
          : Promise.resolve()
        ).then(() => resolve(src));
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

(async function main(){
  try{
    log('1) Script cargado ✅', 'ok');

    // 1) Cargar ChatKit desde OpenAI CDN, con fallback local
    try{
      const loadedFrom = await loadChatKitScript([
        // Script oficial según docs
        'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js',
        // Fallback self-hosted (si lo subes a /public/vendor/chatkit.js)
        '/vendor/chatkit.js',
      ]);
      log(`2) Web component cargado desde <code>${loadedFrom}</code> ✅`, 'ok');
    }catch(e){
      log('2) Error cargando web component ❌<br><code>'+String(e).replace(/</g,'&lt;')+'</code>', 'bad');
      return;
    }

    // 2) Solicitar client_secret a tu endpoint
    let data;
    try{
      log('3) Pidiendo client_secret a '+ENDPOINT+' …', 'muted');
      const r   = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const raw = await r.text();
      log(`3.1) Respuesta HTTP: ${r.status}`, r.ok ? 'ok' : 'bad');
      if(!r.ok){ log('<code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      data = JSON.parse(raw);
      if(!data.client_secret){ log('3.2) JSON sin client_secret ❌ → <code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      log('3.2) client_secret recibido ✅', 'ok');
    }catch(e){
      log('3) Excepción en fetch ❌ → '+String(e), 'bad');
      return;
    }

    // 3) Montar el componente
    try{
      const el = document.createElement('openai-chatkit');
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

      setTimeout(()=>{
        const h = el.getBoundingClientRect().height|0;
        if(h<50){ log('4.1) El componente no renderizó UI (altura '+h+'px). Revisa consola.', 'bad'); }
        else { log('4.1) UI renderizada (altura '+h+'px) ✅', 'ok'); }
      }, 1500);
    }catch(e){
      log('4) Excepción montando componente ❌ → '+String(e), 'bad');
    }
  }catch(e){
    log('∑ Error inesperado: '+String(e), 'bad');
  }
})();
