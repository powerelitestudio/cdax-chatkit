// DAX GPT demo - loader con script oficial + diagnóstico + altura forzada
const box   = document.getElementById('cdax-demo');
const logEl = document.getElementById('log');
const mount = document.getElementById('mount');
const ENDPOINT = box?.dataset?.endpoint || '/api/create-session';

const log = (msg, cls='') =>
  logEl.insertAdjacentHTML('beforeend', `<div class="${cls}">${msg}</div>`);

// Carga el script oficial de OpenAI con fallback local opcional
function loadChatKitScript(sources) {
  return new Promise((resolve, reject) => {
    const tryNext = (i) => {
      if (i >= sources.length) return reject(new Error('No se pudo cargar ChatKit.'));
      const src = sources[i];
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => (customElements.whenDefined ? customElements.whenDefined('openai-chatkit') : Promise.resolve())
        .then(() => resolve(src));
      s.onerror = () => { s.remove(); tryNext(i + 1); };
      document.head.appendChild(s);
    };
    tryNext(0);
  });
}

(async function main(){
  try{
    log('1) Script cargado ✅', 'ok');

    // Altura mínima para evitar 0px si tarda en inicializar
    mount.style.minHeight = '520px';

    // 1) Cargar ChatKit
    try{
      const from = await loadChatKitScript([
        'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js',
        '/vendor/chatkit.js'
      ]);
      log(`2) Web component cargado desde <code>${from}</code> ✅`, 'ok');
    }catch(e){
      log('2) Error cargando web component ❌<br><code>'+String(e).replace(/</g,'&lt;')+'</code>', 'bad');
      return;
    }

    // 2) client_secret
    let data;
    try{
      log('3) Pidiendo client_secret a '+ENDPOINT+' …', 'muted');
      const r = await fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const raw = await r.text();
      log(`3.1) Respuesta HTTP: ${r.status}`, r.ok ? 'ok' : 'bad');
      if(!r.ok){ log('<code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      data = JSON.parse(raw);
      if(!data.client_secret){ log('3.2) JSON sin client_secret ❌ → <code>'+raw.replace(/</g,'&lt;')+'</code>', 'bad'); return; }
      log('3.2) client_secret recibido ✅', 'ok');
    }catch(e){
      log('3) Excepción en fetch ❌ → '+String(e), 'bad'); return;
    }

    // 3) Montar chat
    try{
      const el = document.createElement('openai-chatkit');
      // fuerza tamaño por si tarda en hidratar
      el.style.cssText = 'display:block;width:100%;height:100%';

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

      // watchdog extendido
      const tick = (n=1)=>setTimeout(()=>{
        const h = el.getBoundingClientRect().height|0;
        log(`4.${n}) altura actual: ${h}px`, h>50?'ok':'muted');
        if(h<50 && n<5) tick(n+1);
        if(h<50 && n===5){
          log('⚠️  La UI no se inicializó. Revisa la pestaña Network por llamadas bloqueadas a <code>api.openai.com</code> o errores CSP.', 'bad');
        }
      }, 1200);
      tick();
    }catch(e){
      log('4) Excepción montando componente ❌ → '+String(e), 'bad');
    }
  }catch(e){
    log('∑ Error inesperado: '+String(e), 'bad');
  }
})();
