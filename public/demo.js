// DAX GPT demo - módulo externo con diagnóstico + fallbacks de carga
const box   = document.getElementById('cdax-demo');
const logEl = document.getElementById('log');
const mount = document.getElementById('mount');
const ENDPOINT = box?.dataset?.endpoint || '/api/create-session';

const log = (msg, cls='') =>
  logEl.insertAdjacentHTML('beforeend', `<div class="${cls}">${msg}</div>`);

// intenta cargar el web component desde varias fuentes
async function loadChatKit() {
  const sources = [
    // CDN 1
    'https://cdn.jsdelivr.net/npm/@openai/chatkit@latest/dist/web.js',
    // CDN 2
    'https://unpkg.com/@openai/chatkit@latest/dist/web.js',
    // Self-host (lo pondrás en /public/vendor/chatkit-web.js si los CDN fallan)
    '/vendor/chatkit-web.js'
  ];
  const errs = [];
  for (const src of sources) {
    try {
      await import(/* @vite-ignore */ src);
      log(`2) Web component cargado desde <code>${src}</code> ✅`, 'ok');
      return;
    } catch (e) {
      errs.push(`${src} → ${String(e)}`);
    }
  }
  throw new Error('No se pudo cargar ChatKit desde ningún origen:\n' + errs.join('\n'));
}

(async function main(){
  try{
    log('1) Script cargado ✅', 'ok');

    // 1) Cargar el web component con fallbacks
    try{
      await loadChatKit();
    }catch(e){
      log('2) Error cargando web component ❌<br><code>'+String(e).replace(/</g,'&lt;')+'</code>', 'bad');
      return;
    }

    // 2) Llamar a create-session
    let data;
    try{
      log('3) Pidiendo client_secret a '+ENDPOINT+' …', 'muted');
      const r   = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:'{}'
      });
      const raw = await r.text();
      log(`3.1) Respuesta HTTP: ${r.status}`, r.ok ? 'ok' : 'bad');
      if(!r.ok){
        log('<code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad');
        return;
      }
      data = JSON.parse(raw);
      if(!data.client_secret){
        log('3.2) JSON sin client_secret ❌ → <code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad');
        return;
      }
      log('3.2) client_secret recibido ✅', 'ok');
    }catch(e){
      log('3) Excepción en fetch ❌ → '+String(e), 'bad');
      return;
    }

    // 3) Montar el chat
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
        if(h<50){
          log('4.1) El componente no renderizó UI (altura '+h+'px). Revisa consola por errores.', 'bad');
        } else {
          log('4.1) UI renderizada (altura '+h+'px) ✅', 'ok');
        }
      }, 2000);
    }catch(e){
      log('4) Excepción montando componente ❌ → '+String(e), 'bad');
      return;
    }
  }catch(e){
    log('∑ Error inesperado: '+String(e), 'bad');
  }
})();
