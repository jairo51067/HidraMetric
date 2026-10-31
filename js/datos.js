/* ===== Integración del almacén con la app: carga del día, migración y copia de seguridad ===== */
async function cargarHoy(){
 const ev=await ALM.tomasDe(ALM.fecha(Date.now()));
 log.fecha=hoy();log.items=ev.map(e=>({id:e.id,t:e.t,ml:e.ml,tipo:e.tipo}));render();
}
async function iniciarAlmacen(){
 try{
  await ALM.iniciar();
  if(LEGACY){ /* migración desde el formato anterior (registros del día en localStorage); ids deterministas = idempotente */
   const L=LEGACY.items.map(i=>({id:'L'+i.t+'-'+i.ml+'-'+(i.tipo||'agua'),t:i.t,ml:i.ml,tipo:i.tipo||'agua',c:cuenta(i)?1:0}));
   await ALM.registrarVarios(L,meta);LEGACY=null;save();
  }
  await cargarHoy();ALM.onCambio(cargarHoy);setTimeout(()=>ALM.mantenimiento().catch(()=>{}),4000);
 }catch(e){
  if(LEGACY&&LEGACY.fecha===hoy())log.items=LEGACY.items.slice();
  render();modal('Historial no disponible','No se pudo abrir el almacenamiento de este dispositivo. Puedes seguir registrando, pero el historial podría no guardarse.');
 }
 pintarInfo();
}
async function pintarInfo(){
 const b=$('stInfo');if(!b)return;
 try{const i=await ALM.info(),mb=v=>v==null?'n/d':(v/1048576).toFixed(v<1048576?2:1)+' MB';
  b.textContent='Almacén: '+(i.modo==='idb'?'IndexedDB':'modo de respaldo (localStorage)')+' · '+i.tomas+' tomas recientes · '+i.dias+' días resumidos · '+i.meses+' meses archivados · uso del sitio: '+mb(i.usado)+' de '+mb(i.cuota)+(i.persistente?' · protegido contra borrado automático':'');
 }catch(e){b.textContent='No se pudo leer el estado del almacenamiento.'}
}
$('stExp').onclick=async()=>{
 try{const o=await ALM.exportar(),a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='hidrametric-historial-'+ALM.fecha(Date.now())+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 }catch(e){modal('No se pudo exportar','Inténtalo de nuevo.')}
};
$('stImp').onclick=()=>$('stIn').click();
$('stIn').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>5242880)return modal('Archivo demasiado grande','El archivo supera 5 MB.');
 const r=new FileReader();
 r.onload=async()=>{try{const n=await ALM.importar(JSON.parse(r.result));await cargarHoy();pintarInfo();
   modal('Copia importada',n.tomas+' tomas, '+n.dias+' días y '+n.meses+' meses incorporados. Lo que ya existía no se duplica.')}
  catch(err){modal('No se pudo importar',err instanceof SyntaxError?'El archivo no es un JSON válido.':(err.message||'El archivo no es una copia válida de HidraMetric.'))}};
 r.readAsText(f);
});
iniciarAlmacen();
