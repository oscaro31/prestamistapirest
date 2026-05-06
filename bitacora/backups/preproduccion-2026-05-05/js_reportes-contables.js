var repActual = 'balance';
function cargarReportesContables(){
    cambiarRep('balance');
}
function cambiarRep(tipo) {
    repActual = tipo;
    document.querySelectorAll('#repTabs .nav-link').forEach(function(t) { t.classList.remove('active'); });
    var btns = document.querySelectorAll('#repTabs .nav-link');
    var idx = {balance:0, diario:1, mayor:2, resultados:3, general:4};
    if (btns[(idx[tipo]||0)]) btns[(idx[tipo]||0)].classList.add('active');
    cargarReporte(tipo);
}
function cargarReporte(tipo) {
    var cont = document.getElementById('repContenido');
    cont.innerHTML = '<p class="text-muted text-center py-4">Cargando...</p>';
    if (tipo === 'balance') renderBalance();
    else if (tipo === 'diario') renderDiario();
    else if (tipo === 'mayor') renderMayor();
    else if (tipo === 'resultados') renderResultados();
    else if (tipo === 'general') renderGeneral();
}
function _fmt(n) { return (typeof fms === 'function' ? fms : function(x){return _ms2 + ' ' + (parseFloat(x)||0).toFixed(2)})(n); }
var _ms2 = 'RD$';
function _date(s) { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function _monthStart() { var d = new Date(); return d.getFullYear() + '-01-01'; }
function fechaDesde(t) { return document.getElementById('repFDesde'+t) ? document.getElementById('repFDesde'+t).value : _monthStart(); }
function fechaHasta(t) { return document.getElementById('repFHasta'+t) ? document.getElementById('repFHasta'+t).value : _date(); }

function renderBalance() {
    var h = '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">Desde</label><input type="date" class="form-control form-control-sm" id="repFDesdebalance" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">Hasta</label><input type="date" class="form-control form-control-sm" id="repFHastabalance" value="' + _date() + '"></div>';
    h += '<div class="col-auto"><button class="btn btn-primary btn-sm mt-4" onclick="loadBalance()">Generar</button></div></div>';
    h += '<div class="table-responsive" id="repBalanceTabla"><p class="text-muted text-center">Presione Generar</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadBalance() {
    p('reportes/balance-comprobacion', {fecha_desde: fechaDesde('balance'), fecha_hasta: fechaHasta('balance')}, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = rows || [];
        var h = '<table class="table table-sm table-hover"><thead><tr><th>Codigo</th><th>Cuenta</th><th>Tipo</th><th class="text-end">Debe</th><th class="text-end">Haber</th><th class="text-end">Saldo</th></tr></thead><tbody>';
        var td=0, th=0;
        list.forEach(function(r) {
            h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td>' + r.tipo + '</td>';
            h += '<td class="text-end">' + _fmt(r.total_debe) + '</td><td class="text-end">' + _fmt(r.total_haber) + '</td><td class="text-end">' + _fmt(r.saldo) + '</td></tr>';
            td += parseFloat(r.total_debe)||0; th += parseFloat(r.total_haber)||0;
        });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Totales</td><td></td><td class="text-end">' + _fmt(td) + '</td><td class="text-end">' + _fmt(th) + '</td><td class="text-end">' + _fmt(td-th) + '</td></tr></tfoot></table>';
        document.getElementById('repBalanceTabla').innerHTML = h;
    });
}
function renderDiario() {
    var h = '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">Desde</label><input type="date" class="form-control form-control-sm" id="repFDesdediario" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">Hasta</label><input type="date" class="form-control form-control-sm" id="repFHastadiario" value="' + _date() + '"></div>';
    h += '<div class="col-auto"><button class="btn btn-primary btn-sm mt-4" onclick="loadDiario()">Generar</button></div></div>';
    h += '<div id="repDiarioTabla"><p class="text-muted text-center">Presione Generar</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadDiario() {
    p('reportes/libro-diario', {fecha_desde: fechaDesde('diario'), fecha_hasta: fechaHasta('diario')}, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = rows || [];
        var h = '';
        list.forEach(function(a) {
            h += '<div class="card mb-2"><div class="card-header py-1 small">#' + a.idasiento + ' | ' + a.fecha + ' | ' + a.abreviatura + ' | ' + a.concepto + '</div>';
            h += '<table class="table table-sm mb-0"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Debe</th><th class="text-end">Haber</th></tr></thead><tbody>';
            (a.detalles||[]).forEach(function(d) {
                h += '<tr><td>' + d.codigo + '</td><td>' + d.cuenta_nombre + '</td><td class="text-end">' + _fmt(d.debe) + '</td><td class="text-end">' + _fmt(d.haber) + '</td></tr>';
            });
            h += '</tbody><tfoot><tr><td colspan="2" class="fw-bold">Total</td><td class="text-end fw-bold">' + _fmt(a.total_debe) + '</td><td class="text-end fw-bold">' + _fmt(a.total_haber) + '</td></tr></tfoot></table></div>';
        });
        if (!list.length) h = '<p class="text-muted text-center">' + __('sin_datos') + '</p>';
        document.getElementById('repDiarioTabla').innerHTML = h;
    });
}
function renderMayor() {
    var h = '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">Cuenta</label><select class="form-select form-select-sm" id="repMayorCuenta"><option value="">Cargando...</option></select></div>';
    h += '<div class="col-auto"><label class="form-label small">Desde</label><input type="date" class="form-control form-control-sm" id="repFDesdemayor" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">Hasta</label><input type="date" class="form-control form-control-sm" id="repFHastamayor" value="' + _date() + '"></div>';
    h += '<div class="col-auto"><button class="btn btn-primary btn-sm mt-4" onclick="loadMayor()">Generar</button></div></div>';
    h += '<div id="repMayorTabla"><p class="text-muted text-center">Seleccione cuenta</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
    g('plan-cuenta/list', function(err, d) {
        if (err) return;
        var sel = document.getElementById('repMayorCuenta');
        sel.innerHTML = '<option value="">Seleccionar...</option>';
        ((d||{}).list||[]).forEach(function(c) {
            if (parseInt(c.nivel) >= 3) {
                var o = document.createElement('option');
                o.value = c.idcuenta;
                o.textContent = c.codigo + ' - ' + c.nombre;
                sel.appendChild(o);
            }
        });
    });
}
function loadMayor() {
    var idcuenta = document.getElementById('repMayorCuenta').value;
    if (!idcuenta) { mostrarToast('Seleccione una cuenta', 'warning'); return; }
    p('reportes/libro-mayor', {idcuenta: parseInt(idcuenta), fecha_desde: fechaDesde('mayor'), fecha_hasta: fechaHasta('mayor')}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        var movs = data.movimientos || [];
        var cuenta = data.cuenta || {};
        var h = '<div class="mb-2"><strong>Cuenta:</strong> ' + (cuenta.codigo||'') + ' - ' + (cuenta.nombre||'') + ' | <strong>Saldo Anterior:</strong> ' + _fmt(data.saldo_anterior) + '</div>';
        h += '<table class="table table-sm"><thead><tr><th>Fecha</th><th>Concepto</th><th class="text-end">Debe</th><th class="text-end">Haber</th><th class="text-end">Saldo</th></tr></thead><tbody>';
        movs.forEach(function(m) {
            h += '<tr><td>' + m.fecha + '</td><td>' + m.concepto + '</td><td class="text-end">' + _fmt(m.debe) + '</td><td class="text-end">' + _fmt(m.haber) + '</td><td class="text-end">' + _fmt(m.saldo) + '</td></tr>';
        });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Totales</td><td class="text-end">' + _fmt(data.total_debe) + '</td><td class="text-end">' + _fmt(data.total_haber) + '</td><td class="text-end">' + _fmt(data.saldo_final) + '</td></tr></tfoot></table>';
        document.getElementById('repMayorTabla').innerHTML = h;
    });
}
function renderResultados() {
    var h = '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">Desde</label><input type="date" class="form-control form-control-sm" id="repFDesderesultados" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">Hasta</label><input type="date" class="form-control form-control-sm" id="repFHastaresultados" value="' + _date() + '"></div>';
    h += '<div class="col-auto"><button class="btn btn-primary btn-sm mt-4" onclick="loadResultados()">Generar</button></div></div>';
    h += '<div id="repResultadosTabla"><p class="text-muted text-center">Presione Generar</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadResultados() {
    p('reportes/estado-resultados', {fecha_desde: fechaDesde('resultados'), fecha_hasta: fechaHasta('resultados')}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        var h = '';
        h += '<h6>Ingresos</h6><table class="table table-sm"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Total</th></tr></thead><tbody>';
        (data.ingresos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Total Ingresos</td><td class="text-end">' + _fmt(data.total_ingresos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">Gastos</h6><table class="table table-sm"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Total</th></tr></thead><tbody>';
        (data.gastos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Total Gastos</td><td class="text-end">' + _fmt(data.total_gastos) + '</td></tr></tfoot></table>';
        var cls = parseFloat(data.utilidad_neta) >= 0 ? 'text-success' : 'text-danger';
        h += '<div class="mt-3 fs-5 fw-bold ' + cls + '">Utilidad Neta: ' + _fmt(data.utilidad_neta) + '</div>';
        document.getElementById('repResultadosTabla').innerHTML = h;
    });
}
function renderGeneral() {
    var h = '<div class="card"><div class="card-body">';
    h += '<div class="text-end mb-3"><button class="btn btn-primary btn-sm" onclick="loadGeneral()">Generar</button></div>';
    h += '<div id="repGeneralTabla"><p class="text-muted text-center">Presione Generar</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadGeneral() {
    p('reportes/balance-general', {}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        var h = '';
        h += '<h6>Activos</h6><table class="table table-sm"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Total</th></tr></thead><tbody>';
        (data.activos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Total Activos</td><td class="text-end">' + _fmt(data.total_activos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">Pasivos</h6><table class="table table-sm"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Total</th></tr></thead><tbody>';
        (data.pasivos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Total Pasivos</td><td class="text-end">' + _fmt(data.total_pasivos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">Capital</h6><table class="table table-sm"><thead><tr><th>Codigo</th><th>Cuenta</th><th class="text-end">Total</th></tr></thead><tbody>';
        (data.capital||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">Total Capital</td><td class="text-end">' + _fmt(data.total_capital) + '</td></tr></tfoot></table>';
        h += '<div class="mt-3 fs-5 fw-bold">Total Activos (' + _fmt(data.total_activos) + ') = Total Pasivos (' + _fmt(data.total_pasivos) + ') + Total Capital (' + _fmt(data.total_capital) + ')</div>';
        h += '<div class="mt-2 ' + (data.ecuacion ? 'text-success' : 'text-danger') + ' fw-bold">' + (data.ecuacion ? '✓ Balanceado' : '✗ No balanceado') + '</div>';
        document.getElementById('repGeneralTabla').innerHTML = h;
    });
}