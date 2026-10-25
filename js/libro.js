/* ===== Libro didáctico: beneficios de la hidratación (datos en data/beneficios_hidratacion.json) ===== */
const LK='hidrametric.libro.v1',ROM=['I','II','III','IV','V','VI','VII','VIII'];
let LIB=null,LP={v:{},last:null,seen:false},cur=null,pend=null,tx=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{Object.assign(LP,JSON.parse(localStorage.getItem(LK)||'{}'))}catch(e){}
const lpSave=()=>{try{localStorage.setItem(LK,JSON.stringify(LP))}catch(e){}};
const capDone=c=>(LP.v[c.id]||[]).length>=c.puntos.length;

function indice(){
 cur=null;LP.seen=true;lpSave();$('nwDot').hidden=true;
 const C=LIB.categorias,n=C.length,done=C.filter(capDone).length,lc=LP.last&&C.find(c=>c.id===LP.last.c);
 $('libroBox').innerHTML='<article class="libro"><header class="cover"><small>Guía didáctica</small><h2>'+esc(LIB.titulo_general)+'</h2><p>'+esc(LIB.descripcion)+'</p><div class="prog"><div class="mini"><i style="width:'+Math.round(done/n*100)+'%"></i></div><span>'+done+' de '+n+' capítulos leídos</span></div><button class="btn" data-cap="'+(lc?lc.id:C[0].id)+'" data-p="'+(lc?LP.last.p:0)+'">'+(lc?'Continuar lectura':'Empezar a leer')+'</button></header><h3 class="idx">Índice</h3><ol class="toc">'+
 C.map((c,i)=>'<li><button data-cap="'+c.id+'" data-p="0"><b>'+ROM[i]+'</b><span>'+c.icono+' '+esc(c.titulo)+'</span><em>'+c.puntos.length+' pág.'+(capDone(c)?' ✓':'')+'</em></button></li>').join('')+
 '<li><button data-cap="epilogo"><b>✦</b><span>Epílogo</span><em>Conclusión</em></button></li></ol></article>';
}
function leerPag(id,p){
 const C=LIB.categorias,ci=C.findIndex(c=>c.id===id);if(ci<0)return indice();
 const c=C[ci],n=c.puntos.length;p=Math.max(0,Math.min(p,n));cur=id;LP.last={c:id,p};
 if(p<n){const v=LP.v[id]=LP.v[id]||[];if(!v.includes(p))v.push(p)}lpSave();
 const crumb='<nav class="crumb"><button data-idx>← Índice</button><span>Capítulo '+ROM[ci]+' · '+c.icono+'</span></nav>';let pg,ft;
 if(p<n){const t=c.puntos[p];
  pg='<section class="page"><h4>'+esc(c.titulo)+'</h4><h2>'+esc(t.titulo)+'</h2><p class="dc">'+esc(t.detalle)+'</p></section>';
  ft='<footer class="pgnav">'+(p?'<button class="btn o" data-p="'+(p-1)+'">‹ Anterior</button>':'<button class="btn o" data-idx>‹ Índice</button>')+'<span class="dots">'+c.puntos.map((_,i)=>'<i class="'+(i===p?'on':'')+'"></i>').join('')+'</span><button class="btn" data-p="'+(p+1)+'">'+(p+1<n?'Siguiente ›':'Terminar ›')+'</button></footer><div class="pgn">Página '+(p+1)+' de '+n+'</div>'}
 else{const nx=C[ci+1];
  pg='<section class="page"><h4>Fin del capítulo '+ROM[ci]+'</h4><h2>✓ '+esc(c.titulo)+'</h2><p>Ideas clave que acabas de leer:</p><ul>'+c.puntos.map(t=>'<li>'+esc(t.titulo)+'</li>').join('')+'</ul></section>';
  ft='<footer class="pgnav"><button class="btn o" data-p="'+(n-1)+'">‹ Repasar</button>'+(nx?'<button class="btn" data-cap="'+nx.id+'" data-p="0">Capítulo '+ROM[ci+1]+' ›</button>':'<button class="btn" data-cap="epilogo">Epílogo ›</button>')+'</footer>'}
 $('libroBox').innerHTML='<article class="libro">'+crumb+pg+ft+'</article>';scrollTo(0,0);
}
function epilogo(){
 cur=null;
 $('libroBox').innerHTML='<article class="libro"><nav class="crumb"><button data-idx>← Índice</button><span>Epílogo</span></nav><section class="page"><h4>Epílogo</h4><h2>Para llevarte</h2><p class="dc">'+esc(LIB.conclusion)+'</p><p style="font-size:.82rem;color:var(--ink2);font-style:italic">Contenido educativo. La magnitud de los efectos varía entre personas y algunos mecanismos están en estudio; no sustituye el consejo médico.</p></section><footer class="pgnav"><button class="btn o" data-idx>Índice</button><button class="btn" data-go="home">Volver a hidratarme 💧</button></footer></article>';scrollTo(0,0);
}
function abrirLibro(id,p){
 go('libro');
 if(!LIB){pend=[id,p];$('libroBox').innerHTML='<p class="note" style="padding:20px">Cargando el libro…</p>';return}
 if(id==='epilogo')epilogo();else if(id)leerPag(id,p||0);else indice();
}
function teaser(){
 const el=$('teaser');if(!LIB)return;const all=[];LIB.categorias.forEach(c=>c.puntos.forEach((t,i)=>all.push([c,i,t])));
 const d=new Date(),[c,i,t]=all[Math.floor((d-new Date(d.getFullYear(),0,0))/864e5)%all.length];
 const f=t.detalle.split('. ')[0].replace(/\.$/,'')+'.',n=LIB.categorias.length,done=LIB.categorias.filter(capDone).length;
 el.hidden=false;el.dataset.cap=c.id;el.dataset.pp=i;
 el.innerHTML='<h4>📖 Sabías que…</h4><div class="big">'+esc(t.titulo)+'</div><p>'+esc(f.length>150?f.slice(0,147)+'…':f)+'</p><div class="mini"><i style="width:'+Math.round(done/n*100)+'%"></i></div><small><span>Leer más →</span><span>'+done+'/'+n+' capítulos</span></small>';
}
function onView(v){if(v==='libro'&&LIB)indice();if(v==='home')teaser()}
function ruta(){
 const m=location.hash.match(/^#libro-?(.*)$/);if(!m)return;
 try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
 abrirLibro(m[1]||null,0);
}
$('teaser').addEventListener('click',e=>abrirLibro(e.currentTarget.dataset.cap,+e.currentTarget.dataset.pp));
$('libroBox').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.cap==='epilogo')return epilogo();if(d.cap)return leerPag(d.cap,+d.p||0);if(d.p!==undefined)return leerPag(cur,+d.p);if(d.idx!==undefined)indice()});
$('libroBox').addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
$('libroBox').addEventListener('touchend',e=>{if(tx===null||!cur||!LP.last)return;const dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>70)leerPag(cur,LP.last.p+(dx<0?1:-1))});
document.addEventListener('keydown',e=>{if($('v-libro').hidden||!cur||!LP.last)return;if(e.key==='ArrowRight')leerPag(cur,LP.last.p+1);if(e.key==='ArrowLeft')leerPag(cur,LP.last.p-1)});
addEventListener('hashchange',ruta);
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{const u=e.data&&e.data.go;if(u){const h=u.split('#')[1]||'';if(location.hash==='#'+h)ruta();else location.hash=h}});
fetch('data/beneficios_hidratacion.json').then(r=>r.json()).then(j=>{LIB=j;$('nwDot').hidden=LP.seen;teaser();if(pend){const q=pend;pend=null;abrirLibro(q[0],q[1])}}).catch(()=>{});
ruta();
