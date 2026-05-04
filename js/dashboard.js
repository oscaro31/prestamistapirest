var _mc1=null,_mc2=null,_ld_loading=false;

function ld(){

    g('dashboard/resumen',function(e,d){
        if(e)return;
        
        // Stat cards
        document.getElementById('dClientes').textContent=d.TotalClientes||'0';
        document.getElementById('dTotalPrestamos').textContent=d.TotalPrestamos||'0';
        document.getElementById('dPendientes').textContent=d.PrestamosPendientes||'0';
        document.getElementById('dMontoPrestado').textContent='RD$'+fm(d.MontoTotalPrestado||'0');
        var capitalPendiente = parseFloat(d.MontoTotalPrestado||'0') - parseFloat(d.PagadoCuotas||'0');
        document.getElementById('dCapitalPendiente').textContent='RD$'+fm(capitalPendiente < 0 ? '0' : capitalPendiente.toFixed(2));
        document.getElementById('dVencidas').textContent=d.CuotasVencidas||'0';
        document.getElementById('dProximas').textContent=d.CuotasProximas||'0';
        document.getElementById('dPorCobrar').textContent='RD$'+fm(d.MontoPendiente||'0');
        document.getElementById('dUsuarios').textContent=d.TotalUsuarios||'0';
        document.getElementById('dGanancias').textContent='RD$'+fm(d.InteresTotal||'0.00');
        var gw=document.getElementById('dGananciasWrap');
        if(gw){
            var canSee=user&&(user.idcargo==1||user.idcargo=='1')&&(d.MostrarGanancias==='1');
            gw.style.display=canSee?'':'none';
        }

        // Tablas
        var vbody='',qbody='',qbodyP='',ubody='';
        if(d.CuotasVencidasDetalle&&d.CuotasVencidasDetalle.length>0){
            for(var i=0;i<d.CuotasVencidasDetalle.length;i++){
                var v=d.CuotasVencidasDetalle[i];
                vbody+='<tr><td>'+v.IdPrestamoDetalle+'</td><td>'+(v.cliente_nombre||'')+' '+(v.cliente_apellido||'')+'</td><td>'+v.NroCuota+'</td><td>RD$'+fm(v.MontoCuota)+'</td><td>'+(v.FechaPago?v.FechaPago.substring(0,10):'')+'</td><td class="text-danger fw-bold">'+v.dias_vencido+'</td></tr>';
            }
        }else{vbody='<tr><td colspan="6" class="text-muted text-center"><span data-i18n="sin_datos">Sin datos</span></td></tr>';}
        document.getElementById('vbody').innerHTML=vbody;
        if(d.PrestamosPorQuincena&&d.PrestamosPorQuincena.length>0){
            for(var i=0;i<d.PrestamosPorQuincena.length;i++){
                var q=d.PrestamosPorQuincena[i];
                qbody+='<tr><td>'+q.quincena+'</td><td>'+q.total+'</td><td>RD$'+fm(q.monto)+'</td></tr>';
            }
        }else{qbody='<tr><td colspan="3" class="text-muted text-center"><span data-i18n="sin_datos">Sin datos</span></td></tr>';}
        document.getElementById('qbody').innerHTML=qbody;
        if(d.CobrosPorQuincena&&d.CobrosPorQuincena.length>0){
            for(var i=0;i<d.CobrosPorQuincena.length;i++){
                var c=d.CobrosPorQuincena[i];
                qbodyP+='<tr><td>'+c.quincena+'</td><td>'+c.total+'</td><td>RD$'+fm(c.monto)+'</td></tr>';
            }
        }else{qbodyP='<tr><td colspan="3" class="text-muted text-center"><span data-i18n="sin_datos">Sin datos</span></td></tr>';}
        document.getElementById('qbodyPagos').innerHTML=qbodyP;
        if(d.UltimosPrestamos&&d.UltimosPrestamos.length>0){
            for(var i=0;i<d.UltimosPrestamos.length;i++){
                var p=d.UltimosPrestamos[i];
                ubody+='<tr><td>'+p.IdPrestamo+'</td><td>'+(p.cliente_nombre||'')+' '+(p.cliente_apellido||'')+'</td><td>RD$'+fm(p.MontoPrestamo)+'</td><td><span class="badge '+(p.Estado==='Cancelado'?'bc':'bp')+'">'+p.Estado+'</span></td><td>'+(p.FechaCreacion?p.FechaCreacion.substring(0,10):'')+'</td></tr>';
            }
        }else{ubody='<tr><td colspan="5" class="text-muted text-center"><span data-i18n="sin_datos">Sin datos</span></td></tr>';}
        document.getElementById('ubody').innerHTML=ubody;

        // Destroy old chats
        destroyCharts();
        // Create fresh canvases
        var w1=document.getElementById('chartWrapper1');if(w1)w1.innerHTML='<canvas style="max-height:180px;width:100%"></canvas>';
        var w2=document.getElementById('chartWrapper2');if(w2)w2.innerHTML='<canvas style="max-height:180px;width:100%"></canvas>';
        
        // GRAFICO MESES
        var c1=w1?w1.querySelector('canvas'):null;
        if(c1 && typeof Chart!=='undefined' && d.PrestamosPorMes && d.PrestamosPorMes.length>0){
            var meses=[];var montos=[];
            for(var i=0;i<d.PrestamosPorMes.length;i++){
                meses.push(d.PrestamosPorMes[i].mes);
                montos.push(parseFloat(d.PrestamosPorMes[i].monto));
            }
            try{_mc1=new Chart(c1,{
                type:'bar',
                data:{labels:meses,datasets:[{label:'RD$',data:montos,backgroundColor:'rgba(15,52,96,.7)',borderColor:'#0f3460',borderWidth:1,borderRadius:4}]},
                options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
            });}catch(e){}
        }

        // GRAFICO QUINCENA
        var c2=w2?w2.querySelector('canvas'):null;
        if(c2 && typeof Chart!=='undefined' && d.PrestamosPorQuincena && d.PrestamosPorQuincena.length>0){
            var qlabels=[];var qmontos=[];
            for(var i=0;i<d.PrestamosPorQuincena.length;i++){
                qlabels.push(d.PrestamosPorQuincena[i].quincena);
                qmontos.push(parseFloat(d.PrestamosPorQuincena[i].monto));
            }
            try{_mc2=new Chart(c2,{
                type:'doughnut',
                data:{labels:qlabels,datasets:[{data:qmontos,backgroundColor:['#0f3460','#ffc107'],borderColor:'#fff',borderWidth:2,hoverOffset:6}]},
                options:{responsive:true,maintainAspectRatio:false,animation:false,
                    plugins:{legend:{position:'bottom',labels:{boxWidth:12,font:{size:11}}},
                        tooltip:{callbacks:{label:function(ctx){
                            var total=ctx.dataset.data.reduce(function(a,b){return a+b;},0);
                            var pct=((ctx.parsed/total)*100).toFixed(1);
                            return ctx.label+': RD$ '+ctx.parsed.toLocaleString()+' ('+pct+'%)';
                        }}}
                    }
                }
            });}catch(e){}
        }

        aplicarIdioma();
    });
}

function destroyCharts(){
    if(_mc1){try{_mc1.destroy()}catch(e){};_mc1=null;}
    if(_mc2){try{_mc2.destroy()}catch(e){};_mc2=null;}
}