var rbClientesCargados=false;

function lr(){
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
        if(!d||d.length===0){
            document.getElementById('rbody').innerHTML='<tr><td colspan="7" class="text-muted text-center">Sin resultados</td></tr>';
            return;
        }
        var h='';
        for(var i=0;i<d.length;i++){
            var p=d[i];
            var totalP=0;
            if(p.cuotas){for(var j=0;j<p.cuotas.length;j++){if(p.cuotas[j].Estado==='Pagado')totalP++;}}
            h+='<tr><td>'+p.IdPrestamo+'</td><td>'+(p.cliente_nombre||'')+' '+(p.cliente_apellido||'')+'</td><td>'+(p.moneda_simbolo||'RD$')+' '+fm(p.MontoPrestamo)+'</td><td>'+totalP+'/'+p.NroCuotas+'</td><td>'+(p.FechaCreacion?p.FechaCreacion.substring(0,10):'')+'</td><td><span class="badge '+(p.Estado==='Cancelado'?'bc':'bp')+'">'+p.Estado+'</span></td><td><button class="btn btn-sm btn-outline-secondary" onclick="rrc('+p.IdPrestamo+')"><i class="bi bi-printer"></i></button></td></tr>';
        }
        document.getElementById('rbody').innerHTML=h;
    });
}

function rrc(id){
    g('prestamos/list&IdPrestamo='+id,function(e,d){
        if(e||!d||d.length===0){alert('Error');return;}
        var p=d[0];
        var numsPagadas=[];var numsPendientes=[];var totalPagado=0;
        for(var ci=0;ci<(p.cuotas||[]).length;ci++){
            var c=p.cuotas[ci];var n=c.NroCuota||c.numero_cuota||(ci+1);
            if(c.Estado==='Pagado'){numsPagadas.push(n);totalPagado+=parseFloat(c.MontoCuota||0);}
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
        for(var ci=0;ci<(p.cuotas||[]).length;ci++){
            var c=p.cuotas[ci];
            if(c.Estado==='Pagado'){
                var num=c.NroCuota||c.numero_cuota||(ci+1);
                var m=parseFloat(c.MontoCuota||0);
                rec+='Cuota #'+num+': RD$ '+fm(m)+'\n';
            }
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
