var asPagina = 1, asLineas = 0, cuentasList = [], asLimit = 50;
var _ms='RD$';
function renderFms(v){return 'RD$ '+fm(v);}
function cargarAsientos(pag) {
    if (pag) asPagina = pag;
    var limitEl = document.getElementById('asLimit');
    var params = {page: asPagina, limit: parseInt(limitEl ? limitEl.value : 50) || 50};
    var v;
    v = document.getElementById('asFiltroDesde').value; if (v) params.fecha_desde = v;
    v = document.getElementById('asFiltroHasta').value; if (v) params.fecha_hasta = v;
    v = document.getElementById('asFiltroModulo').value; if (v) params.modulo = v;
    p('asientos/list', params, function(err, rows) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = ((rows||{}).list||[]), total = (rows||{}).total||0, pages = (rows||{}).pages||1;
        var tb = document.getElementById('asBody');
        if (!list.length) {
            tb.innerHTML = '<tr><td colspan="8" class="text-center text-muted">' + __('sin_datos') + '</td></tr>';
            return;
        }
        var h = '';
        list.forEach(function(a) {
            h += '<td>' + a.idasiento + '</td>';
            h += '<td>' + a.fecha + '</td>';
            h += '<td>' + (a.concepto||'') + '</td>';
            h += '<td>' + (a.idtipoestados==2?'<span class="badge bg-danger">'+__('anulado')+'</span>':'<span class="badge bg-success">'+__('activo')+'</span>') + '</td>';
            h += '<td class="text-end">' + renderFms(a.total_debe||0) + '</td>';
            h += '<td class="text-end">' + renderFms(a.total_haber||0) + '</td>';
            h += '<td>' + (a.tipocomprobante_nombre||(a.abreviatura||'')) + '</td>'; h += '<td>' + (a.idmodulo=='prestamo'?'<span class="badge bg-primary">Prestamo</span>':a.idmodulo=='pago'?'<span class="badge bg-info text-dark">Pago</span>':a.idmodulo=='manual'?'<span class="badge bg-secondary">Manual</span>':'<span class="badge bg-light text-dark">'+(a.idmodulo||'')+'</span>') + '</td>';
            h += '<td>' + (a.usuario_nombre||'') + '</td>';
            h += '<td class="text-nowrap"><button class="btn btn-sm btn-outline-info" onclick="verAsiento(' + a.idasiento + ')"><i class="bi bi-eye"></i></button> ';
            if(a.idtipoestados==1)h+='<button class="btn btn-sm btn-outline-danger" onclick="anularAsiento(' + a.idasiento + ')"><i class="bi bi-x-circle"></i></button>';
            h += '</tr>';
        });
        tb.innerHTML = h;
        var pg = document.getElementById('asPagination'), ph = '';
        for (var i=1; i<=pages; i++) ph += '<li class="page-item' + (i===asPagina?' active':'') + '"><a class="page-link" href="#" onclick="cargarAsientos(' + i + ');return false">' + i + '</a></li>';
        pg.innerHTML = ph;
        document.getElementById('asInfo').innerHTML = __('mostrando') + ' <b>' + list.length + '</b> ' + __('de') + ' <b>' + total + '</b> | ' + __('por_pagina') + ': <select id="asLimit" class="form-select form-select-sm d-inline-block" style="width:auto" onchange="asLimit=parseInt(this.value);asPagina=1;cargarAsientos()"><option value="50" '+(asLimit==50?'selected':'')+'>50</option><option value="100" '+(asLimit==100?'selected':'')+'>100</option><option value="200" '+(asLimit==200?'selected':'')+'>200</option><option value="500" '+(asLimit==500?'selected':'')+'>500</option></select>';
    });
}
function limpiarFiltrosAsientos() {
    ['asFiltroDesde','asFiltroHasta','asFiltroModulo','asLimit'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = ''; });
    asPagina = 1; cargarAsientos();
}
function nuevoAsiento() {
    var today = new Date().toISOString().split('T')[0];
    var d = document.createElement('div');
    d.innerHTML = '<div class="modal fade" id="modalAsiento" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header" style="background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white"><h5 class="modal-title">' + __('nuevo_asiento') + '</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="row g-2 mb-3"><div class="col-md-3"><label class="form-label small">' + __('fecha') + '</label><input type="date" class="form-control form-control-sm" id="maFecha" value="' + today + '"></div><div class="col-md-3"><label class="form-label small">' + __('comprobante') + '</label><select class="form-select form-select-sm" id="maComprobante"><option value="1">Diario</option><option value="2">Ingreso</option><option value="3">Egreso</option><option value="4">Traspaso</option></select></div><div class="col-md-6"><label class="form-label small">' + __('concepto') + '</label><input type="text" class="form-control form-control-sm" id="maConcepto"></div></div><div class="d-flex justify-content-between align-items-center mb-2"><span class="fw-bold small">' + __('detalles') + '</span><button class="btn btn-sm btn-outline-primary" onclick="agregarLineaAsiento()"><i class="bi bi-plus"></i></button></div><div class="table-responsive"><table class="table table-sm"><thead><tr><th>' + __('cuenta') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th><th></th></tr></thead><tbody id="maDetalles"></tbody></table></div><div class="d-flex justify-content-end gap-3 mt-2 small"><div>' + __('total_debe') + ': <span id="maTotalDebe" class="fw-bold">0.00</span></div><div>' + __('total_haber') + ': <span id="maTotalHaber" class="fw-bold">0.00</span></div><div>' + __('diferencia') + ': <span id="maDiferencia" class="fw-bold text-success">0.00</span></div></div></div><div class="modal-footer"><button class="btn btn-primary" onclick="guardarAsiento()"><i class="bi bi-save"></i> ' + __('guardar') + '</button><button class="btn btn-secondary" data-bs-dismiss="modal">' + __('cancelar') + '</button></div></div></div></div>';
    var old = document.getElementById('modalAsiento');
    if (old) old.remove();
    document.body.appendChild(d.querySelector('#modalAsiento'));
    asLineas = 0;
    if (!cuentasList.length) {
        p('plan-cuenta/list', {}, function(e, d) {
            if (!e && d) {
                cuentasList = (d.list||d.data||[]).filter(function(c) { return parseInt(c.nivel) >= 3; });
            }
            agregarLineaAsiento(); agregarLineaAsiento();
            new bootstrap.Modal(document.getElementById('modalAsiento')).show();
        });
    } else {
        agregarLineaAsiento(); agregarLineaAsiento();
        new bootstrap.Modal(document.getElementById('modalAsiento')).show();
    }
}
function agregarLineaAsiento() {
    asLineas++;
    var tb = document.getElementById('maDetalles');
    var tr = document.createElement('tr'); tr.id = 'maL' + asLineas;
    var sel = '<select class="form-select form-select-sm" id="maLCuenta' + asLineas + '"><option value="">Seleccionar...</option>';
    var seen = {};
    cuentasList.forEach(function(c) { if (seen[c.idcuenta]) return; seen[c.idcuenta] = true; sel += '<option value="' + c.idcuenta + '">' + c.codigo + ' - ' + c.nombre + '</option>'; });
    sel += '</select>';
    tr.innerHTML = '<td>' + sel + '</td><td><input type="text" class="form-control form-control-sm text-end" id="maLDebe' + asLineas + '" placeholder="0.00" oninput="calcTotalesAsiento()"></td><td><input type="text" class="form-control form-control-sm text-end" id="maLHaber' + asLineas + '" placeholder="0.00" oninput="calcTotalesAsiento()"></td><td><button class="btn btn-sm btn-outline-danger" onclick=\"this.closest(&#39;tr&#39;).remove();calcTotalesAsiento()\"><i class="bi bi-x"></i></button></td>';
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
        idmodulo: 'manual',
        idmoduloref: 0,
        detalles: dets
    };
    if (!data.concepto || !dets.length) { mostrarToast(__('completar'), 'warning'); return; }
    p('asientos/create', data, function(err, res) {
        if (err) { mostrarToast('Error: '+String(err), 'danger'); return; }
        mostrarToast(res&&res.message||'Asiento creado', 'success');
        var me=document.getElementById('modalAsiento');if(me){var mi=bootstrap.Modal.getInstance(me);if(mi)mi.hide();}else{cerrarOv();}
        cargarAsientos();
    });
}
function anularAsiento(id) {
    if(!confirm('Confirma anular este asiento?'))return;
    p('asientos/anular',{idasiento:id},function(err,res){
        if(err){mostrarToast('Error: '+String(err),'danger');return;}
        mostrarToast('Asiento anulado','success');
        cargarAsientos();
    });
}
function verAsiento(id) {
    p('asientos/get', {idasiento: id}, function(err, a) {
        if (err) { mostrarToast(err, 'danger'); return; }
        a = (a||{}).data || a;
        var old = document.getElementById('ovVerAsiento');
        if (old) old.remove();
        var hd = '', td=0, th=0;
        (a.detalles||[]).forEach(function(d) {
            hd += '<tr><td>' + d.codigo + '</td><td>' + d.cuenta_nombre + '</td><td class="text-end">' + (typeof fms === 'function' ? fms(d.debe) : _ms + ' ' + (parseFloat(d.debe).toFixed(2))) + '</td><td class="text-end">' + (typeof fms === 'function' ? fms(d.haber) : _ms + ' ' + (parseFloat(d.haber).toFixed(2))) + '</td></tr>';
            td += parseFloat(d.debe)||0; th += parseFloat(d.haber)||0;
        });
        var ov = document.createElement('div');
        ov.id = 'ovVerAsiento';
        ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1055;display:flex;align-items:flex-start;justify-content:center;padding-top:40px';
        ov.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:1" onclick="cerrVerAsiento()"></div><div style="position:relative;z-index:2;background:#fff;border-radius:12px;width:760px;max-width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.3)"><div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);color:white;padding:14px 20px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;align-items:center"><h5 class="mb-0">' + __('asiento') + ' #' + a.idasiento + '</h5><span style="cursor:pointer;font-size:1.4rem;opacity:.8" onclick="cerrVerAsiento()">&times;</span></div><div style="padding:18px"><div class="row mb-2"><div class="col-md-4"><strong>' + __('fecha') + ':</strong> ' + a.fecha + '</div><div class="col-md-4"><strong>' + __('comprobante') + ':</strong> ' + (a.abreviatura||'') + ' - ' + (a.tipocomprobante_nombre||'') + '</div><div class="col-md-4"><strong>' + __('estado') + ':</strong> ' + (a.idtipoestados==2?'<span class="badge bg-danger">'+__('anulado')+'</span>':'<span class="badge bg-success">'+__('activo')+'</span>') + '</div><div class="col-12 mt-1"><strong>' + __('concepto') + ':</strong> ' + a.concepto + '</div></div><table class="table table-sm table-hover"><thead><tr><th>' + __('cuenta') + '</th><th>' + __('descripcion') + '</th><th class="text-end">' + __('debe') + '</th><th class="text-end">' + __('haber') + '</th></tr></thead><tbody>' + hd + '</tbody></table></div><div style="padding:12px 18px;border-top:1px solid #ddd;display:flex;justify-content:flex-end"><button class="btn btn-secondary" onclick="cerrVerAsiento()">' + __('cerrar_modal') + '</button></div></div></div>';
        document.body.appendChild(ov);
    });
}

function cerrVerAsiento() {
    var el = document.getElementById('ovVerAsiento');
    if (el) el.remove();
}
function cerrarOv() {
    var el = document.getElementById('ovAsiento');
    if (el) el.remove();
    el = document.getElementById('ovVerAsiento');
    if (el) el.remove();
}