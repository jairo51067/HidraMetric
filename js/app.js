const $=id=>document.getElementById(id);
const K='hidrametric.v2';
let custom=null,perfil=null,meta=0,log={fecha:hoy(),items:[]};
function hoy(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function load(){try{const s=JSON.parse(localStorage.getItem(K)||'{}');if(s.perfil)for(const k in s.perfil){const e=$(k);if(e)e.value=s.perfil[k]}
 if(s.log&&s.log.fecha===hoy())log=s.log;custom=s.custom||null;$('alOn').checked=!!s.alOn;$('themeBtn')&&setTheme(s.tema||'light')}catch(e){setTheme('light')}}
function save(){try{localStorage.setItem(K,JSON.stringify({perfil:perfil||leer(),log,custom,alOn:$('alOn').checked,tema:document.documentElement.dataset.theme}))}catch(e){}}
function leer(){const o={};['sexo','edad','estatura','peso','act','clima','estado','desp','dorm'].forEach(k=>o[k]=$(k).value);return o}
function setTheme(t){document.documentElement.dataset.theme=t;$('themeBtn').textContent=t==='light'?'🌙':'☀️'}
function modal(t,b,lbl){$('mx').textContent=lbl||'Entendido';$('mt').textContent=t;$('mb').innerHTML='<p>'+b+'</p>';$('ov').classList.add('on')}
$('mx').onclick=()=>$('ov').classList.remove('on');
$('ov').onclick=e=>{if(e.target===$('ov'))$('ov').classList.remove('on')};
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('ov').classList.remove('on')});
$('themeBtn').onclick=()=>{setTheme(document.documentElement.dataset.theme==='light'?'dark':'light');save()};

function validar(){
 const r={edad:[18,100],estatura:[120,230],peso:[30,250],desp:[0,12],dorm:[16,24]};let ok=true,msg='';
 for(const k in r){const v=parseFloat($(k).value),bad=!(v>=r[k][0]&&v<=r[k][1]);$(k).classList.toggle('err',bad);if(bad){ok=false;msg='Valores fuera de rango (edad 18–100, estatura 120–230 cm, peso 30–250 kg, despertar 0–12 h, dormir 16–24 h). La app está validada solo para adultos.'}}
 if(ok&&+$('dorm').value-+$('desp').value<8){ok=false;msg='El periodo de vigilia debe ser de al menos 8 horas.'}
 const e=$('err');e.textContent=msg;e.style.display=msg?'block':'none';return ok}

function calcular(){
 if(!validar()){perfil=null;meta=0;['bmr','tdee','meta'].forEach(i=>$(i).textContent='–');$('desglose').textContent='';render();return}
 const p=leer(),h=p.sexo==='h',w=+p.peso,t=+p.estatura,a=+p.edad;
 const bmr=10*w+6.25*t-5*a+(h?5:-161),tdee=bmr*p.act;
 const ai=h?2500:2000,agua=Math.max(ai,tdee);
 const extra=(+p.clima)+(h?0:+p.estado);
 meta=Math.round((agua*.8+extra)/50)*50;perfil=p;
 $('bmr').textContent=Math.round(bmr)+' kcal';$('tdee').textContent=Math.round(tdee)+' kcal';$('meta').textContent=(meta/1000).toFixed(2)+' L';
 $('desglose').textContent='Agua total de referencia: '+(agua/1000).toFixed(2)+' L ('+(agua===ai?'EFSA AI':'1 ml/kcal')+') · de bebidas ≈80 % = '+Math.round(agua*.8)+' ml'+(extra?' · ajustes +'+extra+' ml':'')+'.';
 save();renderEditor();renderCal();render()}

function total(){return log.items.reduce((s,i)=>s+i.ml,0)}
function add(ml){
 if(!perfil){modal('Perfil incompleto','Corrija los datos del perfil antes de registrar.');return}
 if(log.fecha!==hoy())log={fecha:hoy(),items:[]};
 const now=Date.now(),rec=log.items.filter(i=>now-i.t<36e5).reduce((s,i)=>s+i.ml,0)+ml;
 log.items.push({t:now,ml});save();render();
 if(rec>1000)modal('Ritmo de ingesta elevado','Ha registrado '+rec+' ml en la última hora. La capacidad renal de excretar agua es de orientativamente 0,8–1 L/h; superarla de forma sostenida aumenta el riesgo de hiponatremia dilucional. Espaciar las tomas.');
 else if(total()>meta*1.15)modal('Alerta de sobrehidratación','Ha superado el 115 % de su meta ('+(total()-meta)+' ml de exceso). La ingesta excesiva de líquidos puede diluir el sodio en sangre (hiponatremia) y sobrecargar la función renal. Detenga el consumo de líquidos; si hay náuseas, dolor de cabeza intenso o confusión, busque atención médica.')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b){if(b.id==='alReg')$('ov').classList.remove('on');add(+b.dataset.add)}});
$('customBtn').onclick=()=>modal('Registro personalizado','Volumen en ml (1–1500)<br><br><input id="ci" type="number" min="1" max="1500" value="150"><br><br><button class="btn" style="width:100%" id="cok">Añadir</button>');
document.addEventListener('click',e=>{if(e.target.id==='cok'){const v=Math.round(parseFloat($('ci').value));if(v>=1&&v<=1500){$('ov').classList.remove('on');add(v)}else $('ci').classList.add('err')}});
$('undoBtn').onclick=()=>{log.items.pop();save();render()};
$('resetBtn').onclick=()=>modal('Reiniciar consumo','Se borrarán los registros de hoy ('+total()+' ml). Esta acción no se puede deshacer.<br><br><button class="btn d" style="width:100%" id="rok">Sí, reiniciar</button>','Cancelar');
document.addEventListener('click',e=>{if(e.target.id==='rok'){log.items=[];save();$('ov').classList.remove('on');render()}});
$('moreBtn').onclick=()=>{const p=meta?total()/meta:0;modal(p>1.15?'Alerta de sobrehidratación':'Meta superada','Superar la meta no aporta beneficio adicional demostrado en personas sanas; la sed es una guía fiable para ajustar el resto del día. Por encima del 115 % se recomienda detener la ingesta de líquidos.')};

function render(){
 const ml=total(),pct=meta?Math.round(ml/meta*100):0,ratio=meta?Math.min(ml/meta,1.2):0;
 $('pct').textContent=pct+' %';$('vol').textContent=ml+' ml / '+(meta||'–')+' ml';
 $('wv').style.transform='translateY('+(190-176*Math.min(ratio,1))+'px)';
 let c1='var(--w1)',c2='var(--w2)',bn='',cls='';
 if(meta&&ml>meta*1.15){c1='rgba(239,68,68,.8)';c2='rgba(220,38,38,.95)';cls='bad';bn='Exceso superior al 115 % de la meta.'}
 else if(meta&&ml>meta){c1='rgba(245,158,11,.8)';c2='rgba(217,119,6,.95)';cls='warn';bn='Meta diaria superada.'}
 else if(meta&&ml===meta){c1=c2='#10b981'}
 $('s1').setAttribute('stop-color',c1);$('s2').setAttribute('stop-color',c2);
 $('exc').textContent=meta&&ml>meta?'Exceso: +'+(ml-meta)+' ml ('+((ml-meta)/1000).toFixed(2)+' L)':'';
 const b=$('banner');b.className='banner'+(cls?' on '+cls:'');$('bannerTxt').textContent=bn;
 timeline()}

/* ===== Plan de tomas (automático o personalizado) ===== */
const mins=t=>{const [h,m]=t.split(':');return +h*60+ +m};
const byT=(a,b)=>a.t<b.t?-1:1;
function autoSlots(){
 if(!perfil)return [];
 const d=+perfil.desp,s=+perfil.dorm-1,span=s-d,n=Math.min(10,Math.max(4,Math.round(span/2))),dose=Math.max(50,Math.round(meta/n/10)*10);
 return Array.from({length:n},(_,i)=>{const t=d+i*span/n,hh=Math.floor(t),mm=Math.round((t-hh)*60/5)*5;
  return {t:String(hh+(mm===60?1:0)).padStart(2,'0')+':'+String(mm%60).padStart(2,'0'),ml:dose,on:true}})}
function slots(){return (custom&&custom.length?custom:autoSlots()).slice().sort(byT)}
function ensureCustom(){if(!custom||!custom.length)custom=autoSlots().map(x=>({...x}))}

function timeline(){
 const box=$('tl'),ab=$('ahoraBox');
 if(!perfil){box.innerHTML='';ab.innerHTML='<p class="note">Completa el perfil para ver tu próxima toma.</p>';return}
 const S=slots(),ml=total(),now=new Date(),mn=now.getHours()*60+now.getMinutes();
 let html='',cur=false,sel=null,cum=0;
 S.forEach((x,i)=>{
  const m=mins(x.t),m2=i<S.length-1?mins(S[i+1].t):m+120;cum+=x.ml;const goal=Math.min(cum,meta);
  const done=ml>=goal*.98,isNow=!done&&mn>=m&&mn<m2&&!cur;if(isNow)cur=true;
  const late=!done&&!isNow&&mn>=m2;
  if(!done&&!sel&&(isNow||late||mn<m))sel={i,lb:x.t,isNow,late,goal,ml:x.ml};
  html+='<div class="ti'+(isNow?' now':'')+'"><div><time>'+x.t+(x.on?'':' 🔕')+'</time><span class="m">Toma '+(i+1)+' · '+x.ml+' ml · acumulado '+goal+' ml</span></div><span class="bg '+(done?'done">Cumplida':isNow?'now">Ahora':late?'late">Atrasada':'">Pendiente')+'</span></div>'});
 box.innerHTML=html;
 if(ml>=meta)ab.innerHTML='<div class="big">Meta del día cumplida ✓</div><p class="note">Sin beneficio adicional demostrado por beber más; guíate por la sed.</p>';
 else if(sel)ab.innerHTML='<div class="big">'+(sel.isNow?'Toma '+(sel.i+1)+' · ahora':sel.late?'Toma '+(sel.i+1)+' atrasada':'Próxima toma · '+sel.lb)+'</div><p class="note">Objetivo acumulado: '+sel.goal+' ml · faltan '+Math.max(sel.goal-ml,0)+' ml</p><button class="btn" data-add="'+sel.ml+'">+'+sel.ml+' ml</button>';
 else ab.innerHTML='<div class="big">Sin más tomas hoy</div><p class="note">Faltan '+(meta-ml)+' ml; reparte sorbos pequeños antes de dormir.</p>'}

/* ===== Editor de horarios ===== */
function renderEditor(){
 const S=custom&&custom.length?custom:autoSlots();
 $('edRows').innerHTML=S.map((x,i)=>'<div class="ti" style="gap:6px"><input type="checkbox" data-i="'+i+'" data-f="on" style="width:auto" '+(x.on?'checked':'')+' aria-label="Alarma activa"><input type="time" data-i="'+i+'" data-f="t" value="'+x.t+'" style="width:110px"><input type="number" data-i="'+i+'" data-f="ml" value="'+x.ml+'" min="50" max="1000" step="10" style="width:80px"><span class="m" style="font-size:.7rem;color:var(--tx2)">ml</span><button class="btn o" data-del="'+i+'" style="padding:6px 10px" aria-label="Quitar toma">✕</button></div>').join('')}
$('edRows').addEventListener('input',e=>{const f=e.target.dataset.f;if(!f)return;ensureCustom();const x=custom[+e.target.dataset.i];
 if(f==='on')x.on=e.target.checked;else if(f==='ml')x.ml=Math.max(50,Math.min(1000,+e.target.value||50));else if(e.target.value)x.t=e.target.value;
 save();timeline()});
$('edRows').addEventListener('change',e=>{if(e.target.dataset.f==='t'&&custom){custom.sort(byT);renderEditor();timeline()}});
document.addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(!d)return;
 ensureCustom();custom.splice(+d.dataset.del,1);if(!custom.length)custom=null;save();renderEditor();timeline()});
$('addSlot').onclick=()=>{ensureCustom();custom.push({t:'12:00',ml:250,on:true});custom.sort(byT);save();renderEditor();timeline()};
$('autoSlots').onclick=()=>{custom=null;save();renderEditor();timeline()};

/* ===== Alarmas con la app abierta ===== */
let actx=null;
function beep(){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();[0,.25,.5].forEach(o=>{const a=actx.createOscillator(),g=actx.createGain();a.frequency.value=880;g.gain.value=.15;a.connect(g);g.connect(actx.destination);a.start(actx.currentTime+o);a.stop(actx.currentTime+o+.15)})}catch(e){}}
function disparar(x){
 if(total()>=meta)return;beep();
 try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}
 try{if(window.Notification&&Notification.permission==='granted')new Notification('💧 HidraMetric',{body:'Hora de tomar '+x.ml+' ml',tag:'hm-'+x.t})}catch(e){}
 modal('💧 Hora de hidratarte','Toca tomar '+x.ml+' ml ('+x.t+').<br><br><button class="btn" style="width:100%" id="alReg" data-add="'+x.ml+'">Registrar +'+x.ml+' ml</button>','Después')}
function alarmas(){
 if(!$('alOn').checked||!perfil)return;
 const now=new Date(),mn=now.getHours()*60+now.getMinutes();log.fired=log.fired||[];
 if(log.fecha!==hoy())return;
 slots().forEach(x=>{if(!x.on||log.fired.includes(x.t))return;const m=mins(x.t);if(mn>=m&&mn<m+3){log.fired.push(x.t);save();disparar(x)}})}
$('alOn').addEventListener('change',()=>{if($('alOn').checked){beep();try{window.Notification&&Notification.requestPermission&&Notification.requestPermission()}catch(e){}}save()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){alarmas();timeline()}});

/* ===== Exportar a calendario (.ics, alarma a la hora exacta, repetición diaria) ===== */
function exportIcs(){
 const S=slots().filter(x=>x.on);if(!S.length){modal('Sin alarmas','Activa al menos una toma.');return}
 const d=new Date(),ymd=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'),st=d.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
 const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HidraMetric//ES','CALSCALE:GREGORIAN'];
 S.forEach(x=>{const k=x.t.replace(':','');L.push('BEGIN:VEVENT','UID:hm-'+k+'-'+ymd+'@hidrametric','DTSTAMP:'+st,'DTSTART:'+ymd+'T'+k+'00','DURATION:PT5M','RRULE:FREQ=DAILY','SUMMARY:💧 Tomar '+x.ml+' ml de agua','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Hora de hidratarte','TRIGGER:PT0M','END:VALARM','END:VEVENT')});
 if(typeof icsExtra==='function')L.push(...icsExtra(ymd,st));L.push('END:VCALENDAR');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar;charset=utf-8'}));a.download='hidrametric-alarmas.ics';document.body.appendChild(a);a.click();a.remove()}
$('icsBtn').onclick=exportIcs;

/* ===== Navegación, menú y compartir ===== */
const VIEWS=['home','tomas','alarmas','perfil','calorias','base','acerca','libro'];
function go(v){VIEWS.forEach(x=>$('v-'+x).hidden=x!==v);document.querySelectorAll('nav.bot [data-go]').forEach(b=>b.classList.toggle('act',b.dataset.go===v));$('drawer').classList.remove('on');scrollTo(0,0);if(typeof onView==='function')onView(v)}
$('menuBtn').onclick=()=>$('drawer').classList.add('on');$('scrim').onclick=()=>$('drawer').classList.remove('on');
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go);if(e.target.closest('[data-share]')){$('drawer').classList.remove('on');compartir()}});
async function compartir(){const d={title:'HidraMetric',text:'HidraMetric: planificador de hidratación basado en evidencia.',url:location.href};
 try{if(navigator.share){await navigator.share(d);return}await navigator.clipboard.writeText(d.url);modal('Enlace copiado','El enlace de la app se copió al portapapeles.')}
 catch(e){if(e.name!=='AbortError')modal('Compartir HidraMetric','Copia este enlace:<br><b style="word-break:break-all">'+d.url+'</b>')}}
function renderCal(){if(!perfil){$('calBox').innerHTML='<p class="note">Completa el perfil.</p>';return}
 const b=10*+perfil.peso+6.25*+perfil.estatura-5*+perfil.edad+(perfil.sexo==='h'?5:-161);
 $('calBox').innerHTML='<table><tr><td>Metabolismo basal (BMR)</td><td>'+Math.round(b)+' kcal</td></tr>'+[['Sedentario',1.2],['Ligero',1.375],['Moderado',1.55],['Intenso',1.725]].map(a=>'<tr><td>Gasto total · '+a[0]+'</td><td>'+Math.round(b*a[1])+' kcal</td></tr>').join('')+'</table>'}
function reloj(){const n=new Date();let h=n.getHours();const ap=h>=12?'PM':'AM';h=h%12||12;
 $('clock').textContent=String(h).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0')+' '+ap;
 if(log.fecha!==hoy()){log={fecha:hoy(),items:[]};save();render()}}

['sexo','edad','estatura','peso','act','clima','estado','desp','dorm'].forEach(k=>$(k).addEventListener('input',calcular));
$('sexo').addEventListener('change',()=>{if($('sexo').value==='h')$('estado').value='0'});
load();calcular();reloj();setInterval(reloj,1000);setInterval(timeline,60000);setInterval(alarmas,15000);

/* ===== PWA: instalación y modo sin conexión ===== */
let dip=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$('installBtn').hidden=false});
$('installBtn').onclick=async()=>{if(!dip)return;$('drawer').classList.remove('on');dip.prompt();await dip.userChoice;dip=null;$('installBtn').hidden=true};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
