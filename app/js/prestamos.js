var cfgCache = {};
var _vpIds=[],_montosPagar=[],_pagarTodo=true,_vpChecks=[],_vpPrestamoIdGlobal=0;
var _ppData = [];
var _ppPage = 0;
var _ppPageSize = 10;
var _ppSortCol = '';
var _ppSortDir = 'asc';

function lp() {
    g('prestamos/list', function(e, d) {
        if (e) { document.getElementById('pbody').innerHTML = '<tr><td colspan="8" class="text-danger">' + e + '</td></tr>'; return; }
        _ppData = d || [];
        _ppPage = 0;
        ppRender();
    });
}

function ppSetPageSize(v) { _ppPageSize = parseInt(v); _ppPage = 0; ppRender(); }
function ppPrevPage() { if (_ppPage > 0) { _ppPage--; ppRender(); } }
function ppNextPage() { if ((_ppPage + 1) * _ppPageSize < _ppData.length) { _ppPage++; ppRender(); } }

function ppToggleSort(col) {
    if (_ppSortCol == col) { _ppSortDir = _ppSortDir == 'asc' ? 'desc' : 'asc'; } 
    else { _ppSortCol = col; _ppSortDir = 'asc'; }
    _ppData.sort(function(a, b) {
        var va = typeof a[col] != 'undefined' ? a[col] : '';
        var vb = typeof b[col] != 'undefined' ? b[col] : '';
        if (typeof va == 'number' && typeof vb == 'number') return _ppSortDir == 'asc' ? va - vb : vb - va;
        va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
        return _ppSortDir == 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    _ppPage = 0;
    ppRender();
}

function ppRender() {
    var q = document.getElementById('filtroBusqueda').value.toLowerCase().trim();
    var es = document.getElementById('filtroEstado').value;
    var dados = _ppData;
    if (q) {
        dados = dados.filter(function(p) {
            return (p.cliente_nombre || '').toLowerCase().indexOf(q) > -1 || (p.cliente_apellido || '').toLowerCase().indexOf(q) > -1;
        });
    }
    if (es) { dados = dados.filter(function(p) { return p.Estado === es; }); }

    var total = dados.length;
    var from = _ppPage * _ppPageSize;
    var to = Math.min(from + _ppPageSize, total);
    var page = dados.slice(from, to);

    var sorter = function(col, label) {
        var arrow = _ppSortCol == col ? (_ppSortDir == 'asc' ? '\u25B2' : '\u25BC') : '';
        return '<th onclick="ppToggleSort(\'' + col + '\')" style="cursor:pointer;white-space:nowrap;user-select:none">' + label + arrow + '</th>';
    };

    var h = '';
    if (!page.length) {
        h += '<tr><td colspan="7" class="text-center text-muted py-3">Sin datos</td></tr>';
    }
    for (var i = 0; i < page.length; i++) {
        var p = page[i];
        h += '<tr><td>' + p.IdPrestamo + '</td>' +
            '<td>' + (p.cliente_nombre || '') + ' ' + (p.cliente_apellido || '') + '</td>' +
            '<td>' + fms(p.MontoPrestamo) + '</td>' +
            '<td>' + p.InteresPorcentaje + '%</td>' +
            '<td>' + p.NroCuotas + '</td>' +
            '<td><span class="badge ' + (p.Estado === 'Cancelado' ? 'bg-success' : 'bg-warning text-dark') + '">' + p.Estado + '</span></td>' +
            '<td><button class="btn btn-sm btn-outline-info py-0 px-1" onclick="vp(' + p.IdPrestamo + ')"><i class="bi bi-eye"></i></button> ' +
            '<button class="btn btn-sm btn-outline-secondary py-0 px-1" onclick="ia(' + p.IdPrestamo + ')"><i class="bi bi-printer"></i></button></td></tr>';
    }

    document.getElementById('pbody').innerHTML = h;

    var info = document.getElementById('pInfo');
    if (info) info.textContent = (total > 0 ? (from + 1) : 0) + '-' + to + ' / ' + total;

    var pagHtml = '';
    var totalPag = Math.max(1, Math.ceil(total / _ppPageSize));
    pagHtml += '<li class="page-item' + (_ppPage === 0 ? ' disabled' : '') + '"><a class="page-link" href="#" onclick="ppPrevPage();return false">&laquo;</a></li>';
    pagHtml += '<li class="page-item disabled"><a class="page-link" href="#">Pág ' + (_ppPage + 1) + '/' + totalPag + '</a></li>';
    pagHtml += '<li class="page-item' + ((_ppPage + 1) * _ppPageSize >= total ? ' disabled' : '') + '"><a class="page-link" href="#" onclick="ppNextPage();return false">&raquo;</a></li>';

    var selectHtml = '<select class="form-select form-select-sm" style="width:auto;display:inline-block" onchange="ppSetPageSize(this.value)">' +
        '<option value="10"' + (_ppPageSize == 10 ? ' selected' : '') + '>10</option>' +
        '<option value="25"' + (_ppPageSize == 25 ? ' selected' : '') + '>25</option>' +
        '<option value="50"' + (_ppPageSize == 50 ? ' selected' : '') + '>50</option>' +
        '<option value="100"' + (_ppPageSize == 100 ? ' selected' : '') + '>100</option></select>';

    document.getElementById('pPaginacion').innerHTML = pagHtml;
    document.getElementById('pPageSizeSelect').innerHTML = selectHtml;
}

function cambiarItemsPagina() {
    ppSetPageSize(document.getElementById('filtroItems').value);
}

function filterPrestamos() {
    _ppPage = 0;
    ppRender();
}

function cargarTiposCuota(){
    g('prestamos/tipocuota',function(e,d){
        if(e||!d)return;
        var sel=document.getElementById('npTipoCuota');
        sel.innerHTML='';
        for(var i=0;i<d.length;i++){
            sel.innerHTML+='<option value="'+d[i].idtipocuota+'">'+d[i].Nombre+'</option>';
        }
    });
}

function cargarConfig() {
    g('config/list', function(e, d) {
        if (e) return;
        for (var i = 0; i < d.length; i++) {
            cfgCache[(d[i].Clave || '').toLowerCase()] = d[i].valor;
        }
    });
}

function abrirModalPrestamo() {
    cargarConfig();
    g('clientes/list', function(e, d) {
        var sel = document.getElementById('npCliente');
        sel.innerHTML = '<option value="">Seleccionar...</option>';
        if (d) for (var i = 0; i < d.length; i++) sel.innerHTML += '<option value="' + d[i].IdCliente + '">' + d[i].Nombre + ' ' + (d[i].Apellido || '') + '</option>';
    });
    ;
    document.getElementById('npFecha').value = new Date().toISOString().substring(0, 10);
    document.getElementById('npMonto').value = '';
    document.getElementById('npCuotas').value = '';
    document.getElementById('npInteres').value = '';
    new bootstrap.Modal(document.getElementById('modalPrestamo')).show();
}

function calcularPrestamo() {
    var cl = document.getElementById('npCliente').value;
    var mt = parseFloat(document.getElementById('npMonto').value) || 0;
    var nc = parseInt(document.getElementById('npCuotas').value) || 0;
    var tasa = parseFloat(document.getElementById('npInteres').value) || 0;
    if (!cl || !mt || !nc) {
        document.getElementById('npResumen').innerHTML = '<span class="text-muted">Complete campos</span>';
        return;
    }
    var t = mt + (mt * tasa / 100 * nc / 12);
    var pc = Math.round((t / nc) * 100) / 100;
    document.getElementById('npResumen').innerHTML = '<strong>Resumen:</strong> Monto: RD$' + fm(mt) + ' | Interes: ' + tasa + '% | Cuotas: ' + nc + ' | Valor cuota: RD$' + fm(pc) + ' | Total: RD$' + Math.round(t * 100) / 100;
}

function guardarPrestamo() {
    var cl = document.getElementById('npCliente').value;
    var mt = parseFloat(document.getElementById('npMonto').value) || 0;
    var nc = parseInt(document.getElementById('npCuotas').value) || 0;
    var tasa = parseFloat(document.getElementById('npInteres').value) || 0;
    var fi = document.getElementById('npFecha').value;
    if (!cl || !mt || !nc) { alert('Complete todos los campos'); return; }
    var cfg = cfgCache || {};
    if (cfg['limite'] && mt > parseFloat(cfg['limite'])) {
        alert('El monto excede el limite maximo de RD$' + parseFloat(cfg['limite']).toFixed(2));
        return;
    }
    var t = Math.round((mt + (mt * tasa / 100 * nc / 12)) * 100) / 100;
    var pc = Math.round((t / nc) * 100) / 100;
    p('prestamos/create', {
        IdCliente: parseInt(cl), IdMoneda: (parseInt(localStorage.getItem('moneda_id'))||1), MontoPrestamo: mt,
        InteresPorcentaje: tasa, NroCuotas: nc, FechaInicioPago: fi,
        FormaDePago: 'Mensual', ValorPorCuota: pc,
        ValorInteres: Math.round((t - mt) * 100) / 100, ValorTotal: t
    }, function(e) {
        if (e) { alert(e); } else {
            var m = bootstrap.Modal.getInstance(document.getElementById('modalPrestamo'));
            if (m) m.hide();
            var nom = document.getElementById('npCliente').selectedOptions[0].textContent || '';
            mostrarToast('Prestamo creado - Cliente: ' + nom, 'success');
            lp();
        }
    });
}

function vp(id) {
    g('prestamos/list&IdPrestamo=' + id, function(e, d) {
        if (e || !d || d.length === 0) { alert('Error al cargar'); return; }
        var p = d[0];
        document.getElementById('vpId').textContent = p.IdPrestamo;
        document.getElementById('vpCliente').textContent = (p.cliente_nombre || '') + ' ' + (p.cliente_apellido || '');
        document.getElementById('vpMonto').textContent = fms(p.MontoPrestamo);
        document.getElementById('vpInteres').textContent = p.InteresPorcentaje + '%';
        document.getElementById('vpCuotas').textContent = p.NroCuotas;
        document.getElementById('vpEstado').textContent = p.Estado || '-';
        document.getElementById('vpEstado').className = 'badge ' + (p.Estado === 'Cancelado' ? 'bg-success' : 'bg-warning text-dark');
        document.getElementById('vpFecha').textContent = p.FechaInicioPago || p.fecha_inicio || '-';
        var total = parseFloat(p.ValorTotal || p.ValorPorCuota * p.NroCuotas || 0);
        document.getElementById('vpTotal').textContent = 'Total: ' + (p.moneda_simbolo || 'RD$') + ' ' + total.toFixed(2);
        var tab = '';
        if (p.cuotas && p.cuotas.length > 0) {
            for (var i = 0; i < p.cuotas.length; i++) {
                var c = p.cuotas[i];
                var num = c.NroCuota || c.numero_cuota || (i + 1);
                var f = c.FechaPago || c.fecha_vencimiento || '-';
                var m = c.MontoCuota || c.monto || 0;
                var est = c.Estado || 'Pendiente';
                var badge = est === 'Pagado' ? 'bg-success' : 'bg-secondary';
                var mora = c.MoraCalculada ? parseFloat(c.MoraCalculada) : 0;
                tab += '<tr><td>' + num + '</td><td>' + f + '</td><td>RD$ ' + fm(m) + '</td><td>RD$ ' + fm(parseFloat(c.MontoPagado||0)) + '</td><td>RD$ ' + fm(Math.max(0, parseFloat(m) - parseFloat(c.MontoPagado||0))) + '</td><td><span class="badge ' + badge + '">' + est + '</span></td><td>' + (est !== 'Pagado' ? '<input type="checkbox" class="vp-check" value="' + c.IdPrestamoDetalle + '" data-num="' + num + '" data-mora="' + (c.MoraCalculada?parseFloat(c.MoraCalculada):0) + '">' : '') + '</td></tr>';
            }
        } else {
            tab = '<tr><td colspan="7" class="text-muted text-center">Sin cuotas</td></tr>';
        }
        document.getElementById('vpBody').innerHTML = tab;
        window._vpPrestamoId=id;document.getElementById('vpAccion').onclick=function(){window._vpPrestamoId=id;abrirModalPagoCuotas();};
        document.getElementById('vpSeleccionar').onclick = function() { seleccionarTodasCuotas(); };
        document.getElementById('vpDeseleccionar').onclick = function() { deseleccionarTodasCuotas(); };
        new bootstrap.Modal(document.getElementById('modalVerPrestamo')).show();
    var span=document.querySelector('#modalVerPrestamo [data-i18n]');
    if(span)span.textContent=__(span.getAttribute('data-i18n')||'');
    });
}


function abrirModalPagoCuotas(){
    _vpChecks=document.querySelectorAll('.vp-check:checked');
    if(_vpChecks.length===0){alert('Selecciona al menos una cuota');return;}
    _vpPrestamoIdGlobal=window._vpPrestamoId||0;
    document.getElementById('mpPagarTodo').checked=true;
    document.getElementById('mpMontoPagar').value='';
    document.getElementById('mpMontoPagar').disabled=true;
    var txt=_vpChecks.length+' '+__('seleccionadas')+' ';
    document.getElementById('mpResumen').textContent=txt;
    new bootstrap.Modal(document.getElementById('modalPagoCuotas')).show();
    if(typeof aplicarIdioma==='function')aplicarIdioma();
    setTimeout(function(){if(typeof aplicarIdioma==='function')aplicarIdioma();},100);
}

function togglePagoTotal(){
    var chk=document.getElementById('mpPagarTodo');
    var inp=document.getElementById('mpMontoPagar');
    inp.disabled=chk.checked;
    if(chk.checked)inp.value='';
}

function confirmarPagoCuotas(){
    var chk=document.getElementById('mpPagarTodo');
    var ids=[];var montosPagar=[];
    for(var i=0;i<_vpChecks.length;i++){
        ids.push(parseInt(_vpChecks[i].value));
        if(!chk.checked){
            var m=getMonVal(document.getElementById('mpMontoPagar'))||0;
            montosPagar.push(m);
        }else{
            montosPagar.push(0);
        }
    }
    var pagarTodo=chk.checked;
    var m=bootstrap.Modal.getInstance(document.getElementById('modalPagoCuotas'));
    if(m)m.hide();
    var m2=bootstrap.Modal.getInstance(document.getElementById('modalVerPrestamo'));
    if(m2)m2.hide();
    _pagarTodo=pagarTodo;
    if(!pagarTodo){
        var totalMonto=getMonVal(document.getElementById('mpMontoPagar'))||0;
        montosPagar=[];
        var porCuota=(totalMonto/ids.length);
        for(var i=0;i<ids.length;i++){montosPagar.push(porCuota);}
    }
    _montosPagar=pagarTodo?[]:montosPagar;
    _vpIds=ids;
    var prestamoId=_vpPrestamoIdGlobal||window._vpPrestamoId||0;
    pagarCuotas(prestamoId);
}

function pagarCuotas(id) {
    var ids = _vpIds.length > 0 ? _vpIds : [];
    if (ids.length === 0) { alert('Selecciona al menos una cuota'); return; }
    
    p('prestamos/pagar', { IdPrestamo: id, detallesIds: ids, montosPagar: _pagarTodo?[]:_montosPagar, pagarTodo: _pagarTodo===true||_pagarTodo==='true' }, function(e) {
        if (e) { alert(e); return; }
        mostrarToast('Pago realizado correctamente', 'success');
        g('prestamos/list&IdPrestamo=' + id, function(e2, d2) {
            var p = d2 && d2[0];
            if (!p) { alert('Error'); return; }
            var ahora = new Date();
            var f = ahora.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
            var h = ahora.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            var restante = 0;
            var pagadoTotal = 0;
            if (p.cuotas) {
                for (var i = 0; i < p.cuotas.length; i++) {
                    var c = p.cuotas[i];
                    if (c.Estado === 'Pagado') pagadoTotal += parseFloat(c.MontoCuota || 0);
                    else restante += parseFloat(c.MontoCuota || 0);
                }
            }
            if (!_pagarTodo && _montosPagar && _montosPagar.length > 0) {
                pagadoTotal = 0;
                for (var i = 0; i < _montosPagar.length; i++) { pagadoTotal += parseFloat(_montosPagar[i]||0); }
            }
                                                // Build detailed receipt with per-cuota info using _vpIds
            var rec = 'RECIBO DE PAGO\n';
            rec += 'Fecha: ' + f + '  Hora: ' + h + '\n';
            rec += '=================================\n';
            rec += (_pagarTodo ? 'PAGO TOTAL DE CUOTAS' : 'ABONO PARCIAL') + '\n';
            rec += '=================================\n';
            rec += 'Prestamo #' + p.IdPrestamo + '\n';
            rec += 'Cliente: ' + (p.cliente_nombre || '') + ' ' + (p.cliente_apellido || '') + '\n';
            rec += '---------------------------------\n';
            // Build rangos
            var numsPagadas = [];
            var numsPendientes = [];
            for (var ci = 0; ci < (p.cuotas||[]).length; ci++) {
                var n = p.cuotas[ci].NroCuota||p.cuotas[ci].numero_cuota||(ci+1);
                if (p.cuotas[ci].Estado === 'Pagado') numsPagadas.push(n);
                else numsPendientes.push(n);
            }
            function rangoStr(arr) {
                if (!arr || arr.length === 0) return 'Ninguna';
                var parts = [];
                var start = arr[0], end = arr[0];
                for (var ci = 1; ci <= arr.length; ci++) {
                    if (ci < arr.length && arr[ci] === end + 1) { end = arr[ci]; }
                    else {
                        parts.push(start === end ? '' + start : start + '-' + end);
                        if (ci < arr.length) { start = arr[ci]; end = arr[ci]; }
                    }
                }
                return parts.join(', ');
            }
            rec += 'Cuotas Pagadas: ' + rangoStr(numsPagadas) + '\n';
            rec += 'Cuotas Pendientes: ' + rangoStr(numsPendientes) + '\n';
            rec += '---------------------------------\n';
            rec += 'CUOTAS PAGADAS EN ESTA TRANSACCION\n';
            rec += '---------------------------------\n';
            // Use _vpIds to show only the cuotas that were just paid
            var paidNumbers = [];
            var totalRec = 0;
            for (var ci = 0; ci < (_vpIds||[]).length; ci++) {
                for (var di = 0; di < (p.cuotas||[]).length; di++) {
                    if (parseInt(p.cuotas[di].IdPrestamoDetalle) === parseInt(_vpIds[ci])) {
                        var montoCuo = 0;
                        if (_pagarTodo) {
                            montoCuo = parseFloat(p.cuotas[di].MontoCuota||0);
                        } else if (_montosPagar && _montosPagar.length > ci) {
                            montoCuo = parseFloat(_montosPagar[ci]||0);
                        } else {
                            montoCuo = 0;
                        }
                        totalRec += montoCuo;
                        paidNumbers.push({num: p.cuotas[di].NroCuota||p.cuotas[di].numero_cuota||(di+1), monto: fms(montoCuo)});
                    }
                }
            }
            if (paidNumbers.length > 0) {
                for (var ci = 0; ci < paidNumbers.length; ci++) {
                    rec += 'Cuota #' + paidNumbers[ci].num + ': ' + paidNumbers[ci].monto + '\n';
                }
            }
            rec += '---------------------------------\n';
            rec += 'CUOTAS PENDIENTES (restantes)\n';
            rec += '---------------------------------\n';
            var pendCount = 0;
            for (var di = 0; di < (p.cuotas||[]).length; di++) {
                if (p.cuotas[di].Estado !== 'Pagado') {
                    pendCount++;
                    rec += 'Cuota #' + (p.cuotas[di].NroCuota||p.cuotas[di].numero_cuota||(di+1)) + ': ' + fms(parseFloat(p.cuotas[di].MontoCuota||0)) + '\n';
                }
            }
            if (pendCount === 0) rec += 'Todas las cuotas estan pagadas\n';
            rec += '---------------------------------\n';
            rec += 'Total Pagado Ahora: ' + fms(totalRec) + '\n';
            if (p.MontoPrestamo) rec += 'Monto Original: ' + fms(p.MontoPrestamo) + '\n';
            rec += 'Saldo Restante: ' + fms(restante) + '\n';
            rec += '==============================\n';
            rec += 'Pago realizado correctamente!';
            generarRecibo(rec);
            lp();
        });
    });
}function seleccionarTodasCuotas() {
    var c = document.querySelectorAll('.vp-check');
    for (var i = 0; i < c.length; i++) c[i].checked = true;
}

function deseleccionarTodasCuotas() {
    var c = document.querySelectorAll('.vp-check');
    for (var i = 0; i < c.length; i++) c[i].checked = false;
}

function ia(id) {
    g('prestamos/list&IdPrestamo=' + id, function(e, d) {
        if (e || !d || d.length === 0) { alert('Error'); return; }
        var p = d[0];
        var nc = p.NroCuotas || (p.cuotas ? p.cuotas.length : 0);
        var mon = (p.moneda_simbolo || 'RD$');
        var rec = 'TABLA DE AMORTIZACION\\n';
        rec += '====================================\\n';
        rec += 'Prestamo #' + p.IdPrestamo + '\\n';
        rec += 'Cliente: ' + (p.cliente_nombre || '') + ' ' + (p.cliente_apellido || '') + '\\n';
        rec += 'Monto: ' + mon + ' ' + fm(p.MontoPrestamo) + '\\n';
        rec += 'Interes: ' + p.InteresPorcentaje + '% | Cuotas: ' + nc + '\\n';
        rec += '------------------------------------\\n';
        rec += ' #   Fecha        Monto      Estado\\n';
        rec += '------------------------------------\\n';
        if (p.cuotas && p.cuotas.length > 0) {
            for (var i = 0; i < p.cuotas.length; i++) {
                var c = p.cuotas[i];
                var num = c.NroCuota || c.numero_cuota || (i + 1);
                var f = c.FechaPago || c.fecha_vencimiento || '-';
                var m = fm(c.MontoCuota || c.monto || 0);
                var est = c.Estado === 'Pagado' ? 'Pagada' : 'Pendiente';
                while (num.length < 3) num = ' ' + num;
                while (m.length < 10) m = ' ' + m;
                rec += ' ' + num + '  ' + f + ' ' + m + '  ' + est + '\\n';
            }
        } else {
            for (var i = 0; i < nc; i++) {
                var num2 = (i + 1);
                var m2 = fm(p.ValorPorCuota || 0);
                while (num2 < 3) num2 = ' ' + num2;
                while (m2 < 10) m2 = ' ' + m2;
                rec += ' ' + num2 + '  -            ' + m2 + '  Pendiente\\n';
            }
        }
        var total = fm(p.ValorTotal || p.ValorPorCuota * nc || 0);
        rec += '------------------------------------\\n';
        rec += 'Total a pagar: ' + mon + ' ' + total + '\\n';
        generarRecibo(rec);
    });
}

function generarRecibo(contenido) {
    g('config/list', function(e, d) {
        var en = 'Prestamist', ed = 'Santo Domingo, RD', et = '809-000-0000', fmt = 'punto-venta';
        if (!e && d) {
            for (var i = 0; i < d.length; i++) {
                var cl = d[i].Clave.toLowerCase();
                if (cl === 'empresa_nombre') en = d[i].valor;
                if (cl === 'empresa_direccion') ed = d[i].valor;
                if (cl === 'empresa_telefono') et = d[i].valor;
                if (cl === 'formato_recibo') fmt = d[i].valor;
            }
        }
        var r = '\\n';
        r += '         ' + en + '\\n';
        r += '         ' + ed + '\\n';
        r += '         Tel: ' + et + '\\n';
        r += '==============================\\n';
        r += contenido;
        r += '\\n\\n\\n\\n';
        if (fmt === 'boleta') {
            r += '------------------------------------\\n';
            r += '\\nRecibido por: _______________________\\n';
            r += '\\nEntregado por: ______________________\\n\\n';
        }
        formatoRecibo = fmt;
        imprimirRecibo(r, fmt);
    });
}

function abrirNuevoPrestamo(){
    var m=new bootstrap.Modal(document.getElementById('npModal'));
    // Reset form
    document.getElementById('npCliente').value='';
    document.getElementById('npMonto').value='';
    document.getElementById('npTasa').value='';
    document.getElementById('npPlazo').value='';
    document.getElementById('npTipoCuota').value='3';
    m.show();
}