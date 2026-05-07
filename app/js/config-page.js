function cargarMonedasSelect(){
    g('monedas/list',function(e,d){
        if(e||!d)return;
        var sel=document.getElementById('empresaMoneda');
        if(!sel)return;
        var selectedId=window._monedaSelectId||'0';
        sel.innerHTML='<option value="0">Seleccionar...</option>';
        for(var i=0;i<d.length;i++){
            var selAttr=(String(d[i].IdMoneda)===String(selectedId))?' selected':'';
            sel.innerHTML+='<option value="'+d[i].IdMoneda+'"'+selAttr+'>'+d[i].Nombre+' ('+d[i].Simbolo+')</option>';
        }
    });
}

function lg(){
    // Asegurar que el contenedor base existe
    var pe=document.getElementById('p-config');
    if(pe && !document.getElementById('configBody')){
        pe.innerHTML='<div class="container-fluid p-4"><h3 data-i18n="preferencias">Preferencias</h3><div id="configBody"></div></div>';
    }
    g('config/list',function(e,d){
        if(e)return;
        var ma='';var pm='';var dg='';var lm='';var fmt='punto-venta';
        for(var i=0;i<d.length;i++){
            var c=d[i];var cl=c.Clave.toLowerCase();
            if(cl==='moraactiva')ma=c.valor;
            if(cl==='porcentajemoradiario')pm=c.valor;
            if(cl==='dias_gracia'||cl==='diasgracia')dg=c.valor;
            if(cl==='limite'||cl==='limite_maximo'||cl==='prestamo_maximo')lm=c.valor;
            if(cl==='formato_recibo')fmt=c.valor;
            if(cl==='formato_mora_recibo'){
                var el=document.getElementById('cfgFormatoMora');
                if(el)el.value=c.valor;
            }
            if(cl==='tipomora'){var e=document.getElementById('cfgTipoMora');if(e)e.value=c.valor;}
            if(cl==='mostrarganancias'||cl==='MostrarGanancias'){var cb=document.getElementById('cfgMostrarGanancias');if(cb)cb.checked=c.valor==='1';}
            if(cl==='empresa_nombre'){var e=document.getElementById('empresaNombre');if(e)e.value=c.valor;}
            if(cl==='empresa_direccion'){var e=document.getElementById('empresaDir');if(e)e.value=c.valor;}
            if(cl==='empresa_telefono'){var e=document.getElementById('empresaTel');if(e)e.value=c.valor;}
            if(cl==='moneda_default'){var msId=c.valor;window._monedaSelectId=msId;cargarMonedasDefaultSymbol(msId);}
        }
        var e1=document.getElementById('cfgMora');if(e1)e1.value=ma;
        var e2=document.getElementById('cfgPorcentaje');if(e2)e2.value=pm;
        var e3=document.getElementById('cfgGracia');if(e3)e3.value=dg;
        var e4=document.getElementById('cfgLimite');if(e4)e4.value=lm;
        var e5=document.getElementById('cfgFormato');if(e5)e5.value=fmt;
    });
    setTimeout(function(){cargarMonedasSelect();},100);
}

function guardarEmpresa(){
    var n=document.getElementById('empresaNombre').value.trim();
    var d=document.getElementById('empresaDir').value.trim();
    var t=document.getElementById('empresaTel').value.trim();
    if(!n){alert('Nombre requerido');return;}
    var c=0;var o=false;
    function fn(){c++;if(c>=3){if(o)mostrarToast('Guardado en BD','success');lg();}}
    p('config/update',{Clave:'empresa_nombre',valor:n},function(e){if(!e)o=true;fn();});
    p('config/update',{Clave:'empresa_direccion',valor:d||''},function(e){if(!e)o=true;fn();});
    p('config/update',{Clave:'empresa_telefono',valor:t||''},function(e){if(!e)o=true;fn();});
    var ms=document.getElementById('empresaMoneda').value;
    if(ms&&ms!=='0'){c++;p('config/update',{Clave:'moneda_default',valor:ms},function(e){if(!e)o=true;fn();});}
}

function resetEmpresa(){
    if(!confirm('Restaurar valores por defecto?'))return;
    document.getElementById('empresaNombre').value='Prestamist';
    document.getElementById('empresaDir').value='Santo Domingo, RD';
    document.getElementById('empresaTel').value='809-000-0000';
    document.getElementById('empresaMoneda').value='RD$';
    guardarEmpresa();
}

function cargarMonedasDefaultSymbol(idmoneda){
    if(!idmoneda||idmoneda==='0'){_moneda_simbolo='RD$';localStorage.setItem('moneda_simbolo','RD$');return;}
    g('monedas/list',function(e,d){
        if(e||!d)return;
        for(var i=0;i<d.length;i++){
            if(d[i].IdMoneda==idmoneda||d[i].IdMoneda==parseInt(idmoneda)){
                _moneda_simbolo=d[i].Simbolo;
                localStorage.setItem('moneda_simbolo',d[i].Simbolo);
                break;
            }
        }
    });
}

function guardarConfig(){
    var m=document.getElementById('cfgMora').value.trim();
    var pc=document.getElementById('cfgPorcentaje').value.trim();
    var g=document.getElementById('cfgGracia').value.trim();
    var l=document.getElementById('cfgLimite').value.trim();
    var n=0;var t=0;
    function f(){n--;if(n<=0&&t>0){lg();mostrarToast('Guardado correctamente','success');}}
    var ft=document.getElementById('cfgFormato').value;
    if(ft){n++;t++;(function(v){p('config/update',{Clave:'formato_recibo',valor:v},function(e){if(e)alert(e);else f();});})(ft);}
    var fmo=document.getElementById('cfgFormatoMora').value;
    if(fmo){n++;t++;(function(v){localStorage.setItem('formato_mora_recibo',v);p('config/update',{Clave:'formato_mora_recibo',valor:v},function(e){if(e)alert(e);else f();});})(fmo);}
    if(m){n++;t++;(function(v){p('config/update',{Clave:'MoraActiva',valor:v},function(e){if(e)alert(e);else f();});})(m);}
    if(pc){n++;t++;(function(v){p('config/update',{Clave:'PorcentajeMoraDiario',valor:v},function(e){if(e)alert(e);else f();});})(pc);}
    if(g){n++;t++;(function(v){p('config/update',{Clave:'Dias_Gracia',valor:v},function(e){if(e)alert(e);else f();});})(g);}
    if(l){n++;t++;(function(v){p('config/update',{Clave:'Limite',valor:v},function(e){if(e)alert(e);else f();});})(l);}
    if(t===0)alert('Complete al menos un campo');
    var tm=document.getElementById('cfgTipoMora').value;
    n++;t++;p('config/update',{Clave:'TipoMora',valor:tm},function(e){if(e)alert(e);f();});
    var mg=document.getElementById('cfgMostrarGanancias');
    if(mg){var mgv=mg.checked?'1':'0';n++;t++;p('config/update',{Clave:'MostrarGanancias',valor:mgv},function(e){if(e)alert(e);f();});}
}
