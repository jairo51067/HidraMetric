/* ===== Historial de consumo: día, semana y mes (consultas del almacén ALM) =====
   Una sola tubería: hCargar() lee solo el periodo visible (≤ 31 resúmenes o las tomas de un día) y hHtml() lo dibuja. */
const HM={modo:'semana',ref:null,tk:0};
const H_DIAS=['L','M','X','J','V','S','D'];
const hP2=n=>String(n).padStart(2,'0');
const hFecha=d=>{const [y,m,k]=d.split('-').map(Number);return new Date(y,m-1,k,12)};
const hL=ml=>ml>=1000?(ml/1000).toLocaleString('es',{minimumFractionDigits:1,maximumFractionDigits:2})+' L':Math.round(ml)+' ml';
const hCorto=ml=>ml>=1000?(ml/1000).toFixed(1).replace('.',','):String(Math.round(ml));
const hEst=(ml,mt)=>ml<=0?'vacio':!mt?'bajo':ml>=mt?'ok':ml>=mt*.5?'med':'bajo';
const hCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const hTipo=k=>TIPOS[k]||[k,'🥤',1];
const hMt=(x,P)=>x.d===P.hoyD?meta:x.meta;
function hEtiqueta(P){
 const f=(d,o)=>hFecha(d).toLocaleDateString('es',o);
 if(P.modo==='dia')return hCap(f(P.desde,{weekday:'long',day:'numeric',month:'long'}));
 if(P.modo==='semana')return f(P.desde,{day:'numeric',month:'short'})+' – '+f(P.hasta,{day:'numeric',month:'short'});
 return hCap(f(P.desde,{month:'long',year:'numeric'}));
}
async function hCargar(){
 const hoyD=ALM.fecha(Date.now());
 if(HM.modo==='dia'){const [d,t]=await Promise.all([ALM.dia(HM.ref),ALM.tomasDe(HM.ref)]);return{modo:'dia',desde:HM.ref,hasta:HM.ref,dias:[d],tomas:t,ml:d.ml,n:d.n,porTipo:d.porTipo,hoyD}}
 if(HM.modo==='semana')return{...await ALM.semana(HM.ref),modo:'semana',hoyD};
 return{...await ALM.mes(HM.ref.slice(0,7)),modo:'mes',hoyD};
}
function hResumen(P){
 if(P.modo==='dia'){const x=P.dias[0],mt=hMt(x,P),p=mt?Math.round(x.ml/mt*100):0;
  return '<div class="hsum"><div class="big">'+hL(x.ml)+'</div><small>'+(mt?p+' % de tu meta de '+hL(mt):'Sin meta registrada para este día')+'</small><div class="chs"><span>Tomas <b>'+x.n+'</b></span></div></div>'}
 const cum=P.dias?P.dias.filter(x=>{const m=hMt(x,P);return m>0&&x.ml>=m}).length:P.cumplidos;
 return '<div class="hsum"><div class="big">'+hL(P.ml)+'</div><small>Total del periodo</small><div class="chs"><span>Promedio <b>'+hL(P.promedio)+'</b>/día</span><span>Cumplidos <b>'+cum+'</b></span><span>Con registro <b>'+P.diasConDatos+'</b></span></div></div>';
}
function hGrafico(P){
 if(P.modo==='dia'){
  const x=P.dias[0],mt=hMt(x,P),C=2*Math.PI*54,ra=mt?Math.min(x.ml/mt,1):0;
  return '<svg class="ring" viewBox="0 0 140 140" role="img" aria-label="'+hL(x.ml)+(mt?' de '+hL(mt):'')+'"><circle class="rt" cx="70" cy="70" r="54"/><circle class="rp s-'+hEst(x.ml,mt)+'" cx="70" cy="70" r="54" stroke-dasharray="'+(C*ra).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 70 70)"/><text class="rn" x="70" y="'+(mt?66:76)+'">'+(mt?Math.round(x.ml/mt*100)+' %':hL(x.ml))+'</text>'+(mt?'<text class="rs" x="70" y="86">'+hL(x.ml)+'</text>':'')+'</svg>';
 }
 const lg='<div class="lg"><span class="s-ok"><i></i>Cumplido</span><span class="s-med"><i></i>50–99 %</span><span class="s-bajo"><i></i>1–49 %</span></div>';
 if(P.modo==='semana'){
  const mx=Math.max(1,...P.dias.map(x=>Math.max(x.ml,hMt(x,P)||0)));
  return '<div class="wk">'+P.dias.map((x,i)=>{const mt=hMt(x,P),fut=x.d>P.hoyD;
   return '<button class="wc" data-hd="'+x.d+'"'+(fut?' disabled':'')+' aria-label="'+hCap(hFecha(x.d).toLocaleDateString('es',{weekday:'long'}))+': '+hL(x.ml)+'"><i class="wv">'+(x.ml?hCorto(x.ml):'')+'</i><div class="wt"><div class="wb s-'+hEst(x.ml,mt)+'" style="height:'+(x.ml/mx*100).toFixed(1)+'%"></div>'+(mt?'<u style="bottom:'+(mt/mx*100).toFixed(1)+'%"></u>':'')+'</div><b'+(x.d===P.hoyD?' class="hoy"':'')+'>'+H_DIAS[i]+'</b></button>'}).join('')+'</div>'+lg+'<p class="note" style="margin:8px 0 0">La línea punteada marca la meta de cada día. Toca una barra para ver ese día.</p>';
 }
 if(P.origen==='meses')return '<p class="note" style="margin:0">Este mes está archivado: se conservan el total, los días con registro y el desglose por bebida, pero no el detalle de cada día.</p>';
 const pre=(hFecha(P.desde).getDay()+6)%7;
 return '<div class="cal7">'+H_DIAS.map(d=>'<div class="dn">'+d+'</div>').join('')+'<span></span>'.repeat(pre)+P.dias.map((x,i)=>{const fut=x.d>P.hoyD;
  return '<button class="hc s-'+hEst(x.ml,hMt(x,P))+(x.d===P.hoyD?' hoy':'')+(fut?' fut':'')+'" data-hd="'+x.d+'"'+(fut?' disabled':'')+' aria-label="Día '+(i+1)+': '+hL(x.ml)+'">'+(i+1)+'</button>'}).join('')+'</div>'+lg;
}
function hDesglose(P){
 const e=Object.entries(P.porTipo||{}).sort((a,b)=>b[1]-a[1]);
 if(!e.length)return '<p class="note" style="margin:0">Sin registros en este periodo.</p>';
 const mx=e[0][1];
 return e.map(([k,v])=>{const T=hTipo(k);return '<div class="tr"><span class="te">'+T[1]+'</span><span class="tn">'+T[0]+(T[2]?'':'<em>no suma</em>')+'</span><div class="bar"><i style="width:'+(v/mx*100).toFixed(1)+'%"></i></div><b>'+hL(v)+'</b></div>'}).join('');
}
function hDetalle(P){
 if(P.modo==='dia'){
  if(!P.tomas.length)return '<p class="note" style="margin:0">'+(P.n?'El detalle de cada toma se conserva 90 días; de este día solo queda el resumen.':'No hay tomas registradas este día.')+'</p>';
  return P.tomas.map(t=>{const T=hTipo(t.tipo),d=new Date(t.t);return '<div class="hr"><span class="hh">'+hP2(d.getHours())+':'+hP2(d.getMinutes())+'</span><span class="gr">'+T[1]+' '+T[0]+'</span><span class="hm">'+t.ml+' ml</span>'+(T[2]?'':'<em>no suma</em>')+'</div>'}).join('');
 }
 if(P.modo==='semana')return P.dias.map(x=>{const mt=hMt(x,P),fut=x.d>P.hoyD,
   tx=fut?'—':!x.ml?'Sin registro':mt&&x.ml>=mt?'Cumplido':mt?Math.round(x.ml/mt*100)+' %':'Registrado';
  return '<button class="dr" data-hd="'+x.d+'"'+(fut?' disabled':'')+'><span>'+hCap(hFecha(x.d).toLocaleDateString('es',{weekday:'long',day:'numeric'}))+'</span><b>'+hL(x.ml)+'</b><em class="chip s-'+hEst(x.ml,mt)+'">'+tx+'</em></button>'}).join('');
 if(P.origen==='meses')return '<p class="note" style="margin:0">Sin detalle diario para meses archivados.</p>';
 const con=P.dias.filter(x=>x.ml>0),mejor=con.slice().sort((a,b)=>b.ml-a.ml)[0];
 let racha=0,act=0;P.dias.forEach(x=>{const m=hMt(x,P);if(m>0&&x.ml>=m){act++;racha=Math.max(racha,act)}else act=0});
 return '<div class="chs" style="justify-content:flex-start"><span>Mejor día <b>'+(mejor?hFecha(mejor.d).toLocaleDateString('es',{day:'numeric',month:'short'})+' · '+hL(mejor.ml):'—')+'</b></span><span>Racha de cumplidos <b>'+racha+'</b></span><span>Sin registro <b>'+(P.dias.filter(x=>x.d<=P.hoyD).length-con.length)+'</b></span></div>';
}
function hHtml(P){
 const sig=P.modo==='dia'?P.desde>=P.hoyD:P.modo==='semana'?P.hasta>=P.hoyD:P.desde.slice(0,7)>=P.hoyD.slice(0,7);
 const tit={dia:'Progreso del día',semana:'Consumo por día',mes:'Calendario de cumplimiento'}[P.modo];
 return '<div class="seg" role="tablist">'+[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([k,t])=>'<button role="tab" aria-selected="'+(HM.modo===k)+'" class="'+(HM.modo===k?'on':'')+'" data-hm="'+k+'">'+t+'</button>').join('')+'</div>'+
 '<div class="hnav"><button data-hn="-1" aria-label="Periodo anterior"><svg class="ic" aria-hidden="true"><use href="#i-chev-l"/></svg></button><b>'+hEtiqueta(P)+'</b><button data-hn="1" aria-label="Periodo siguiente"'+(sig?' disabled':'')+'><svg class="ic" aria-hidden="true"><use href="#i-chev-r"/></svg></button></div>'+
 '<section class="ins" style="margin-top:0"><h3>Resumen</h3>'+hResumen(P)+'</section>'+
 '<section class="ins"><h3>'+tit+'</h3>'+hGrafico(P)+'</section>'+
 '<section class="ins"><h3>Por tipo de bebida</h3>'+hDesglose(P)+'</section>'+
 '<section class="ins"><h3>Detalle</h3>'+hDetalle(P)+'</section>';
}
async function hPintar(){
 const tk=++HM.tk;
 try{const P=await hCargar();if(tk!==HM.tk)return;$('historialBox').innerHTML=hHtml(P)}
 catch(e){$('historialBox').innerHTML='<p class="note">No se pudo leer el historial de este dispositivo.</p>'}
}
function hMover(dir){
 const hoy=ALM.fecha(Date.now());let r;
 if(HM.modo==='dia')r=ALM.sumar(HM.ref,dir);else if(HM.modo==='semana')r=ALM.sumar(HM.ref,7*dir);
 else{const [y,m]=HM.ref.split('-').map(Number);r=ALM.fecha(new Date(y,m-1+dir,1,12))}
 HM.ref=r>hoy?hoy:r;
}
function abrirHistorial(){HM.ref=ALM.fecha(Date.now());hPintar()}
let hTm=0;
function refrescarHistorial(){if($('v-historial').hidden)return;clearTimeout(hTm);hTm=setTimeout(hPintar,150)}
$('historialBox').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,hoy=ALM.fecha(Date.now());
 if(d.hm){HM.modo=d.hm;if(HM.ref.slice(0,7)===hoy.slice(0,7))HM.ref=hoy;return hPintar()}
 if(d.hn){hMover(+d.hn);return hPintar()}
 if(d.hd){HM.modo='dia';HM.ref=d.hd;scrollTo(0,0);hPintar()}
});
