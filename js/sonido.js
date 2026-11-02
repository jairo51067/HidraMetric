/* ===== Sonidos de logro: Web Audio, sin archivos ni dependencias =====
   Dos momentos, una vez por día cada uno: primera toma del día y meta cumplida (ver add() en app.js). */
const SND=(()=>{
 const K='hidrametric.snd.v1',AC=window.AudioContext||window.webkitAudioContext;
 let on=true,ctx=null,n=0;
 try{const s=JSON.parse(localStorage.getItem(K)||'null');if(s&&s.on===false)on=false}catch(e){}
 const nota=(f,t0,dur,vol,tipo)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=tipo;o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(ctx.destination);o.start(t0);o.stop(t0+dur+0.05)};
 const SEQ={primera:[[523.25,0,.2],[659.25,.13,.3]],meta:[[523.25,0,.2],[659.25,.11,.2],[783.99,.22,.2],[1046.5,.33,.5],[1318.5,.46,.55]]};
 function exito(tipo){
  if(!on||!AC||!SEQ[tipo])return false;
  try{ctx=ctx||new AC();if(ctx.state==='suspended')ctx.resume();const t=ctx.currentTime+0.02;
   SEQ[tipo].forEach(([f,d,l],i)=>nota(f,t+d,l,tipo==='meta'?0.16:0.12,i%2?'triangle':'sine'));n++;return true}catch(e){return false}
 }
 return{exito,activo:()=>on,poner:v=>{on=!!v;try{localStorage.setItem(K,JSON.stringify({on}))}catch(e){}},_n:()=>n};
})();
(()=>{
 const c=document.getElementById('sndOn'),t=document.getElementById('sndTest');if(!c||!t)return;
 c.checked=SND.activo();
 c.addEventListener('change',()=>{SND.poner(c.checked);if(c.checked)SND.exito('primera')});
 t.addEventListener('click',()=>{const era=SND.activo();SND.poner(true);SND.exito('primera');setTimeout(()=>{SND.exito('meta');SND.poner(era)},800)});
})();
