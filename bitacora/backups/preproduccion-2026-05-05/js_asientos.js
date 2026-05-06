var asPagina = 1, asLineas = 0, cuentasList = [];
function cargarAsientos(pag) {
    if (pag) asPagina = pag;
    var params = {page: asPagina, limit: 50};
    var v;
    v = document.getElementById('asFiltroDesde').value; if (v) params.fecha_desde = v;
    v = document.getElementById('asFiltroHasta').value; if (v) params.fecha_hasta = v;
    v = document.getElementById('asFiltroModulo').value; if (v) params.modulo = v;
    p('asientos/list', params, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = ((rows||{}).data||[]), total = (rows||{}).total||0, pages = (rows||{}).pages||1;
        var tb = document.getElementById('asBody');
        if (!list.length) {
            tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">' + __('sin_datos') + '</td></tr>';
            document.getElementById('asPaginacion').style.display = 'none'; return;
        }
        var h = '';
        list.forEach(function(a) {
            h += '<tr><td>' + a.idasiento + '</td><td>' + (a.fecha||'-') + '</td><td>' + (a.concepto||'-') + '</td><td>' + (a.abreviatura||'DI') + '</td>';
            h += '<td class="text-end">' + (typeof fms === 'function' ? fms(a.total_debe||0) : _ms + ' ' + ((a.total_debe||0).toFixed(2))) + '</td>';
            h += '<td class="text-end">' + (typeof fms === 'function' ? fms(a.total_haber||0) : _ms + ' ' + ((a.total_haber||0).toFixed(2))) + '</td>';
            h += '<td><button class="btn btn-sm btn-outline-info" onclick="verAsiento(' + a.idasiento + ')"><i class="bi bi-eye"></i></button></td></tr>';
        });
        tb.innerHTML = h;
        var pg = document.getElementById('asPagination'), ph = '';
        for (var i=1; i<=pages; i++) ph += '<li class="page-item' + (i===asPagina?' active':'') + '"><a class="page-link" href="#" onclick="cargarAsientos(' + i + ');return false">' + i + '</a></li>';
        pg.innerHTML = ph;
        document.getElementById('asInfo').textContent = __('mostrando') + ' ' + list.length + ' ' + __('de') + ' ' + total;
        document.getElementById('asPaginacion').style.display = '';
    });
}
var _ms = 'RD$';
function limpiarFiltrosAsientos() {
    ['asFiltroDesde','asFiltroHasta','asFiltroModulo'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; });
    asPagina = 1; cargarAsientos();
}
function nuevoAsiento() {
    document.getElementById('maTitulo').textContent = __('nuevo_asiento');
    document.getElementById('maFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('maConcepto').value = '';
    document.getElementById('maDetalles').innerHTML = '';
    asLineas = 0;
    document.getElementById('maComprobante').innerHTML = '<option value="1">Diario</option><option value="2">Ingreso</option><option value="3">Egreso</option><option value="4">Traspaso</option>';
    g('plan-cuenta/list', function(err, d) {
        if (err) return;
        cuentasList = (d.list||[]).filter(function(c) { return parseInt(c.nivel) >= 3; });
    });
    agregarLineaAsiento(); agregarLineaAsiento();
    new bootstrap.Modal(document.getElementById('modalAsiento')).show();
}
function agregarLineaAsiento() {
    asLineas++;
    var tb = document.getElementById('maDetalles');
    var tr = document.createElement('tr'); tr.id = 'maL' + asLineas;
    var sel = '<select class="form-select form-select-sm" id="maLCuenta' + asLineas + '"><option value="">Seleccionar...</option>';
    var seen = {};
    cuentasList.forEach(function(c) { if (seen[c.idcuenta]) return; seen[c.idcuenta] = true; sel += '<option value="' + c.idcuenta + '">' + c.codigo + ' - ' + c.nombre + '</option>'; });
    sel += '</select>';
    tr.innerHTML = '<td>' + sel + '</td><td><input type="text" class="form-control form-control-sm text-end" id="maLDebe' + asLineas + '" placeholder="0.00" oninput="calcTotalesAsiento()"></td><td><input type="text" class="form-control form-control-sm text-end" id="maLHaber' + asLineas + '" placeholder="0.00" oninput="calcTotalesAsiento()"></td><td><button class="btn btn-sm btn-outline-danger" onclick="this.closest("' + 'tr' + '").remove();calcTotalesAsiento()"><i class="bi bi-x"></i></button></td>';
    tb.appendChild(tr);
}
function calcTotalesAsiento() {
    var td=0, th=0;
    document.querySelectorAll('#maDetalles tr').forEach(function(tr) {
        var m = tr.id.match(/maL(\d+)/); if (!m) return;
        var n = m[1];
        var d = parseFloat((document.getElementById('maLDebe' + n)||{}).value?.replace(/[^\d.]/g, '')||'0')||0;
        var h = parseFloat((document.getElementById('maLHaber' + n)||{}).value?.replace(/[^\d.]/g, '')||'0')||0;
        td += d; th += h;
    });
    document.getElementById('maTotalDebe').textContent = td.toFixed(2);
    document.getElementById('maTotalHaber').textContent = th.toFixed(2);
    var dif = td - th;
    var el = document.getElementById('maDiferencia');
    el.textContent = Math.abs(dif).toFixed(2);
    el.className = Math.abs(dif) < 0.01 ? 'text-success' : 'text-danger';
}
function guardarAsiento() {
    var dets = [];
    document.querySelectorAll('#maDetalles tr').forEach(function(tr) {
        var m = tr.id.match(/maL(\d+)/); if (!m) return;
        var n = m[1];
        var c = parseInt((document.getElementById('maLCuenta' + n)||{}).value)||0;
        var d = parseFloat((document.getElementById('maLDebe' + n)||{}).value?.replace(/[^\d.]/g, '')||'0')||0;
        var h = parseFloat((document.getElementById('maLHaber' + n)||{}).value?.replace(/[^\d.]/g, '')||'0')||0;
        if (c && (d || h)) dets.push({idcuenta: c, debe: d, haber: h});
    });
    var data = {
        fecha: document.getElementById('maFecha').value,
        concepto: document.getElementById('maConcepto').value.trim(),
        idtipocomprobante: parseInt(document.getElementById('maComprobante').value)||1,
        detalles: dets
    };
    if (!data.concepto || !dets.length) { mostrarToast(__('completar'), 'warning'); return; }
    p('asientos/create', data, function(err) {
        if (err) { mostrarToast(err, 'danger'); return; }
        mostrarToast('OK', 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalAsiento')).hide();
        cargarAsientos();
    });
}
function verAsiento(id) {
    p('asientos/get', {idasiento: id}, function(err, a) {
        if (err) { mostrarToast(err, 'danger'); return; }
        document.getElementById('mvaId').textContent = a.idasiento;
        document.getElementById('mvaFecha').textContent = a.fecha;
        document.getElementById('mvaComprobante').textContent = (a.abreviatura||'') + ' - ' + (a.tipocomprobante_nombre||'');
        document.getElementById('mvaConcepto').textContent = a.concepto;
        var h = '', td=0, th=0;
        (a.detalles||[]).forEach(function(d) {
            h += '<tr><td>' + d.codigo + '</td><td>' + d.cuenta_nombre + '</td><td class="text-end">' + (typeof fms === 'function' ? fms(d.debe) : _ms + ' ' + (parseFloat(d.debe).toFixed(2))) + '</td><td class="text-end">' + (typeof fms === 'function' ? fms(d.haber) : _ms + ' ' + (parseFloat(d.haber).toFixed(2))) + '</td></tr>';
            td += parseFloat(d.debe)||0; th += parseFloat(d.haber)||0;
        });
        document.getElementById('mvaDetalles').innerHTML = h;
        document.getElementById('mvaTotalDebe').textContent = typeof fms === 'function' ? fms(td) : _ms + ' ' + td.toFixed(2);
        document.getElementById('mvaTotalHaber').textContent = typeof fms === 'function' ? fms(th) : _ms + ' ' + th.toFixed(2);
        new bootstrap.Modal(document.getElementById('modalVerAsiento')).show();
    });
}