var ecId=0;
var tdCargados=false;
var _ppClientes = [];
var _ppPageCli = 0;
var _ppPageSizeCli = 10;
var _ppSortColCli = '';
var _ppSortDirCli = 'asc';

function formatearTel(){
    var inp=document.getElementById('mcTelefono');
    var v=inp.value.replace(/\D/g,'').substring(0,10);
    if(v.length>=3&&v.length<6)v=v.substring(0,3)+'-'+v.substring(3);
    else if(v.length>=6&&v.length<10)v=v.substring(0,3)+'-'+v.substring(3,6)+'-'+v.substring(6);
    else if(v.length>=10)v=v.substring(0,3)+'-'+v.substring(3,6)+'-'+v.substring(6,10);
    inp.value=v;
}

function formatearDoc(){
    var inp=document.getElementById('mcDocumento');
    var td=document.getElementById('mcTipoDoc');
    if(td.value==='3'){
        var v=inp.value.replace(/\D/g,'').substring(0,9);
        if(v.length>=3&&v.length<8)v=v.substring(0,2)+'-'+v.substring(2);
        else if(v.length>=8)v=v.substring(0,2)+'-'+v.substring(2,7)+'-'+v.substring(7,9);
        inp.value=v;
    }else{
        var v=inp.value.replace(/\D/g,'').substring(0,11);
        if(v.length>=3&&v.length<10)v=v.substring(0,3)+'-'+v.substring(3);
        else if(v.length>=10)v=v.substring(0,3)+'-'+v.substring(3,10)+'-'+v.substring(10,11);
        inp.value=v;
    }
}

function lc(){
    g('clientes/list',function(e,d){
        if(e){document.getElementById('cbody').innerHTML='<tr><td colspan="8" class="text-danger">'+e+'</td></tr>';return;}
        _ppClientes=d||[];
        _ppPageCli=0;
        ppRenderClientes();
    });
    if(!tdCargados){
        g('tipos/documento',function(e2,d2){
            if(!e2&&d2){
                var sel=document.getElementById('mcTipoDoc');
                for(var i=0;i<d2.length;i++){
                    sel.innerHTML+='<option value="'+d2[i].idtipodocumento+'">'+d2[i].Nombre+'</option>';
                }
                tdCargados=true;
            }
        });
    }
}

function ppRenderClientes(){
    var q=(document.getElementById('filtroBusqueda')||{}).value||'';
    var dados=_ppClientes;
    if(q){
        dados=dados.filter(function(c){
            return (c.Nombre||'').toLowerCase().indexOf(q)>-1||(c.Apellido||'').toLowerCase().indexOf(q)>-1||(c.NroDocumento||'').toLowerCase().indexOf(q)>-1||(c.Correo||'').toLowerCase().indexOf(q)>-1||(c.Telefono||'').indexOf(q)>-1;
        });
    }
    if(_ppSortColCli){
        dados.sort(function(a,b){
            var va=(a[_ppSortColCli]||'').toString().toLowerCase();
            var vb=(b[_ppSortColCli]||'').toString().toLowerCase();
            if(_ppSortColCli==='IdCliente'){va=parseInt(va);vb=parseInt(vb);}
            return _ppSortDirCli==='asc'?(va>vb?1:-1):(va<vb?1:-1);
        });
    }
    var total=dados.length;
    var from=_ppPageCli*_ppPageSizeCli;
    var to=Math.min(from+_ppPageSizeCli,total);
    var page=dados.slice(from,to);
    var sorter=function(col,label){
        var arrow=_ppSortColCli===col?(_ppSortDirCli==='asc'?'\u25B2':'\u25BC'):'';
        return '<th onclick="ppSortClientes(\''+col+'\')" style="cursor:pointer;user-select:none">'+label+' '+arrow+'</th>';
    };
    var h='<thead><tr>';
    h+=sorter('IdCliente','#');
    h+='<th>Tipo Doc</th>';
    h+=sorter('NroDocumento',__('documento'));
    h+=sorter('Nombre',__('nombre'));
    h+=sorter('Apellido',__('apellido'));
    h+=sorter('Correo',__('email'));
    h+=sorter('Telefono',__('telefono'));
    h+='<th>'+__('accion')+'</th>';
    h+='</tr></thead><tbody>';
    for(var i=0;i<page.length;i++){
        var c=page[i];
        var td=c.tipo_documento_nombre||'';
        h+='<tr><td>'+c.IdCliente+'</td><td>'+td+'</td><td>'+(c.NroDocumento||'')+'</td><td>'+c.Nombre+'</td><td>'+c.Apellido+'</td><td>'+(c.Correo||'')+'</td><td>'+(c.Telefono||'')+'</td><td><button class="btn btn-sm btn-outline-primary" onclick="ec('+c.IdCliente+')"><i class="bi bi-pencil"></i></button></td></tr>';
    }
    h+='</tbody>';
    document.getElementById('cbody').innerHTML=h||'<tr><td colspan="8" class="text-muted text-center">'+__('sin_datos')+'</td></tr>';
    var totalPages=Math.ceil(total/_ppPageSizeCli)||1;
    var pgHtml='<div class="d-flex justify-content-between align-items-center mt-2 px-2"><div class="text-muted small">'+__('mostrando')+' '+Math.min(from+1,total)+'-'+to+' '+__('de')+' '+total+'</div><div class="d-flex align-items-center gap-1"><select class="form-select form-select-sm" style="width:auto" onchange="_ppPageSizeCli=parseInt(this.value);_ppPageCli=0;ppRenderClientes()">';
    [10,25,50,100].forEach(function(s){pgHtml+='<option value="'+s+'"'+(_ppPageSizeCli===s?' selected':'')+'>'+s+'</option>';});
    pgHtml+='<option value="0">'+__('todos')+'</option></select>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageCli=Math.max(0,_ppPageCli-1);ppRenderClientes()" '+(from<=0?'disabled':'')+'><i class="bi bi-chevron-left"></i></button>';
    pgHtml+='<span class="small mx-1">'+(_ppPageCli+1)+'/'+totalPages+'</span>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageCli=Math.min('+(totalPages-1)+',_ppPageCli+1);ppRenderClientes()" '+(to>=total?'disabled':'')+'><i class="bi bi-chevron-right"></i></button>';
    pgHtml+='</div></div>';
    var pgEl=document.getElementById('cbodyPagination');
    if(pgEl)pgEl.innerHTML=pgHtml;
}

function ppSortClientes(col){
    if(_ppSortColCli===col){_ppSortDirCli=_ppSortDirCli==='asc'?'desc':'asc';}
    else{_ppSortColCli=col;_ppSortDirCli='asc';}
    ppRenderClientes();
}

function ec(id){
    ecId=id;
    document.getElementById('mcTitulo').textContent=id>0?__('editar')+' '+__('cliente'):__('nuevo')+' '+__('cliente');
    if(id>0){
        var c;for(var i=0;i<_ppClientes.length;i++){if(_ppClientes[i].IdCliente===id){c=_ppClientes[i];break;}}
        document.getElementById('mcNombre').value=c?c.Nombre:'';
        document.getElementById('mcApellido').value=c?c.Apellido:'';
        document.getElementById('mcTipoDoc').value=c?c.IdTipoDocumento||'':'';
        document.getElementById('mcDocumento').value=c?c.NroDocumento:'';
        document.getElementById('mcTelefono').value=c?c.Telefono:'';
        document.getElementById('mcCorreo').value=c?c.Correo:'';
        document.getElementById('mcDireccion').value=c?c.Direccion||'':'';
    }else{
        document.getElementById('mcNombre').value='';
        document.getElementById('mcApellido').value='';
        document.getElementById('mcTipoDoc').value='';
        document.getElementById('mcDocumento').value='';
        document.getElementById('mcTelefono').value='';
        document.getElementById('mcCorreo').value='';
        document.getElementById('mcDireccion').value='';
    }
    new bootstrap.Modal(document.getElementById('modalCliente')).show();
}

function guardarCliente(){
    var n=document.getElementById('mcNombre').value.trim();
    var a=document.getElementById('mcApellido').value.trim();
    var td=document.getElementById('mcTipoDoc').value;
    var nd=document.getElementById('mcDocumento').value.trim();
    var t=document.getElementById('mcTelefono').value.trim();
    var e=document.getElementById('mcCorreo').value.trim();
    var d=document.getElementById('mcDireccion').value.trim();
    if(!n||!a){alert('Nombre y Apellido requeridos');return;}
    var nom=n+(a?' '+a:'');
    var data={Nombre:n,Apellido:a,NroDocumento:nd,Telefono:t,Correo:e,Direccion:d};
    if(td)data.IdTipoDocumento=parseInt(td);
    if(ecId>0){
        data.IdCliente=ecId;
        p('clientes/update',data,function(e2){
            if(e2)alert(e2);else{
                bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
                mostrarToast(__('cliente')+' \u0022'+nom+'\u0022 '+__('actualizado')+' correctamente','success');
                lc();
            }
        });
    }else{
        p('clientes/create',data,function(e2){
            if(e2)alert(e2);else{
                bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
                mostrarToast(__('cliente')+' \u0022'+nom+'\u0022 '+__('creado')+' correctamente','success');
                lc();
            }
        });
    }
}
