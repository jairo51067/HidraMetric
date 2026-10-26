/* ===== Identidad: nombre o seudónimo, avatar y foto (solo en este dispositivo) ===== */
const IK='hidrametric.id.v1',AVS=['💧','🌊','🐬','🦊','🐼','🦁','🐯','🐸','🦉','🌿','⚡','🔥','🌟','🚀','🏃','🧘'];
let ID={nombre:'',av:'💧',foto:''};
try{Object.assign(ID,JSON.parse(localStorage.getItem(IK)||'{}'))}catch(e){}
function idSave(){try{localStorage.setItem(IK,JSON.stringify(ID))}catch(e){modal('No se pudo guardar','El navegador no permitió guardar tus datos de identidad en este dispositivo. Prueba con una foto más pequeña o libera espacio.')}}
function nomUsuario(){return ID.nombre||''}
function pintaAv(el){el.textContent='';if(ID.foto){const i=document.createElement('img');i.src=ID.foto;i.alt='';el.appendChild(i)}else el.textContent=ID.av}
function pintarId(){
 const h=new Date().getHours(),sal=h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches',n=ID.nombre,pct=meta?Math.round(total()/meta*100):0;
 $('hi1').textContent=n?sal+', '+n:sal;
 $('hi2').textContent=!meta?'Completa tu perfil para calcular tu meta':pct>=100?'Meta del día cumplida. ¡Gran trabajo!':'Hoy llevas '+pct+' % de tu meta';
 ['hiAv','avBtn','dwAv'].forEach(i=>pintaAv($(i)));$('dwNom').textContent=n||'';
 document.querySelectorAll('#avList button').forEach(b=>b.classList.toggle('on',!ID.foto&&b.dataset.av===ID.av));
 $('fotoRm').hidden=!ID.foto;
}
$('nombre').value=ID.nombre;
$('nombre').addEventListener('input',()=>{ID.nombre=$('nombre').value.trim().slice(0,24);idSave();render()});
$('avList').innerHTML=AVS.map(a=>'<button data-av="'+a+'" aria-label="Avatar '+a+'">'+a+'</button>').join('');
$('avList').addEventListener('click',e=>{const b=e.target.closest('[data-av]');if(!b)return;ID.av=b.dataset.av;ID.foto='';idSave();render()});
$('fotoBtn').onclick=$('avBtn').onclick=()=>$('fotoIn').click();
$('fotoRm').onclick=()=>{ID.foto='';idSave();render()};
$('fotoIn').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f||!f.type.startsWith('image/'))return;
 const r=new FileReader();
 r.onload=()=>{const im=new Image();
  im.onload=()=>{const s=Math.min(im.width,im.height),S=160,c=document.createElement('canvas');c.width=c.height=S;
   c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,S,S);ID.foto=c.toDataURL('image/jpeg',.82);idSave();render()};
  im.onerror=()=>modal('No se pudo leer la imagen','Prueba con una foto en formato JPG o PNG.');
  im.src=r.result};
 r.readAsDataURL(f);
});
render();
