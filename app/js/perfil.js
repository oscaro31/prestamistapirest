var temas=[
    {id:'',nombre:'Default',icon:'bi-circle-fill',color:'#0f3460'},
    {id:'dark',nombre:'Oscuro',icon:'bi-moon-fill',color:'#16213e'},
    {id:'verde',nombre:'Verde',icon:'bi-tree-fill',color:'#1b5e20'},
    {id:'azul',nombre:'Azul',icon:'bi-droplet-fill',color:'#0d47a1'},
    {id:'oscuro',nombre:'Noche',icon:'bi-stars',color:'#0f0f23'},
    {id:'claro',nombre:'Claro',icon:'bi-brightness-high-fill',color:'#2563eb'},
    {id:'rosa',nombre:'Rosa',icon:'bi-flower1',color:'#880e4f'},
    {id:'naranja',nombre:'Naranja',icon:'bi-sun-fill',color:'#e65100'},
    {id:'purpura',nombre:'Purpura',icon:'bi-gem',color:'#4a148c'},
    {id:'menta',nombre:'Menta',icon:'bi-droplet-half',color:'#004d40'},
    {id:'cereza',nombre:'Cereza',icon:'bi-heart-fill',color:'#b71c1c'},
    {id:'tinta',nombre:'Tinta',icon:'bi-pencil-fill',color:'#1de9b6'}
];
var temaActual='';

function cargarPerfil(){
    var u=user; if(!u){console.warn("User not loaded");return;}
    // Fill fields immediately with current user data
    fillPerfilFields();
    // Also refresh from server in background
    g('users/list', function(ed, udata) {
        if (!ed && udata) {
            for (var i=0; i<udata.length; i++) {
                if (udata[i].idusuario == u.idusuario) {
                    u.nombre = udata[i].nombre || u.nombre;
                    u.apellido = udata[i].apellido || u.apellido;
                    u.email = udata[i].email;
                    u.telefono = udata[i].telefono;
                    u.direccion = udata[i].direccion;
                    u.num_documento = udata[i].num_documento || udata[i].NroDocumento || '';
                    u.idtipodocumento = udata[i].idtipodocumento || 0;
                    u.login = udata[i].login || u.login;
                    u.cargo_nombre = udata[i].cargo_nombre || u.cargo_nombre || '';
                    u.idcargo = udata[i].idcargo || u.idcargo;
                    fillPerfilFields();
                    break;
                }
            }
        }
    });
}

function fillPerfilFields(){
    var u=user; if(!u) return;
    var el;
    el=document.getElementById('pfNombre'); if(el) el.value=u.nombre||'';
    el=document.getElementById('pfApellido'); if(el) el.value=u.apellido||'';
    el=document.getElementById('pfLogin'); if(el) el.value=u.login||'';
    el=document.getElementById('pfCargo'); if(el) el.value=u.cargo_nombre||'';
    el=document.getElementById('pfEmail'); if(el) el.value=u.email||'';
    el=document.getElementById('pfTelefono'); if(el) el.value=u.telefono||'';
    el=document.getElementById('pfDireccion'); if(el) el.value=u.direccion||'';
    el=document.getElementById('pfDocumento'); if(el) el.value=u.num_documento||'';
    
    if(document.getElementById('pfTipoDoc')) cargarTipoDocSelect();
    cargarSelectorTemas();
    cargarSelectorIdioma();
    if(user.avatar){
        if(document.getElementById('pfAvatar')) document.getElementById('pfAvatar').src=user.avatar;
        if(document.getElementById('userAvatar')) document.getElementById('userAvatar').src=user.avatar;
    }
    var prefs=JSON.parse(user.preferencias||'{}');
    temaActual=prefs.tema||'';
    if(prefs.idioma)L=prefs.idioma;
    aplicarTema(temaActual);
    marcarTemaActivo(temaActual);
    aplicarIdioma();
    cargarPrefsSidebarPerfil();
}

function cargarSelectorTemas(){
    var c=document.getElementById('temasSelector');
    if(!c)return;
    var h='';
    for(var i=0;i<temas.length;i++){
        var t=temas[i];
        h+='<div class="tema-card" data-id="'+t.id+'" onclick="seleccionarTema(\''+t.id+'\')" style="cursor:pointer;text-align:center;padding:10px 14px;border-radius:12px;border:2px solid transparent;transition:all .2s">';
        h+='<div style="width:36px;height:36px;border-radius:50%;background:'+t.color+';margin:0 auto 4px;display:flex;align-items:center;justify-content:center">';
        h+='<i class="bi '+t.icon+'" style="color:#fff;font-size:1rem"></i></div>';
        h+='<small style="display:block;font-size:.7rem">'+t.nombre+'</small></div>';
    }
    c.innerHTML=h;
}

function marcarTemaActivo(id){
    var cards=document.querySelectorAll('#temasSelector .tema-card');
    for(var i=0;i<cards.length;i++){
        if(cards[i].getAttribute('data-id')===id)cards[i].style.borderColor='var(--gd)';
        else cards[i].style.borderColor='transparent';
    }
}

function cargarSelectorIdioma(){
    var c=document.getElementById('idiomaSelector');
    if(!c)return;
    var langs=[{id:'es',name:'Español',flag:'🇪🇸'},{id:'en',name:'English',flag:'🇺🇸'},{id:'fr',name:'Français',flag:'🇫🇷'},{id:'pt',name:'Português',flag:'🇧🇷'}];
    var h='';
    for(var i=0;i<langs.length;i++){
        var cls='btn btn-outline-secondary btn-sm'+(L===langs[i].id?' active':'');
        h+='<button class="'+cls+'" onclick="seleccionarIdioma(\''+langs[i].id+'\')" style="border-radius:20px">'+langs[i].flag+' '+langs[i].name+'</button>';
    }
    c.innerHTML=h;
}

function seleccionarIdioma(id){
    L=id;
    aplicarIdioma();
    cargarSelectorIdioma();
    // guardar en preferencias
    var prefs=JSON.parse(user.preferencias||'{}');
    prefs.idioma=id;
    p('users/update',{idusuario:user.idusuario,preferencias:JSON.stringify(prefs)},function(e){
        if(e)mostrarToast('Error al guardar idioma','danger');
        else{
            user.preferencias=JSON.stringify(prefs);
            mostrarToast('Idioma cambiado a '+__(id=='en'?'Ingles':id=='fr'?'Frances':'Espanol'),'success');
        }
    });
}

function seleccionarTema(id){
    temaActual=id;
    aplicarTema(id);
    marcarTemaActivo(id);
    // guardar en preferencias del usuario
    var prefs=JSON.parse(user.preferencias||'{}');
    prefs.tema=id;
    p('users/update',{idusuario:user.idusuario,preferencias:JSON.stringify(prefs)},function(e){
        if(e)mostrarToast('Error al guardar tema','danger');
        else{
            user.preferencias=JSON.stringify(prefs);
            mostrarToast('Tema aplicado y guardado','success');
        }
    });
}

function aplicarTema(id){
    if(id && id !== '') {
        document.body.setAttribute('data-tema', id);
    } else {
        document.body.removeAttribute('data-tema');
    }
}

function subirAvatar(){
    var file=document.getElementById('pfAvatarFile').files[0];
    if(!file){mostrarToast('Selecciona una imagen','warning');return;}
    var form=new FormData();
    form.append('avatar',file);
    var x=new XMLHttpRequest();
    x.open('POST',API+'upload/avatar',true);
    var t=gt();
    if(t)x.setRequestHeader('Authorization','Bearer '+t);
    x.onreadystatechange=function(){
        if(x.readyState!==4)return;
        try{var j=JSON.parse(x.responseText)}catch(e){j={error:'Error'}}
        if(j.data&&j.data.avatar){
            user.avatar=j.data.avatar;
            document.getElementById('pfAvatar').src=j.data.avatar;
            document.getElementById('userAvatar').src=j.data.avatar;
            mostrarToast('Avatar actualizado','success');
        }else mostrarToast(j.error||'Error al subir','danger');
    };
    x.send(form);
}

function guardarPerfil(){
    var n=document.getElementById("pfNombre").value.trim();
    if(!n){mostrarToast("Nombre requerido",'warning');return;}
    var data={idusuario:user.idusuario,nombre:n};
    var ap=document.getElementById('pfApellido'); if(ap) data.apellido=ap.value.trim();
    var em=document.getElementById('pfEmail'); if(em) data.email=em.value.trim();
    var te=document.getElementById('pfTelefono'); if(te) data.telefono=te.value.trim();
    var di=document.getElementById('pfDireccion'); if(di) data.direccion=di.value.trim();
    var doc=document.getElementById('pfDocumento'); if(doc) data.num_documento=doc.value.trim();
    var td=document.getElementById('pfTipoDoc'); if(td) data.idtipodocumento=td.value;
    var ca=document.getElementById('pfCargoSelect'); if(ca) data.idcargo=ca.value;
    p("users/update",data,function(e){
        if(e)mostrarToast(e,'danger');
        else{
            mostrarToast("Perfil actualizado",'success');
            user.nombre=n;
            document.getElementById("uname").textContent=n;
        }
    });
}


// Sidebar compact functions
function cargarPrefsSidebarPerfil(){
    if(!window.user) return setTimeout(cargarPrefsSidebarPerfil,100);
    var prefs=JSON.parse(user.preferencias||'{}');
    var chk=document.getElementById('chkSidebarCompact');
    if(chk) chk.checked=prefs.sidebar==='compact';
}

function guardarSidebarCompactPerfil(){
    var checked=document.getElementById('chkSidebarCompact').checked;
    var prefs=JSON.parse(user.preferencias||'{}');
    prefs.sidebar=checked?'compact':'full';
    user.preferencias=JSON.stringify(prefs);
    p('users/update',{idusuario:user.idusuario,preferencias:JSON.stringify(prefs)},function(e){
        if(!e && typeof aplicarSidebarCompactGlobal==='function') aplicarSidebarCompactGlobal();
    });
}


function cargarTipoDocSelect(){
    var sel=document.getElementById('pfTipoDoc');
    if(sel && user && user.idtipodocumento) {
        sel.value = user.idtipodocumento;
    }
}


function cambiarClavePerfil(){
    var clave=document.getElementById('pfNuevaClave').value.trim();
    if(!clave || clave.length<4){mostrarToast('La clave debe tener al menos 4 caracteres','warning');return;}
    p('users/password',{idusuario:user.idusuario,clave:clave},function(e){
        if(e)mostrarToast(e,'danger');
        else{
            mostrarToast('Clave actualizada correctamente','success');
            document.getElementById('pfNuevaClave').value='';
        }
    });
}