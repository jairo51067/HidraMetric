/* ===== Clima: temperatura y estado actuales (Open-Meteo; solo con permiso de ubicación) ===== */
const WK='hidrametric.clima.v1';
let WX={lat:null,lon:null,t:null,code:null,dia:1,ts:0};
try{Object.assign(WX,JSON.parse(localStorage.getItem(WK)||'{}'))}catch(e){}
const wxSave=()=>{try{localStorage.setItem(WK,JSON.stringify(WX))}catch(e){}};
/* Códigos WMO de Open-Meteo -> icono y descripción */
const WMO=(c,d)=>c===0?[d?'☀️':'🌙','Despejado']:c===1?[d?'🌤️':'🌙','Mayormente despejado']:c===2?['⛅','Parcialmente nublado']:c===3?['☁️','Nublado']:c<=48?['🌫️','Niebla']:c<=57?['🌦️','Llovizna']:c<=67?['🌧️','Lluvia']:c<=77?['🌨️','Nieve']:c<=82?['🌦️','Chubascos']:c<=86?['🌨️','Chubascos de nieve']:['⛈️','Tormenta'];
function pintarWx(){
 const b=$('wx');
 if(WX.t===null){b.textContent='Ver clima';b.title='Mostrar la temperatura de tu zona';return}
 const w=WMO(WX.code,WX.dia);b.textContent=w[0]+' '+Math.round(WX.t)+'°C';b.title=w[1]+' · toca para ver detalles';
}
async function cargarWx(){
 if(WX.lat===null)return;
 try{
  const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude='+WX.lat+'&longitude='+WX.lon+'&current=temperature_2m,weather_code,is_day&timezone=auto');
  if(!r.ok)throw new Error('http '+r.status);
  const c=(await r.json()).current;
  WX.t=c.temperature_2m;WX.code=c.weather_code;WX.dia=c.is_day;WX.ts=Date.now();wxSave();pintarWx();
 }catch(e){/* sin conexión: se conserva el último dato */}
}
function pedirUbicacion(){
 if(!navigator.geolocation){modal('Ubicación no disponible','Tu navegador no permite obtener la ubicación.');return}
 navigator.geolocation.getCurrentPosition(
  p=>{WX.lat=Math.round(p.coords.latitude*100)/100;WX.lon=Math.round(p.coords.longitude*100)/100;wxSave();cargarWx()},
  ()=>modal('No se pudo obtener la ubicación','Revisa el permiso de ubicación del navegador para esta página y vuelve a intentarlo.'),
  {timeout:10000,maximumAge:600000});
}
$('wx').onclick=()=>{
 if(WX.lat===null||WX.t===null)return modal('Mostrar el clima','Para mostrar la temperatura y el clima de tu zona, HidraMetric usa tu ubicación aproximada (redondeada a unos 1 km) y la envía al servicio gratuito Open-Meteo para consultar el clima actual. No se guarda en ningún servidor de HidraMetric: queda solo en este dispositivo y puedes quitarla cuando quieras.<br><br><button class="btn" style="width:100%" id="wxOk">Permitir ubicación</button>','Ahora no');
 const w=WMO(WX.code,WX.dia),h=new Date(WX.ts);
 modal(w[0]+' '+Math.round(WX.t)+' °C · '+w[1],'Actualizado a las '+String(h.getHours()).padStart(2,'0')+':'+String(h.getMinutes()).padStart(2,'0')+'. Datos de Open-Meteo.<br><br><button class="btn" style="width:100%" id="wxUp">Actualizar ahora</button><br><br><button class="btn o" style="width:100%" id="wxOff">Quitar el clima</button>','Cerrar');
};
document.addEventListener('click',e=>{
 const id=e.target.id;if(id!=='wxOk'&&id!=='wxUp'&&id!=='wxOff')return;
 $('ov').classList.remove('on');
 if(id==='wxOff'){WX={lat:null,lon:null,t:null,code:null,dia:1,ts:0};wxSave();pintarWx()}else pedirUbicacion();
});
const wxViejo=()=>WX.lat!==null&&Date.now()-WX.ts>1800000;
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wxViejo())cargarWx()});
setInterval(()=>{if(wxViejo())cargarWx()},300000);
pintarWx();if(wxViejo())cargarWx();
