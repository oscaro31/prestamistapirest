var meId=0;
var _ppMonedas = [];
var _ppPageMon = 0;
var _ppPageSizeMon = 10;
var _ppSortColMon = '';
var _ppSortDirMon = 'asc';

function abrirModalMoneda(){em(0);}

function lm(){
    g('monedas/list',function(e,d){
        if(e){document.getElementById('mbody').innerHTML='<tr><td colspan="4" class="text-danger">'+e+'</td></tr>';return;}
        _ppMonedas=d||[];
        _ppPageMon=0;
        ppRenderMonedas();
    });
}

function ppRenderMonedas(){
    var q=(document.getElementById('filtroBusqueda')||{}).value||'';
    var dados=_ppMonedas;
    if(q){
        dados=dados.filter(function(m){
            return (m.Nombre||'').toLowerCase().indexOf(q)>-1||(m.Simbolo||'').toLowerCase().indexOf(q)>-1;
        });
    }
    if(_ppSortColMon){
        dados.sort(function(a,b){
            var va=(a[_ppSortColMon]||'').toString().toLowerCase();
            var vb=(b[_ppSortColMon]||'').toString().toLowerCase();
            if(_ppSortColMon==='IdMoneda'){va=parseInt(va);vb=parseInt(vb);}
            return _ppSortDirMon==='asc'?(va>vb?1:-1):(va<vb?1:-1);
        });
    }
    var total=dados.length;
    var from=_ppPageMon*_ppPageSizeMon;
    var to=Math.min(from+_ppPageSizeMon,total);
    var page=dados.slice(from,to);
    var sorter=function(col,label){
        var arrow=_ppSortColMon===col?(_ppSortDirMon==='asc'?'\u25B2':'\u25BC'):'';
        return '<th onclick="ppSortMonedas(\''+col+'\')" style="cursor:pointer;user-select:none">'+label+' '+arrow+'</th>';
    };
    var h='';
    for(var i=0;i<page.length;i++){
        var m=page[i];
        h+='<tr><td>'+m.IdMoneda+'</td><td>'+m.Nombre+'</td><td><strong>'+m.Simbolo+'</strong></td><td><button class="btn btn-sm btn-outline-primary" onclick="em('+m.IdMoneda+')"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="dm('+m.IdMoneda+')"><i class="bi bi-trash"></i></button></td></tr>';
    }
    h+='</tbody>';
    document.getElementById('mbody').innerHTML=h||'<tr><td colspan="4" class="text-muted text-center">'+__('sin_datos')+'</td></tr>';
    var totalPages=Math.ceil(total/_ppPageSizeMon)||1;
    var pgHtml='<div class="d-flex justify-content-between align-items-center mt-2 px-2"><div class="text-muted small">'+__('mostrando')+' '+Math.min(from+1,total)+'-'+to+' '+__('de')+' '+total+'</div><div class="d-flex align-items-center gap-1"><select class="form-select form-select-sm" style="width:auto" onchange="_ppPageSizeMon=parseInt(this.value);_ppPageMon=0;ppRenderMonedas()">';
    [10,25,50,100].forEach(function(s){pgHtml+='<option value="'+s+'"'+(_ppPageSizeMon===s?' selected':'')+'>'+s+'</option>';});
    pgHtml+='<option value="0">'+__('todos')+'</option></select>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageMon=Math.max(0,_ppPageMon-1);ppRenderMonedas()" '+(from<=0?'disabled':'')+'><i class="bi bi-chevron-left"></i></button>';
    pgHtml+='<span class="small mx-1">'+(_ppPageMon+1)+'/'+totalPages+'</span>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageMon=Math.min('+(totalPages-1)+',_ppPageMon+1);ppRenderMonedas()" '+(to>=total?'disabled':'')+'><i class="bi bi-chevron-right"></i></button>';
    pgHtml+='</div></div>';
    var pgEl=document.getElementById('mbodyPagination');
    if(pgEl)pgEl.innerHTML=pgHtml;
    if(typeof aplicarIdioma==='function')aplicarIdioma();
}

function ppSortMonedas(col){
    if(_ppSortColMon===col){_ppSortDirMon=_ppSortDirMon==='asc'?'desc':'asc';}
    else{_ppSortColMon=col;_ppSortDirMon='asc';}
    ppRenderMonedas();
}

function em(id){
    meId=id;
    document.getElementById('mmTitulo').textContent=id>0?__('editar')+' '+__('moneda'):__('nuevo')+' '+__('moneda');
    if(id>0){
        var m;for(var i=0;i<_ppMonedas.length;i++){if(_ppMonedas[i].IdMoneda===id){m=_ppMonedas[i];break;}}
        document.getElementById('mmNombre').value=m?m.Nombre:'';
        document.getElementById('mmSimbolo').value=m?m.Simbolo:'';
    }else{
        document.getElementById('mmNombre').value='';
        document.getElementById('mmSimbolo').value='';
    }
    new bootstrap.Modal(document.getElementById('modalMoneda')).show();
}

function guardarMoneda(){
    var n=document.getElementById('mmNombre').value.trim();
    var s=document.getElementById('mmSimbolo').value.trim();
        if(!n||!s){saToast('Nombre y Simbolo requeridos','error');return;}
    if(meId>0){
        p('monedas/update',{IdMoneda:meId,Nombre:n,Simbolo:s},function(e){
            if(e)saToast(e,'error');
            else{
                bootstrap.Modal.getInstance(document.getElementById('modalMoneda')).hide();
                saToast('Moneda '+n+' actualizada');
                lm();
            }
        });
    }else{
        p('monedas/create',{Nombre:n,Simbolo:s},function(e){
            if(e)saToast(e,'error');
            else{
                bootstrap.Modal.getInstance(document.getElementById('modalMoneda')).hide();
                saToast('Moneda creada');
                lm();
            }
        });
    }
                mostrarToast('Moneda '+n+' '+__('creada'),'success');
                lm();
            }
        });
    }
}

function dm(id){
    var nom='';
    for(var i=0;i<_ppMonedas.length;i++){if(_ppMonedas[i].IdMoneda===id){nom=_ppMonedas[i].Nombre;break;}}
    confirmar('Eliminar moneda '+nom+'?',function(){
        p('monedas/delete',{IdMoneda:id},function(e){
            if(e)mostrarToast(e,'danger');
            else{
                mostrarToast(__('moneda')+' '+nom+' '+__('eliminada'),'warning');
                lm();
            }
        });
    });
}
