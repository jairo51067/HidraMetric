/* ===== Tema claro/oscuro automático =====
   Claro desde el amanecer y oscuro desde el atardecer, calculados en el propio dispositivo (sin red).
   Se carga en <head> sin defer para aplicar el tema antes del primer dibujo. Cambio manual: el botón de la barra
   superior vale hasta el próximo amanecer o atardecer; en Perfil se puede fijar Claro u Oscuro de forma permanente. */
const TEMA=(()=>{
 const K='hidrametric.tema.v1',KW='hidrametric.clima.v1';
 const S={modo:'auto',forzar:null};
 try{const o=JSON.parse(localStorage.getItem(K)||'null');
  if(o&&['auto','claro','oscuro'].includes(o.modo)){S.modo=o.modo;
   if(o.forzar&&(o.forzar.tema==='light'||o.forzar.tema==='dark')&&+o.forzar.hasta>0)S.forzar={tema:o.forzar.tema,hasta:+o.forzar.hasta}}}catch(e){}
 const guardar=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
 const rad=Math.PI/180,sen=x=>Math.sin(x*rad);
 const ubicacion=()=>{try{const w=JSON.parse(localStorage.getItem(KW)||'null');
  if(w&&w.lat!=null&&w.lon!=null&&Number.isFinite(+w.lat)&&Number.isFinite(+w.lon))return[+w.lat,+w.lon]}catch(e){}return null};
 /* Ecuación del amanecer (mediodía solar medio, ecuación del centro, declinación y ángulo horario) */
 function solar(f,lat,lon){
  const noon=new Date(f.getFullYear(),f.getMonth(),f.getDate(),12),jd=noon.getTime()/864e5+2440587.5;
  const n=Math.round(jd-2451545+lon/360),js=n-lon/360;
  const M=(357.5291+0.98560028*js)%360,C=1.9148*sen(M)+0.02*sen(2*M)+0.0003*sen(3*M);
  const lam=(M+C+180+102.9372)%360,jt=2451545+js+0.0053*sen(M)-0.0069*sen(2*lam);
  const sd=sen(lam)*sen(23.4397),cd=Math.sqrt(1-sd*sd),c=(sen(-0.833)-sen(lat)*sd)/(Math.cos(lat*rad)*cd);
  if(!(c>=-1&&c<=1))return null;
  const w=Math.acos(c)/rad/360,aD=j=>new Date((j-2440587.5)*864e5);
  return{sale:aD(jt-w),pone:aD(jt+w)};
 }
 /* Amanecer y atardecer del día local; si no hay ubicación (o el caso es polar) se usa 6:00 a 18:00 */
 function dia(f){
  const u=ubicacion();
  if(u){const s=solar(f,u[0],u[1]);
   if(s&&s.pone>s.sale&&s.sale.getDate()===f.getDate()&&s.pone.getDate()===f.getDate())return{...s,origen:'ubicacion'}}
  return{sale:new Date(f.getFullYear(),f.getMonth(),f.getDate(),6),pone:new Date(f.getFullYear(),f.getMonth(),f.getDate(),18),origen:'horario'};
 }
 const esDeDia=a=>{const d=dia(a);return a>=d.sale&&a<d.pone};
 function proximoCambio(a){
  const d=dia(a);if(a<d.sale)return d.sale;if(a<d.pone)return d.pone;
  return dia(new Date(a.getFullYear(),a.getMonth(),a.getDate()+1,12)).sale;
 }
 function efectivo(a){
  a=a||new Date();
  if(S.modo==='claro')return'light';if(S.modo==='oscuro')return'dark';
  if(S.forzar){if(a.getTime()<S.forzar.hasta)return S.forzar.tema;S.forzar=null;guardar()}
  return esDeDia(a)?'light':'dark';
 }
 const hh=d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
 function info(){
  const a=new Date(),d=dia(a);
  if(S.modo!=='auto')return'Tema fijo en '+(S.modo==='claro'?'claro':'oscuro')+'. Elige «Automático» para que siga la luz del día.';
  return(S.forzar&&a.getTime()<S.forzar.hasta?'Cambio manual activo hasta las '+hh(new Date(S.forzar.hasta))+'. ':'Ahora: tema '+(efectivo(a)==='light'?'claro':'oscuro')+'. ')+
   'Amanece a las '+hh(d.sale)+' y anochece a las '+hh(d.pone)+(d.origen==='ubicacion'?' (calculado en tu dispositivo con tu ubicación).':' (horario estándar; activa el clima en la barra superior para ajustarlo a tu ubicación).');
 }
 function pintar(){
  const t=document.documentElement.dataset.theme,b=document.getElementById('themeBtn');
  if(b){b.innerHTML='<svg class="ic" aria-hidden="true"><use href="#i-'+(t==='light'?'moon':'sun')+'"/></svg>';b.setAttribute('aria-label',t==='light'?'Cambiar a tema oscuro':'Cambiar a tema claro')}
  const g=document.getElementById('temaSeg');
  if(g)g.querySelectorAll('[data-tema]').forEach(x=>{const on=x.dataset.tema===S.modo;x.classList.toggle('on',on);x.setAttribute('aria-checked',String(on))});
  const i=document.getElementById('temaInfo');if(i)i.textContent=info();
 }
 function aplicar(){
  const t=efectivo(),h=document.documentElement;
  if(h.dataset.theme!==t)h.dataset.theme=t;
  const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',t==='dark'?'#0b1329':'#0284c7');
  pintar();return t;
 }
 function alternar(){
  const nuevo=efectivo()==='light'?'dark':'light';
  if(S.modo==='auto')S.forzar={tema:nuevo,hasta:proximoCambio(new Date()).getTime()};
  else S.modo=nuevo==='light'?'claro':'oscuro';
  guardar();return aplicar();
 }
 function poner(modo){if(!['auto','claro','oscuro'].includes(modo))return;S.modo=modo;S.forzar=null;guardar();return aplicar()}
 aplicar();
 document.addEventListener('DOMContentLoaded',pintar);
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#temaSeg [data-tema]');if(b)poner(b.dataset.tema)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)aplicar()});
 setInterval(aplicar,30000);
 return{aplicar,alternar,poner,efectivo,dia,solar,proximoCambio,pintar,modo:()=>S.modo,estado:()=>({modo:S.modo,forzar:S.forzar})};
})();
