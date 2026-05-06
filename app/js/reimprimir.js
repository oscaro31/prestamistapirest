var _rrPage=0,_rrPageSize=10,_rrData=[];

function lr(){
    buscar();
}

function lb(){
    document.getElementById('rrCliente').value='';
    document.getElementById('rrDesde').value='';
    document.getElementById('rrHasta').value='';
    buscar();
}

function buscar(){
    // Cargar porcentaje de mora
    g('config/list',function(ec,dc){
        if(!ec&&dc){
            for(var i=0;i<dc.length;i++){
                if(dc[i].Clave.toLowerCase()==='porcentaje_mora'){
                    localStorage.setItem('pctMoraTxt',dc[i].valor+'%');
                }
            }
        }
    });
    var q='';
    var cl=document.getElementById('rrCliente');
    if(cl&&cl.value)q+='&idprestamo='+cl.value;
    if(!q)q='';
    g('recibos/list'+q,function(e,d){
        if(e){document.getElementById('rrbody').innerHTML='<tr><td colspan="7" class="text-danger">'+e+'</td></tr>';return;}
        _rrData=d||[];
        _rrPage=0;
        rrRender();
    });
}

function rrRender(){
    var d=_rrData;
    if(!d||d.length===0){
        document.getElementById('rrbody').innerHTML='<tr><td colspan="7" class="text-muted text-center">'+__('sin_datos')+'</td></tr>';
        document.getElementById('rrPagination').innerHTML='';
        return;
    }
    var total=d.length;
    var from=_rrPage*_rrPageSize;
    var to=Math.min(from+_rrPageSize,total);
    var page=_rrPageSize>0?d.slice(from,to):d;
    var h='';
    for(var i=0;i<page.length;i++){
        var r=page[i];
        var tipo=r.tipo_pago==='completo'?'Completo':'Parcial';
        var fecha=r.fecha_creacion?r.fecha_creacion.substring(0,16):'-';
        var mon='RD$';
        h+='<tr><td>'+r.idrecibo+'</td><td>'+fecha+'</td><td>#'+r.idprestamo+' '+(r.cliente_nombre||'')+' '+(r.cliente_apellido||'')+'</td><td>'+tipo+'</td><td>'+r.nro_cuotas_pagadas+'</td><td>'+mon+' '+fm(r.monto_total)+'</td><td><button class="btn btn-sm btn-outline-secondary" onclick="rrc('+r.idrecibo+')"><i class="bi bi-printer"></i></button></td></tr>';
    }
    document.getElementById('rrbody').innerHTML=h;
    var totalPages=Math.ceil(total/_rrPageSize)||1;
    var pgHtml='<div class="d-flex justify-content-between align-items-center mt-2 px-2"><div class="text-muted small">'+__('mostrando')+' '+Math.min(from+1,total)+'-'+to+' '+__('de')+' '+total+'</div><div class="d-flex align-items-center gap-1"><select class="form-select form-select-sm" style="width:auto" onchange="_rrPageSize=parseInt(this.value);_rrPage=0;rrRender()">';
    [10,25,50,100].forEach(function(s){pgHtml+='<option value="'+s+'"'+(_rrPageSize===s?' selected':'')+'>'+s+'</option>';});
    pgHtml+='<option value="0"'+(_rrPageSize===0?' selected':'')+'>'+__('todos')+'</option></select>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_rrPage=Math.max(0,_rrPage-1);rrRender()" '+(from<=0?'disabled':'')+'><i class="bi bi-chevron-left"></i></button>';
    pgHtml+='<span class="small mx-1">'+(_rrPage+1)+'/'+totalPages+'</span>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_rrPage=Math.min('+(totalPages-1)+',_rrPage+1);rrRender()" '+(to>=total?'disabled':'')+'><i class="bi bi-chevron-right"></i></button>';
    pgHtml+='</div></div>';
    document.getElementById('rrPagination').innerHTML=pgHtml;
}

function rrc(idrecibo){
    g('recibos/list&idrecibo='+idrecibo,function(e,d){
        if(e||!d||d.length===0){alert('Error');return;}
        var r=d[0];
        // Cargar datos del prestamo para obtener cliente y detalle
        g('prestamos/list&IdPrestamo='+r.idprestamo,function(e2,p){
            if(e2||!p||p.length===0) p=[{}];
            var prest=p[0];
            var f=new Date().toLocaleDateString('es-DO');
            var hh=new Date().toLocaleTimeString('es-DO');
            var rec='COMPROBANTE DE PAGO\n';
            rec+='==============================\n';
            rec+='Recibo #'+r.idrecibo+'\n';
            rec+='Prestamo #'+r.idprestamo+'\n';
            rec+='Fecha: '+f+' '+hh+'\n';
            rec+='Cliente: '+(prest.cliente_nombre||r.cliente_nombre||'')+' '+(prest.cliente_apellido||r.cliente_apellido||'')+'\n';
            rec+='Monto Prestamo: '+(prest.moneda_simbolo||'RD$')+' '+fm(r.MontoPrestamo||prest.MontoPrestamo||0)+'\n';
            rec+='-----------------------------\n';
            rec+='PAGO '+(r.tipo_pago==='completo'?'COMPLETO':'PARCIAL')+'\n';
            rec+='-----------------------------\n';
            // Mostrar detalle de cuotas
            var cuotas=r.detalle_cuotas?r.detalle_cuotas.split(','):[];
            for(var ci=0;ci<cuotas.length;ci++){
                rec+='Cuota '+cuotas[ci]+'\n';
            }
            rec+='-----------------------------\n';
            rec+='Total Pagado: '+fm(r.monto_total)+'\n';
            if(parseFloat(r.monto_mora)>0){
                var pctTxt=localStorage.getItem('pctMoraTxt')||'2%';
                var fmtMora=localStorage.getItem('formato_mora_recibo')||'detalle';
                if(fmtMora==='detalle'){
                    rec+='Mora: '+fm(r.monto_mora)+'\n';
                }
                rec+='Se le cobró un '+pctTxt+' de mora\n';
            }
            rec+='==============================\n';
            rec+='Pago realizado correctamente!\n';
            generarRecibo(rec);
        });
    });
}