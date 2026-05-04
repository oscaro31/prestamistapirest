var euId=0,euTogId=0,euPassId=0,usrs=[],muTdCargados=false;

function formatearDocMu(){var inp=document.getElementById('muDocumento');var td=document.getElementById('muTipoDoc');if(td.value==='3'){var v=inp.value.replace(/\D/g,'').substring(0,9);if(v.length>=3&&v.length<8)v=v.substring(0,2)+'-'+v.substring(2);else if(v.length>=8)v=v.substring(0,2)+'-'+v.substring(2,7)+'-'+v.substring(7,9);inp.value=v;}else{var v=inp.value.replace(/\D/g,'').substring(0,11);if(v.length>=3&&v.length<10)v=v.substring(0,3)+'-'+v.substring(3);else if(v.length>=10)v=v.substring(0,3)+'-'+v.substring(3,10)+'-'+v.substring(10,11);inp.value=v;}}
function formatearTelMu(){var inp=document.getElementById('muTelefono');var v=inp.value.replace(/\D/g,'').substring(0,10);if(v.length>=3&&v.length<6)v=v.substring(0,3)+'-'+v.substring(3);else if(v.length>=6&&v.length<10)v=v.substring(0,3)+'-'+v.substring(3,6)+'-'+v.substring(6);else if(v.length>=10)v=v.substring(0,3)+'-'+v.substring(3,6)+'-'+v.substring(6,10);inp.value=v;}

function lu(){
    g('users/list',function(e,d){
        if(e){document.getElementById('ubody2').innerHTML='<tr><td colspan="6" class="text-danger">'+e+'</td></tr>';return;}
        usrs=d;
        var h='';
        for(var i=0;i<d.length;i++){
            var u=d[i];
            h+='<tr><td><strong>'+u.login+'</strong></td><td>'+u.nombre+' '+(u.apellido||'')+'</td><td>'+(u.cargo_nombre||'-')+'</td><td><span class="badge '+(u.activo?'bg-success':'bg-secondary')+'">'+(u.activo?'Activo':'Inactivo')+'</span></td><td><button class="btn btn-sm btn-outline-warning" onclick="tu('+u.idusuario+')"><i class="bi bi-'+(u.activo?'pause':'play')+'"></i></button> <button class="btn btn-sm btn-outline-primary" onclick="cp('+u.idusuario+')"><i class="bi bi-key"></i></button> <button class="btn btn-sm btn-outline-info" onclick="eu('+u.idusuario+')"><i class="bi bi-pencil"></i></button></td></tr>';
        }
        document.getElementById('ubody2').innerHTML=h||'<tr><td colspan="6" class="text-muted text-center">Sin datos</td></tr>';
    aplicarIdioma();
    });
}

function eu(id){
    euId=id;
    document.getElementById('muTitulo').textContent=id>0?__('editar')+' '+__('usuario'):__('nuevo')+' '+__('usuario');
    if(!muTdCargados){
        g('tipos/documento',function(e2,d2){
            if(!e2&&d2){
                var sel=document.getElementById('muTipoDoc');
                for(var i=0;i<d2.length;i++)sel.innerHTML+='<option value="'+d2[i].idtipodocumento+'">'+d2[i].Nombre+'</option>';
                muTdCargados=true;
            }
        });
    }
    if(id>0){
        var u;for(var i=0;i<usrs.length;i++){if(usrs[i].idusuario===id){u=usrs[i];break;}}
        document.getElementById('muNombre').value=u?u.nombre:'';
        document.getElementById('muApellido').value=u?u.apellido||'':'';
        document.getElementById('muLogin').value=u?u.login:'';
        document.getElementById('muClave').value='';
        document.getElementById('muTipoDoc').value=u?u.idtipodocumento||'':'';
        if(u&&u.avatar)document.getElementById('muAvatar').src=u.avatar; else document.getElementById('muAvatar').src='images/logo.jpg';
        document.getElementById('muDocumento').value=u?u.nrodocumento||u.NroDocumento||'':'';
        document.getElementById('muTelefono').value=u?u.telefono||u.Telefono||'':'';
        document.getElementById('muEmail').value=u?u.email||u.Correo||'':'';
        document.getElementById('muDireccion').value=u?u.direccion||u.Direccion||'':'';
        document.getElementById('muCargo').value=u?u.idcargo||'2':'2';
        document.getElementById('muClaveGroup').style.display='none';
    }else{
        document.getElementById('muNombre').value='';
        document.getElementById('muApellido').value='';
        document.getElementById('muLogin').value='';
        document.getElementById('muClave').value='';
        document.getElementById('muTipoDoc').value='';
        document.getElementById('muDocumento').value='';
        document.getElementById('muTelefono').value='';
        document.getElementById('muEmail').value='';
        document.getElementById('muDireccion').value='';
        document.getElementById('muCargo').value='2';
        document.getElementById('muClaveGroup').style.display='block';
    }
    new bootstrap.Modal(document.getElementById('modalUsuario')).show();
}

function guardarUsuario(){
    var n=document.getElementById('muNombre').value.trim();
    var a=document.getElementById('muApellido').value.trim();
    var l=document.getElementById('muLogin').value.trim();
    var c=document.getElementById('muClave').value.trim();
    var r=document.getElementById('muCargo').value;
    if(!n||!l){mostrarToast('Nombre y Login requeridos','warning');return;}
    if(euId<0&&!c){mostrarToast('Clave requerida para nuevo usuario','warning');return;}
    var td=document.getElementById('muTipoDoc').value;
    var nd=document.getElementById('muDocumento').value.trim();
    var t=document.getElementById('muTelefono').value.trim();
    var e=document.getElementById('muEmail').value.trim();
    var d=document.getElementById('muDireccion').value.trim();
    var data={nombre:n,apellido:a,login:l,idcargo:parseInt(r),num_documento:nd,telefono:t,email:e,direccion:d};
    if(td)data.idtipodocumento=parseInt(td);
    if(c)data.clave=c;
    if(euId>0){
        data.idusuario=euId;
        p('users/update',data,function(e){
            if(e)mostrarToast(e,'danger');
            else{
                bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
                mostrarToast('Usuario '+l+' actualizado','success');
                lu();
            }
        });
    }else{
        p('users/create',data,function(e){
            if(e)mostrarToast(e,'danger');
            else{
                bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
                mostrarToast('Usuario '+l+' creado','success');
                lu();
            }
        });
    }
}

function tu(id){
    g('users/list',function(e,d){
        var nom='';var act=false;var nomCompleto='';
        if(!e&&d)for(var i=0;i<d.length;i++){if(d[i].idusuario===id){nom=d[i].nombre+' '+(d[i].apellido||'');nom=nom.trim();act=d[i].activo;break;}}
        var acc=act?'desactivar':'activar';
        var btn=document.getElementById('mcBtnConfirm');
        if(btn)btn.innerHTML='<i class="bi bi-'+(act?'pause':'play')+'"></i> '+(act?'Desactivar':'Activar');
        confirmar((act?'Desactivar':'Activar')+' a '+nom+'?',function(){
            p('users/toggle',{idusuario:id},function(e2){
                if(e2)mostrarToast(e2,'danger');
                else{
                    mostrarToast('Usuario '+nom+' '+(act?'desactivado':'activado'),'success');
                    lu();
                }
            });
        });
    });
}

function subirAvatarUsuario(){
    var file=document.getElementById('muAvatarFile').files[0];
    if(!file){mostrarToast('Selecciona una imagen','warning');return;}
    var id=euId;
    if(id<=0){mostrarToast('Guarda primero el usuario','warning');return;}
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
            document.getElementById('muAvatar').src=j.data.avatar;
            // Also update the userAvatar in topbar if same user
            if(user.idusuario===id)document.getElementById('userAvatar').src=j.data.avatar;
            mostrarToast('Avatar actualizado','success');
        }else mostrarToast(j.error||'Error al subir','danger');
    };
    x.send(form);
}

function cp(id){
    euPassId=id;
    g('users/list',function(e,d){
        var nom='';
        if(!e&&d)for(var i=0;i<d.length;i++){if(d[i].idusuario===id){nom=d[i].login;break;}}
        document.getElementById('mpTitulo').textContent='Cambiar clave - '+nom;
        document.getElementById('mpClave').value='';
        new bootstrap.Modal(document.getElementById('modalPassword')).show();
    });
}

function guardarPassword(){
    var nc=document.getElementById('mpClave').value.trim();
    if(nc.length<4){mostrarToast('Clave debe tener al menos 4 caracteres','warning');return;}
    p('users/password',{idusuario:euPassId,clave:nc},function(e){
        if(e)mostrarToast(e,'danger');
        else{
            bootstrap.Modal.getInstance(document.getElementById('modalPassword')).hide();
            mostrarToast('Clave actualizada correctamente','success');
        }
    });
}
