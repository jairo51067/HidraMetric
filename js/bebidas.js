/* ===== Registro de bebidas: ventana inferior y lista del día (tipos definidos en app.js) ===== */
const SH={tipo:'agua',txt:'250'};
const pad2=n=>String(n).padStart(2,'0');
const NOTAS={alcohol:'El alcohol se registra, pero no suma a tu meta de líquidos.',sopa:'Se registra como alimento y no suma: su agua ya está contemplada en el ~20 % que EFSA atribuye a los alimentos.'};
$('shTipos').innerHTML=Object.entries(TIPOS).map(([k,v])=>'<button class="chip" data-tipo="'+k+'"><span>'+v[1]+'</span>'+v[0]+'</button>').join('');
function pintarSheet(){
 const t=TIPOS[SH.tipo],nt=NOTAS[SH.tipo];
 $('shAmt').textContent=SH.txt||'0';$('shSub').textContent=t[1]+' '+t[0]+(t[2]?'':' · no suma a la meta');
 document.querySelectorAll('#shTipos .chip').forEach(c=>c.classList.toggle('on',c.dataset.tipo===SH.tipo));
 $('shNote').hidden=!nt;$('shNote').textContent=nt||'';$('shErr').style.display='none';
}
function abrirSheet(){const n=new Date();SH.tipo='agua';SH.txt='250';$('shTime').value=pad2(n.getHours())+':'+pad2(n.getMinutes());pintarSheet();$('sheet').classList.add('on')}
const cerrarSheet=()=>$('sheet').classList.remove('on');
function errSheet(m){const e=$('shErr');e.textContent=m;e.style.display='block'}
$('customBtn').onclick=abrirSheet;$('shX').onclick=cerrarSheet;
$('sheet').addEventListener('click',e=>{
 if(e.target===$('sheet'))return cerrarSheet();
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.tipo){SH.tipo=d.tipo;return pintarSheet()}
 if(d.q){SH.txt=d.q;return pintarSheet()}
 if(d.k!==undefined){
  if(d.k==='<')SH.txt=SH.txt.slice(0,-1);
  else{const n=(SH.txt+d.k).replace(/^0+/,'');if(n.length<=4)SH.txt=n}
  return pintarSheet();
 }
 if(b.id==='shAdd'){
  const ml=parseInt(SH.txt,10);if(!(ml>=1&&ml<=1500))return errSheet('Indica un volumen entre 1 y 1500 ml.');
  const ts=new Date(),v=$('shTime').value;if(v){const [h,m]=v.split(':');ts.setHours(+h,+m,0,0)}
  if(ts.getTime()>Date.now()+60000)return errSheet('La hora no puede ser futura.');
  cerrarSheet();add(ml,SH.tipo,ts.getTime());
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarSheet()});

function renderHoy(){
 const L=$('hoyList');if(!L)return;
 const it=log.items.map((x,i)=>[x,i]).sort((a,b)=>b[0].t-a[0].t);
 if(!it.length){L.innerHTML='<p class="note" style="margin:0">Aún no has registrado nada hoy.</p>';return}
 L.innerHTML=it.slice(0,8).map(([x,i])=>{const T=TIPOS[x.tipo||'agua']||TIPOS.agua,d=new Date(x.t);
  return '<div class="hr"><span class="hh">'+pad2(d.getHours())+':'+pad2(d.getMinutes())+'</span><span class="gr">'+T[1]+' '+T[0]+'</span><span class="hm">'+x.ml+' ml</span>'+(T[2]?'':'<em>no suma</em>')+'<button data-rm="'+i+'" aria-label="Quitar registro">✕</button></div>'}).join('')
  +(it.length>8?'<p class="note" style="margin:8px 0 0">+ '+(it.length-8)+' registros anteriores</p>':'');
}
$('hoyList').addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(!b)return;log.items.splice(+b.dataset.rm,1);save();render()});
renderHoy();
