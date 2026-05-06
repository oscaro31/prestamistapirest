var repActual = null;

function cargarReportesContables(){
    mostrarMenuReportes();
}

function mostrarMenuReportes() {
    repActual = null;
    var cont = document.getElementById('repContenido');
    var h = '<div class="row g-3">';
    var reportes = [
        {key: 'balance', label: 'Balance de Comprobación', icon: 'bi-list-check', color: '#0d6efd'},
        {key: 'diario', label: 'Libro Diario', icon: 'bi-journal-text', color: '#198754'},
        {key: 'mayor', label: 'Libro Mayor', icon: 'bi-book', color: '#6f42c1'},
        {key: 'resultados', label: 'Estado de Resultados', icon: 'bi-bar-chart', color: '#ffc107'},
        {key: 'general', label: 'Balance General', icon: 'bi-pie-chart', color: '#dc3545'},
    ];
    reportes.forEach(function(r) {
        h += '<div class="col-md-4 col-lg-3"><div class="card border-0 shadow-sm" style="cursor:pointer;transition:transform .15s" onmouseover="this.style.transform=\'scale(1.02)\'" onmouseout="this.style.transform=\'scale(1)\'" onclick="abrirReporte(\'' + r.key + '\')">';
        h += '<div class="card-body text-center py-4">';
        h += '<div style="font-size:2.5rem;color:' + r.color + '"><i class="bi ' + r.icon + '"></i></div>';
        h += '<h6 class="mt-2 mb-0">' + r.label + '</h6>';
        h += '</div></div></div>';
    });
    h += '</div>';
    cont.innerHTML = h;
}

function abrirReporte(tipo) {
    repActual = tipo;
    var cont = document.getElementById('repContenido');
    if (tipo === 'balance') renderBalance();
    else if (tipo === 'diario') renderDiario();
    else if (tipo === 'mayor') renderMayor();
    else if (tipo === 'resultados') renderResultados();
    else if (tipo === 'general') renderGeneral();
}

function _fmt(n) { return (typeof fms === 'function' ? fms : function(x){return _ms2 + ' ' + (parseFloat(x)||0).toFixed(2)})(n); }
var _ms2 = 'RD$';
function _date() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function _monthStart() { var d = new Date(); return d.getFullYear() + '-01-01'; }

function volverReportes() {
    mostrarMenuReportes();
}

function renderBalance() {
    var h = '<div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">' + __('balance_comprobacion') + '</h5><button class="btn btn-sm btn-outline-secondary" onclick="volverReportes()"><i class="bi bi-arrow-left"></i> ' + __('volver') + '</button></div>';
    h += '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">' + __('fecha_desde') + '</label><input type="date" class="form-control form-control-sm" id="repFDesde" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">' + __('fecha_hasta') + '</label><input type="date" class="form-control form-control-sm" id="repFHasta" value="' + _date() + '"></div>';
    h += '<div class="col-auto d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="loadBalance()"><i class="bi bi-search"></i> ' + __('generar') + '</button></div></div>';
    h += '<div class="table-responsive" id="repBalanceTabla"><p class="text-muted text-center py-4">' + 'Presione Generar' + '</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadBalance() {
    var fdesde = document.getElementById('repFDesde').value;
    var fhasta = document.getElementById('repFHasta').value;
    p('reportes/balance-comprobacion', {fecha_desde: fdesde, fecha_hasta: fhasta}, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (Array.isArray(rows)?rows:[]) || [];
        var h = '<table class="table table-sm table-hover"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th>' + __('tipo') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th><th class="text-end">' + __('saldo') + '</th></tr></thead><tbody>';
        var td=0, th=0;
        list.forEach(function(r) {
            h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td>' + r.tipo + '</td>';
            h += '<td class="text-end">' + _fmt(r.total_debe) + '</td><td class="text-end">' + _fmt(r.total_haber) + '</td><td class="text-end">' + _fmt(r.saldo) + '</td></tr>';
            td += parseFloat(r.total_debe)||0; th += parseFloat(r.total_haber)||0;
        });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + __('totales') + '</td><td></td><td class="text-end">' + _fmt(td) + '</td><td class="text-end">' + _fmt(th) + '</td><td class="text-end">' + _fmt(td-th) + '</td></tr></tfoot></table>';
        if (!list.length) h = '<p class="text-center text-muted py-3">' + __('sin_datos') + '</p>';
        document.getElementById('repBalanceTabla').innerHTML = h;
    });
}
function renderDiario() {
    var h = '<div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">' + __('libro_diario') + '</h5><button class="btn btn-sm btn-outline-secondary" onclick="volverReportes()"><i class="bi bi-arrow-left"></i> ' + __('volver') + '</button></div>';
    h += '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">' + __('fecha_desde') + '</label><input type="date" class="form-control form-control-sm" id="repFDesde" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">' + __('fecha_hasta') + '</label><input type="date" class="form-control form-control-sm" id="repFHasta" value="' + _date() + '"></div>';
    h += '<div class="col-auto d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="loadDiario()"><i class="bi bi-search"></i> ' + __('generar') + '</button></div></div>';
    h += '<div id="repDiarioTabla"><p class="text-muted text-center py-4">' + 'Presione Generar' + '</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadDiario() {
    var fdesde = document.getElementById('repFDesde').value;
    var fhasta = document.getElementById('repFHasta').value;
    p('reportes/libro-diario', {fecha_desde: fdesde, fecha_hasta: fhasta}, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (Array.isArray(rows)?rows:[]) || [];
        var h = '';
        var gDebe=0, gHaber=0;
        list.forEach(function(a) {
            var tDebe=0, tHaber=0;
            h += '<div class="card mb-2"><div class="card-header py-1 small">#' + a.idasiento + ' | ' + a.fecha + ' | ' + (a.abreviatura||'') + ' | ' + a.concepto + '</div>';
            h += '<table class="table table-sm mb-0"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th></tr></thead><tbody>';
            (a.detalles||[]).forEach(function(d) {
                h += '<tr><td>' + d.codigo + '</td><td>' + d.cuenta_nombre + '</td><td class="text-end">' + _fmt(d.debe) + '</td><td class="text-end">' + _fmt(d.haber) + '</td></tr>';
                tDebe += parseFloat(d.debe)||0;
                tHaber += parseFloat(d.haber)||0;
            });
            h += '<tfoot><tr class="fw-bold small"><td colspan="2" class="text-end">' + 'Total' + '</td><td class="text-end">' + _fmt(tDebe) + '</td><td class="text-end">' + _fmt(tHaber) + '</td></tr></tfoot></table></div>';
            gDebe += tDebe;
            gHaber += tHaber;
        });
        if (!list.length) h = '<p class="text-center text-muted py-3">' + __('sin_datos') + '</p>';
        else h += '<div class="alert alert-info py-2 mt-2 text-end fw-bold">' + 'Total General' + ': ' + __('debe') + ' ' + _fmt(gDebe) + ' | ' + __('haber') + ' ' + _fmt(gHaber) + '</div>';
        document.getElementById('repDiarioTabla').innerHTML = h;
    });
}
function renderMayor() {
    var h = '<div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">' + __('libro_mayor') + '</h5><button class="btn btn-sm btn-outline-secondary" onclick="volverReportes()"><i class="bi bi-arrow-left"></i> ' + __('volver') + '</button></div>';
    h += '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3">';
    h += '<div class="col-auto"><label class="form-label small">' + __('fecha_desde') + '</label><input type="date" class="form-control form-control-sm" id="repFDesde" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">' + __('fecha_hasta') + '</label><input type="date" class="form-control form-control-sm" id="repFHasta" value="' + _date() + '"></div>';
    h += '<div class="col-auto d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="loadMayor()"><i class="bi bi-search"></i> ' + __('generar') + '</button></div></div>';
    h += '<div id="repMayorTabla"><p class="text-muted text-center py-4">' + 'Presione Generar' + '</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadMayor() {
    var fdesde = document.getElementById('repFDesde').value;
    var fhasta = document.getElementById('repFHasta').value;
    p('reportes/libro-mayor', {idcuenta: 0, fecha_desde: fdesde, fecha_hasta: fhasta}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        if (data.cuentas) {
            var h = '';
            data.cuentas.forEach(function(c) {
                var movs = c.movimientos||[];
                var cta = c.cuenta||{};
                h += '<div class="card mb-3"><div class="card-header py-1"><strong>' + (cta.codigo||'') + ' - ' + (cta.nombre||'') + '</strong> | ' + 'Saldo Inicial' + ': ' + _fmt(c.saldo_anterior) + '</div>';
                h += '<div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th>' + __('fecha') + '</th><th>' + __('concepto') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th><th class="text-end">' + __('saldo') + '</th></tr></thead><tbody>';
                movs.forEach(function(m) {
                    h += '<tr><td>' + m.fecha + '</td><td>' + m.concepto + '</td><td class="text-end">' + _fmt(m.debe) + '</td><td class="text-end">' + _fmt(m.haber) + '</td><td class="text-end">' + _fmt(m.saldo) + '</td></tr>';
                });
                h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + __('totales') + '</td><td class="text-end">' + _fmt(c.total_debe) + '</td><td class="text-end">' + _fmt(c.total_haber) + '</td><td class="text-end">' + _fmt(c.saldo_final) + '</td></tr></tfoot></table></div></div>';
            });
            if (!data.cuentas.length) h = '<p class="text-center text-muted py-3">' + __('sin_datos') + '</p>';
            document.getElementById('repMayorTabla').innerHTML = h;
        } else {
            var movs = data.movimientos || [];
            var cuenta = data.cuenta || {};
            var h = '<div class="mb-2"><strong>' + __('cuenta') + ':</strong> ' + (cuenta.codigo||'') + ' - ' + (cuenta.nombre||'') + ' | <strong>' + 'Saldo Inicial' + ':</strong> ' + _fmt(data.saldo_anterior) + '</div>';
            h += '<table class="table table-sm"><thead><tr><th>' + __('fecha') + '</th><th>' + __('concepto') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th><th class="text-end">' + __('saldo') + '</th></tr></thead><tbody>';
            movs.forEach(function(m) {
                h += '<tr><td>' + m.fecha + '</td><td>' + m.concepto + '</td><td class="text-end">' + _fmt(m.debe) + '</td><td class="text-end">' + _fmt(m.haber) + '</td><td class="text-end">' + _fmt(m.saldo) + '</td></tr>';
            });
            h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + __('totales') + '</td><td class="text-end">' + _fmt(data.total_debe) + '</td><td class="text-end">' + _fmt(data.total_haber) + '</td><td class="text-end">' + _fmt(data.saldo_final) + '</td></tr></tfoot></table>';
            if (!movs.length) h = '<p class="text-center text-muted py-3">' + __('sin_datos') + '</p>';
            document.getElementById('repMayorTabla').innerHTML = h;
        }
    });
}
function renderResultados() {
    var h = '<div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">' + __('estado_resultados') + '</h5><button class="btn btn-sm btn-outline-secondary" onclick="volverReportes()"><i class="bi bi-arrow-left"></i> ' + __('volver') + '</button></div>';
    h += '<div class="card"><div class="card-body">';
    h += '<div class="row g-2 mb-3"><div class="col-auto"><label class="form-label small">' + __('fecha_desde') + '</label><input type="date" class="form-control form-control-sm" id="repFDesde" value="' + _monthStart() + '"></div>';
    h += '<div class="col-auto"><label class="form-label small">' + __('fecha_hasta') + '</label><input type="date" class="form-control form-control-sm" id="repFHasta" value="' + _date() + '"></div>';
    h += '<div class="col-auto d-flex align-items-end"><button class="btn btn-primary btn-sm" onclick="loadResultados()"><i class="bi bi-search"></i> ' + __('generar') + '</button></div></div>';
    h += '<div id="repResultadosTabla"><p class="text-muted text-center py-4">' + 'Presione Generar' + '</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadResultados() {
    var fdesde = document.getElementById('repFDesde').value;
    var fhasta = document.getElementById('repFHasta').value;
    p('reportes/estado-resultados', {fecha_desde: fdesde, fecha_hasta: fhasta}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        var h = '';
        h += '<h6>' + __('ingresos') + '</h6><table class="table table-sm"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + 'Total' + '</th></tr></thead><tbody>';
        (data.ingresos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + 'Total Ingresos' + '</td><td class="text-end">' + _fmt(data.total_ingresos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">' + __('gastos') + '</h6><table class="table table-sm"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + 'Total' + '</th></tr></thead><tbody>';
        (data.gastos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + 'Total Gastos' + '</td><td class="text-end">' + _fmt(data.total_gastos) + '</td></tr></tfoot></table>';
        var cls = parseFloat(data.utilidad_neta) >= 0 ? 'text-success' : 'text-danger';
        h += '<div class="mt-3 fs-5 fw-bold ' + cls + '">' + 'Utilidad Neta' + ': ' + _fmt(data.utilidad_neta) + '</div>';
        document.getElementById('repResultadosTabla').innerHTML = h;
    });
}
function renderGeneral() {
    var h = '<div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0">' + __('balance_general') + '</h5><button class="btn btn-sm btn-outline-secondary" onclick="volverReportes()"><i class="bi bi-arrow-left"></i> ' + __('volver') + '</button></div>';
    h += '<div class="card"><div class="card-body"><div class="text-end mb-3"><button class="btn btn-primary btn-sm" onclick="loadGeneral()"><i class="bi bi-search"></i> ' + __('generar') + '</button></div>';
    h += '<div id="repGeneralTabla"><p class="text-muted text-center py-4">' + 'Presione Generar' + '</p></div></div></div>';
    document.getElementById('repContenido').innerHTML = h;
}
function loadGeneral() {
    p('reportes/balance-general', {}, function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var data = d || {};
        var h = '';
        h += '<h6>' + __('activos') + '</h6><table class="table table-sm"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + 'Total' + '</th></tr></thead><tbody>';
        (data.activos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + 'Total Activos' + '</td><td class="text-end">' + _fmt(data.total_activos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">' + __('pasivos') + '</h6><table class="table table-sm"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + 'Total' + '</th></tr></thead><tbody>';
        (data.pasivos||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + 'Total Pasivos' + '</td><td class="text-end">' + _fmt(data.total_pasivos) + '</td></tr></tfoot></table>';
        h += '<h6 class="mt-3">' + __('capital') + '</h6><table class="table table-sm"><thead><tr><th>' + __('codigo') + '</th><th>' + __('cuenta') + '</th><th class="text-end">' + 'Total' + '</th></tr></thead><tbody>';
        (data.capital||[]).forEach(function(r) { h += '<tr><td>' + r.codigo + '</td><td>' + r.nombre + '</td><td class="text-end">' + _fmt(r.total) + '</td></tr>'; });
        h += '</tbody><tfoot><tr class="fw-bold"><td colspan="2">' + 'Total Capital' + '</td><td class="text-end">' + _fmt(data.total_capital) + '</td></tr></tfoot></table>';
        h += '<div class="mt-3 fw-bold ' + (data.ecuacion ? 'text-success' : 'text-danger') + '">' + (data.ecuacion ? '✓ ' + 'Balanceado' : '✗ ' + 'No balanceado') + '</div>';
        document.getElementById('repGeneralTabla').innerHTML = h;
    });
}
