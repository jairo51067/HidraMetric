/* ===== Guía de medidas de líquidos (infografía de referencia) ===== */
const FL_US=29.5735,FL_UK=28.4131,TAZA_US=236.588;
const ESCALA=[['1 L',1000],['750 ml',750],['500 ml',500],['250 ml',250],['100 ml',100]];
const FORMAS={
 cuchara:'<ellipse cx="24" cy="14" rx="7" ry="9"/><path d="M24 23v21"/>',
 copa:'<path d="M15 6h18c0 11-3 17-9 17s-9-6-9-17z"/><path d="M24 23v17M16 42h16"/>',
 taza:'<path d="M9 14h24v14a9 9 0 0 1-9 9h-6a9 9 0 0 1-9-9z"/><path d="M33 18h3a5 5 0 0 1 0 10h-3"/>',
 vaso:'<path d="M13 8h22l-2.5 31a3 3 0 0 1-3 2.7h-11a3 3 0 0 1-3-2.7z"/><path d="M14 20c4-2 7 2 10 0s7-2 10 0"/>',
 lata:'<rect x="14" y="8" width="20" height="32" rx="3"/><path d="M14 14h20M14 34h20"/>',
 botella:'<path d="M21 5h6v6c0 3 6 5 6 11v18a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V22c0-6 6-8 6-11z"/>'};
const HOGAR=[
 {n:'Cucharita',ml:5,f:'cuchara',nota:'1 cdta'},{n:'Cuchara sopera',ml:15,f:'cuchara',nota:'1 cda'},
 {n:'Chupito',ml:30,f:'copa',nota:'varía entre 20 y 44 ml'},{n:'Copa de vino',ml:150,f:'copa',nota:'ración de 125 a 175 ml'},
 {n:'Taza',ml:240,f:'taza',nota:'EE. UU. 236,6 · métrica 250'},{n:'Vaso',ml:250,f:'vaso',nota:'referencia de la app'},
 {n:'Lata',ml:330,f:'lata',nota:'EE. UU. 355 ml'},{n:'Botella',ml:500,f:'botella',nota:'formato personal'},
 {n:'Botella grande',ml:1000,f:'botella',nota:'1 litro'}];
const UNI=[['Onza líquida (EE. UU.)',FL_US],['Onza líquida (Reino Unido)',FL_UK],['Cucharadita (EE. UU.)',4.92892],['Cucharada (EE. UU.)',14.7868],
 ['Taza (EE. UU.) · 8 fl oz',TAZA_US],['Pinta (EE. UU.) · 16 fl oz',473.176],['Pinta (Reino Unido) · 20 fl oz',568.261],['Cuarto (EE. UU.) · 32 fl oz',946.353],['Galón (EE. UU.) · 128 fl oz',3785.41]];
const CONV=[['ml','Mililitros (ml)',1],['l','Litros (L)',1000],['ozus','Onzas líquidas EE. UU.',FL_US],['ozuk','Onzas líquidas Reino Unido',FL_UK],['taza','Tazas EE. UU.',TAZA_US],['vaso','Vasos de 250 ml',250],['bot','Botellas de 500 ml',500]];
const fmM=n=>n.toLocaleString('es',{maximumFractionDigits:n<10?2:1});
const mlTxt=ml=>ml>=1000?(ml/1000).toLocaleString('es',{maximumFractionDigits:3})+' L':fmM(ml)+' ml';

function dibujarMedidas(){
 $('medidasBox').innerHTML='<article class="inf">'+
 '<div class="infh"><small>Guía de referencia</small><h2>Medidas de líquidos</h2><p>Para registrar con precisión lo que bebes. Las medidas del hogar son aproximadas: un vaso o una taza reales pueden variar entre 200 y 350 ml.</p></div>'+
 '<section class="ins"><h3>1 · Escala métrica</h3><div class="eq">1 L = 10 dl = 100 cl = 1000 ml</div>'+ESCALA.map(([t,ml])=>'<div class="sb"><b>'+t+'</b><div class="bar"><i style="width:'+ml/10+'%"></i></div></div>').join('')+'</section>'+
 '<section class="ins"><h3>2 · Medidas del hogar</h3><div class="mg">'+HOGAR.map(h=>'<div class="mc2"><svg viewBox="0 0 48 48" aria-hidden="true">'+FORMAS[h.f]+'</svg><b>'+h.n+'</b><div class="bar"><i style="width:'+Math.max(2,h.ml/10)+'%"></i></div><em>'+mlTxt(h.ml)+'</em><span>≈ '+fmM(h.ml/FL_US)+' fl oz · '+h.nota+'</span></div>').join('')+'</div></section>'+
 '<section class="ins"><h3>3 · Sistemas anglosajones</h3><div class="tbw"><table class="tb">'+UNI.map(u=>'<tr><td>'+u[0]+'</td><td>'+mlTxt(u[1])+'</td></tr>').join('')+'</table></div><p class="note">fl oz = onza líquida. Las etiquetas de EE. UU. suelen redondear la taza a 240 ml.</p></section>'+
 '<section class="ins"><h3>4 · Conversor</h3><div class="cv"><input id="cvN" type="number" min="0" step="any" value="250" aria-label="Cantidad"><select id="cvU" aria-label="Unidad">'+CONV.map(c=>'<option value="'+c[0]+'">'+c[1]+'</option>').join('')+'</select></div><div class="cvo" id="cvOut"></div></section>'+
 '<section class="ins"><h3>5 · Tu meta en medidas</h3><div id="inMeta"></div></section></article>';
 $('cvN').addEventListener('input',convertir);$('cvU').addEventListener('change',convertir);convertir();pintarMedidas();
}
function convertir(){
 const v=parseFloat($('cvN').value),u=CONV.find(c=>c[0]===$('cvU').value);
 if(!(v>=0)){$('cvOut').textContent='';return}
 const ml=v*u[2];$('cvOut').innerHTML=CONV.filter(c=>c[0]!==u[0]).map(c=>'<div>'+c[1]+'<b>'+fmM(ml/c[2])+'</b></div>').join('');
}
function pintarMedidas(){
 const b=$('inMeta');if(!b)return;
 if(!meta){b.textContent='Completa tu perfil para ver tu meta en medidas.';return}
 const r=meta-total();
 b.innerHTML='<div class="cvo">'+[['Meta del día',mlTxt(meta)],['En vasos de 250 ml',fmM(meta/250)+' vasos'],['En botellas de 500 ml',fmM(meta/500)+' botellas'],['En onzas (EE. UU.)',fmM(meta/FL_US)+' fl oz']].map(x=>'<div>'+x[0]+'<b>'+x[1]+'</b></div>').join('')+'</div>'+
  '<p class="note">'+(r>0?'Te faltan '+mlTxt(r)+' hoy: unos '+fmM(r/250)+' vasos de 250 ml.':'Ya cumpliste tu meta de hoy.')+'</p>';
}
dibujarMedidas();
