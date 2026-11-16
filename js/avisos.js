/* ===== Consejos de hidratación: avisos aleatorios entre tomas (datos en data/notificaciones_hidratacion.json) ===== */
const TK='hidrametric.tips.v1';
const CAP={cognitivo:'rendimiento_cognitivo',rendimiento:'sistema_musculoesqueletico',metabolismo:'eficiencia_metabolica',salud_renal:'salud_organica',bienestar:'eficiencia_metabolica',salud_vascular:'salud_organica',estetica:'integridad_epitelial',termorregulacion:'eficiencia_metabolica'};
let TS={freq:3,bag:[],fired:{}},NOTIFS=[],tt;
try{Object.assign(TS,JSON.parse(localStorage.getItem(TK)||'{}'))}catch(e){}
const tsSave=()=>{try{localStorage.setItem(TK,JSON.stringify(TS))}catch(e){}};
fetch('data/notificaciones_hidratacion.json').then(r=>r.json()).then(j=>{NOTIFS=j.notificaciones_hidratacion||[]}).catch(()=>{});

/* Un consejo no se repite hasta haber salido todos los demás. */
function nextTip(){
 if(!NOTIFS.length)return null;
 if(!TS.bag.length)TS.bag=NOTIFS.map(n=>n.id).sort(()=>Math.random()-.5);
 const id=TS.bag.pop();tsSave();return NOTIFS.find(n=>n.id===id)||NOTIFS[0];
}
/* Minutos del día en que toca un consejo: punto medio entre tomas consecutivas, dentro del horario despertar–dormir. */
function tipTimes(){
 const S=slots(),f=+TS.freq;if(!f||S.length<2||!perfil)return [];
 const g=[];for(let i=0;i<S.length-1;i++){const a=mins(S[i].t),b=mins(S[i+1].t);if(b-a>=30)g.push(Math.round((a+b)/2))}
 const ok=g.filter(m=>m>=+perfil.desp*60&&m<=+perfil.dorm*60);
 return f>=ok.length?ok:Array.from({length:f},(_,k)=>ok[Math.floor((k+.5)*ok.length/f)]);
}
async function notificar(titulo,cuerpo,tag,url){
 try{if(!window.Notification||Notification.permission!=='granted')return;
  const o={body:cuerpo,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag,data:{url}};
  const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
  if(reg)await reg.showNotification(titulo,o);else new Notification(titulo,o);
 }catch(e){}
}
function toast(t,cap){
 const el=$('toast');el.innerHTML='<b>'+esc(t.titulo)+'</b><span>'+esc(t.mensaje)+'</span><button data-lib="'+esc(cap)+'">Leer más →</button><button class="x" aria-label="Cerrar">✕</button>';
 el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{el.hidden=true},12000);
}
/* Con la app visible: aviso discreto. En segundo plano: notificación del sistema. */
function mostrarTip(t,prueba){
 if(!t)return;const cap=CAP[t.categoria]||'';
 if(document.hidden||prueba)notificar(t.titulo,t.mensaje,'tip-'+t.id,'./#libro-'+cap);
 if(!document.hidden)toast(t,cap);
}
function revisarTips(){
 if(!+TS.freq||!perfil||!NOTIFS.length)return;
 const n=new Date(),mn=n.getHours()*60+n.getMinutes(),day=hoy();
 if(TS.fired.d!==day)TS.fired={d:day,t:[]};
 let cambio=false;
 for(const m of tipTimes()){
  if(TS.fired.t.includes(m))continue;
  if(mn>=m&&mn<m+10){TS.fired.t.push(m);cambio=true;if(total()<meta)mostrarTip(nextTip());break}
  if(mn>=m+10){TS.fired.t.push(m);cambio=true}
 }
 if(cambio)tsSave();
}
/* Eventos de consejos para el calendario (.ics): 14 días, cada uno con un mensaje distinto. */
function icsExtra(ymd,st){
 if(!$('icsTips').checked||!+TS.freq||!NOTIFS.length)return [];
 const X=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
 const L=[],T=tipTimes(),b0=new Date();let bag=[];
 for(let d=0;d<14;d++){
  const dt=new Date(b0.getFullYear(),b0.getMonth(),b0.getDate()+d),ds=dt.getFullYear()+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0');
  T.forEach(m=>{
   if(!bag.length)bag=NOTIFS.slice().sort(()=>Math.random()-.5);
   const n=bag.pop(),k=String(Math.floor(m/60)).padStart(2,'0')+String(m%60).padStart(2,'0');
   L.push('BEGIN:VEVENT','UID:hmtip-'+ds+k+'@hidrametric','DTSTAMP:'+st,'DTSTART:'+ds+'T'+k+'00','DURATION:PT5M','SUMMARY:'+X(n.titulo),'DESCRIPTION:'+X(n.mensaje),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+X(n.mensaje),'TRIGGER:PT0M','END:VALARM','END:VEVENT');
  });
 }
 return L;
}
$('tipFreq').value=String(TS.freq);
$('tipFreq').addEventListener('change',()=>{TS.freq=+$('tipFreq').value;tsSave();if(TS.freq&&window.Notification&&Notification.permission==='default')try{Notification.requestPermission()}catch(e){}});
$('tipTest').onclick=()=>{try{window.Notification&&Notification.permission==='default'&&Notification.requestPermission()}catch(e){}mostrarTip(nextTip(),true)};
$('toast').addEventListener('click',e=>{if(e.target.closest('.x')){$('toast').hidden=true;return}const b=e.target.closest('[data-lib]');if(b){$('toast').hidden=true;abrirLibro(b.dataset.lib||null,0)}});
setInterval(revisarTips,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)revisarTips()});
