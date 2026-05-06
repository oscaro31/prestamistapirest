var rbClientesCargados=false;
var _ppPageRb=0,_ppPageSizeRb=10,_rbData=[];

function lr(){
    var waitEl=setInterval(function(){
        if(document.getElementById('rbCliente')){
            clearInterval(waitEl);
            if(!rbClientesCargados){
                g('clientes/list',function(ee,dd){
                    var sel=document.getElementById('rbCliente');
                    if(!ee&&dd){
                        for(var i=0;i<dd.length;i++){
                            sel.innerHTML+='<option value="'+dd[i].IdCliente+'">'+dd[i].Nombre+' '+(dd[i].Apellido||'')+'</option>';
                        }
                        rbClientesCargados=true;
                    }
                    buscar();
                });
            }else{
                buscar();
            }
        }
    },50);
}

function lb(){
    document.getElementById('rbCliente').value='';
    document.getElementById('rbDesde').value='';
    document.getElementById('rbHasta').value='';
    buscar();
}

function buscar(){
    var q='';
    var cl=document.getElementById('rbCliente').value;
    var ds=document.getElementById('rbDesde').value;
    var hs=document.getElementById('rbHasta').value;
    if(cl)q+='&IdCliente='+cl;
    if(ds)q+='&desde='+ds;
    if(hs)q+='&hasta='+hs;
    g('prestamos/list'+q,function(e,d){
        if(e){document.getElementById('rbody').innerHTML='<tr><td colspan="7" class="text-danger">'+e+'</td></tr>';return;}
        _rbData=d||[];
        _ppPageRb=0;
        ppRenderRb();
    });
}

function ppRenderRb(){
    var d=_rbData;
    if(!d||d.length===0){
        document.getElementById('rbody').innerHTML='<tr><td colspan="7" class="text-muted text-center">'+__('sin_datos')+'</td></tr>';
        document.getElementById('rbPagination').innerHTML='';
        return;
    }
    var total=d.length;
    var from=_ppPageRb*_ppPageSizeRb;
    var to=Math.min(from+_ppPageSizeRb,total);
    var page=_ppPageSizeRb>0?d.slice(from,to):d;
    var h='';
    for(var i=0;i<page.length;i++){
        var p=page[i];
        var totalP=0;
        if(p.cuotas){for(var j=0;j<p.cuotas.length;j++){if(p.cuotas[j].Estado==='Pagado')totalP++;}}
        var badgeClass='bg-secondary';
        if(p.Estado==='Cancelado'||p.Estado==='Pagado')badgeClass='bg-success';
        else if(p.Estado==='Vencido')badgeClass='bg-danger';
        else badgeClass='bg-warning';
        h+='<tr><td>'+p.IdPrestamo+'</td><td>'+(p.cliente_nombre||'')+' '+(p.cliente_apellido||'')+'</td><td>'+(p.moneda_simbolo||'RD$')+' '+fm(p.MontoPrestamo)+'</td><td>'+totalP+'/'+p.NroCuotas+'</td><td>'+(p.FechaCreacion?p.FechaCreacion.substring(0,10):'')+'</td><td><span class="badge '+badgeClass+'">'+p.Estado+'</span></td><td><button class="btn btn-sm btn-outline-secondary" onclick="rrc('+p.IdPrestamo+')"><i class="bi bi-printer"></i></button></td></tr>';
    }
    document.getElementById('rbody').innerHTML=h;
    var totalPages=Math.ceil(total/_ppPageSizeRb)||1;
    var pgHtml='<div class="d-flex justify-content-between align-items-center mt-2 px-2"><div class="text-muted small">'+__('mostrando')+' '+Math.min(from+1,total)+'-'+to+' '+__('de')+' '+total+'</div><div class="d-flex align-items-center gap-1"><select class="form-select form-select-sm" style="width:auto" onchange="_ppPageSizeRb=parseInt(this.value);_ppPageRb=0;ppRenderRb()">';
    [10,25,50,100].forEach(function(s){pgHtml+='<option value="'+s+'"'+(_ppPageSizeRb===s?' selected':'')+'>'+s+'</option>';});
    pgHtml+='<option value="0"'+(_ppPageSizeRb===0?' selected':'')+'>'+__('todos')+'</option></select>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageRb=Math.max(0,_ppPageRb-1);ppRenderRb()" '+(from<=0?'disabled':'')+'><i class="bi bi-chevron-left"></i></button>';
    pgHtml+='<span class="small mx-1">'+(_ppPageRb+1)+'/'+totalPages+'</span>';
    pgHtml+='<button class="btn btn-sm btn-outline-secondary" onclick="_ppPageRb=Math.min('+(totalPages-1)+',_ppPageRb+1);ppRenderRb()" '+(to>=total?'disabled':'')+'><i class="bi bi-chevron-right"></i></button>';
    pgHtml+='</div></div>';
    document.getElementById('rbPagination').innerHTML=pgHtml;
}

function rrc(id){
    g('prestamos/list&IdPrestamo='+id,function(e,d){
        if(e||!d||d.length===0){alert('Error');return;}
        var p=d[0];
        var numsPagadas=[];var numsPendientes=[];var totalPagado=0;
        for(var ci=0;ci<(p.cuotas||[]).length;ci++){
            var c=p.cuotas[ci];var n=c.NroCuota||c.numero_cuota||(ci+1);
            if(c.Estado==='Pagado'){numsPagadas.push(n);totalPagado+=parseFloat(c.MontoCuota||0)+parseFloat(c.MoraCalculada||0);}
            else{numsPendientes.push(n);}
        }
        function rangoStr(arr){
            if(!arr||arr.length===0)return 'Ninguna';
            var parts=[];var start=arr[0],end=arr[0];
            for(var ci=1;ci<=arr.length;ci++){
                if(ci<arr.length&&arr[ci]===end+1){end=arr[ci];}
                else{parts.push(start===end?'':start+'-'+end);if(ci<arr.length){start=arr[ci];end=arr[ci];}}
            }
            return parts.join(', ');
        }
        var rec='COMPROBANTE DE PAGO\n';
        rec+='==============================\n';
        rec+='Prestamo #'+p.IdPrestamo+'\n';
        rec+='Cliente: '+(p.cliente_nombre||'')+' '+(p.cliente_apellido||'')+'\n';
        rec+='Monto: '+(p.moneda_simbolo||'RD$')+' '+fm(p.MontoPrestamo)+'\n';
        rec+='Interes: '+p.InteresPorcentaje+'% | Cuotas: '+p.NroCuotas+'\n';
        rec+='Estado: '+p.Estado+'\n';
        rec+='-----------------------------\n';
        rec+='Cuotas Pagadas: '+rangoStr(numsPagadas)+'\n';
        rec+='Cuotas Pendientes: '+rangoStr(numsPendientes)+'\n';
        rec+='-----------------------------\n';
        rec+='CUOTAS PAGADAS\n';
        rec+='-----------------------------\n';
        var totalConMora=0;
        for(var ci=0;ci<(p.cuotas||[]).length;ci++){
            var c=p.cuotas[ci];
            if(c.Estado==='Pagado'){
                var num=c.NroCuota||c.numero_cuota||(ci+1);
                var m=parseFloat(c.MontoCuota||0);
                var mora=parseFloat(c.MoraCalculada||0);
                var totalCuota=m+mora;
                totalConMora+=totalCuota;
                var linea='Cuota #'+num+': RD$ '+fm(totalCuota);
                var fmSel=localStorage.getItem('formato_mora_recibo')||'detalle';
                if(fmSel==='detalle'&&mora>0)linea+=' ('+fm(mora)+' mora '+_pctMoraTxt+')';
                rec+=linea+'\n';
            }
        }
        var fmSel=localStorage.getItem('formato_mora_recibo')||'detalle';
        if(fmSel==='resumen'&&(totalConMora-totalPagado)>0){
            rec+='-----------------------------\n';
            rec+='Se le cobró un '+_pctMoraTxt+' de mora\n';
        }
        rec+='-----------------------------\n';
        rec+='CUOTAS PENDIENTES\n';
        rec+='-----------------------------\n';
        var pendCount=0;
        for(var ci=0;ci<(p.cuotas||[]).length;ci++){
            var c=p.cuotas[ci];
            if(c.Estado!=='Pagado'){
                pendCount++;
                var num=c.NroCuota||c.numero_cuota||(ci+1);
                var m=parseFloat(c.MontoCuota||0);
                rec+='Cuota #'+num+': RD$ '+fm(m)+'\n';
            }
        }
        if(pendCount===0)rec+='Todas las cuotas estan pagadas\n';
        rec+='-----------------------------\n';
        rec+='Total Pagado: RD$ '+fm(totalPagado)+'\n';
        generarRecibo(rec);
    });
}
