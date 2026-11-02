/* ===== Presentación de entrada: una vez por sesión, saltable con un toque, respeta «reducir movimiento» ===== */
(()=>{
 const s=document.getElementById('splash');if(!s)return;
 let ya=false;try{ya=sessionStorage.getItem('hm.intro')==='1'}catch(e){}
 if(ya){s.remove();return}
 try{sessionStorage.setItem('hm.intro','1')}catch(e){}
 const quieta=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 s.classList.add('on');if(quieta)s.classList.add('quieta');
 let fin=false;const cerrar=()=>{if(fin)return;fin=true;s.classList.add('fuera');setTimeout(()=>s.remove(),450)};
 s.addEventListener('click',cerrar);setTimeout(cerrar,quieta?900:2900);
})();
