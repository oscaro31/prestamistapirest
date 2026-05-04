var pcEditando = null;
function cargarPlanCuentas() {
    g('plan-cuenta/list', function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (d||{}).list || [];
        document.getElementById('pcTree').innerHTML = renderTreeHtml(list, null, 0) || '<p class="text-center text-muted p-3">' + __('sin_datos') + '</p>';
    });
}
function renderTreeHtml(all, parentId, depth) {
    var children = all.filter(function(c) { return (parentId === null ? !c.idpadre : parseInt(c.idpadre) === parentId); });
    if (!children.length) return '';
    var h = '', tc = {Activo:'#198754', Pasivo:'#dc3545', Capital:'#0d6efd', Ingreso:'#ffc107', Gasto:'#6f42c1'};
    children.forEach(function(n) {
        var sub = all.filter(function(c) { return parseInt(c.idpadre) === parseInt(n.idcuenta); });
        var pad = depth * 20;
        h += '<div class="pc-item" style="padding-left:' + pad + 'px"><div class="d-flex align-items-center py-1 border-bottom px-2">';
        if (sub.length > 0) {
            h += '<span class="pc-toggle me-1" onclick="event.stopPropagation();toggleTree(this)" style="cursor:pointer;width:14px"><i class="bi bi-chevron-down" style="font-size:.65rem"></i></span>';
        } else {
            h += '<span style="width:14px;display:inline-block"></span>';
        }
        h += '<span class="fw-bold me-2" style="min-width:75px;font-size:.85rem">' + n.codigo + '</span>';
        h += '<span class="flex-grow-1" style="font-size:.85rem">' + n.nombre + '</span>';
        h += '<span class="badge me-2" style="background:' + (tc[n.tipo]||'#666') + '">' + (n.tipo||'').substring(0,4) + '</span>';
        h += '<span class="small text-muted me-2">' + (n.naturaleza === 'Debe' ? 'D' : 'H') + '</span>';
        h += '<div class="btn-group btn-group-xs">';
        h += '<button class="btn btn-sm btn-outline-primary py-0 px-1" onclick="event.stopPropagation();editarCuenta(' + n.idcuenta + ')"><i class="bi bi-pencil"></i></button>';
        h += '<button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="event.stopPropagation();eliminarCuenta(' + n.idcuenta + ',' + JSON.stringify(n.nombre||'') + ')"><i class="bi bi-trash"></i></button>';
        h += '</div></div>';
        if (sub.length > 0) {
            h += '<div class="pc-children">' + renderTreeHtml(all, parseInt(n.idcuenta), depth + 1) + '</div>';
        }
        h += '</div>';
    });
    return h;
}
function toggleTree(el) {
    var ch = el.closest('.pc-item').querySelector('.pc-children');
    if (!ch) return;
    var show = ch.style.display === 'none';
    ch.style.display = show ? 'block' : 'none';
    el.querySelector('i').className = show ? 'bi bi-chevron-down' : 'bi bi-chevron-right';
}
function filtrarPlanCuentas() {
    var q = (document.getElementById('pcBuscar').value || '').toLowerCase();
    document.querySelectorAll('.pc-item').forEach(function(i) { i.style.display = i.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
function nuevaCuenta() {
    pcEditando = null;
    document.getElementById('mcuTitulo').textContent = __('nueva_cuenta');
    ['mcuCodigo','mcuNombre','mcuTipo','mcuNivel','mcuPadre'].forEach(function(id) { var e = document.getElementById(id); if (e) e.value = id === 'mcuNivel' ? '3' : ''; });
    document.getElementById('mcuNaturaleza').value = 'Debe';
    llenarSelectPadres(null);
    new bootstrap.Modal(document.getElementById('modalCuenta')).show();
}
function editarCuenta(id) {
    pcEditando = id;
    document.getElementById('mcuTitulo').textContent = __('editar') + ' ' + __('cuenta');
    g('plan-cuenta/list', function(err, d) {
        if (err) return;
        var c = (d.list||[]).find(function(x) { return parseInt(x.idcuenta) === id; });
        if (!c) return;
        document.getElementById('mcuCodigo').value = c.codigo || '';
        document.getElementById('mcuNombre').value = c.nombre || '';
        document.getElementById('mcuTipo').value = c.tipo || '';
        document.getElementById('mcuNaturaleza').value = c.naturaleza || 'Debe';
        document.getElementById('mcuNivel').value = c.nivel || '3';
        llenarSelectPadres(c.idpadre, id);
        new bootstrap.Modal(document.getElementById('modalCuenta')).show();
    });
}
function llenarSelectPadres(selected, excludeId) {
    var sel = document.getElementById('mcuPadre');
    sel.innerHTML = '<option value="">Ninguna (Raiz)</option>';
    g('plan-cuenta/list', function(err, d) {
        if (err) return;
        (d.list||[]).forEach(function(c) {
            if (excludeId && parseInt(c.idcuenta) === parseInt(excludeId)) return;
            if (parseInt(c.nivel) >= 5) return;
            var o = document.createElement('option');
            o.value = c.idcuenta;
            o.textContent = c.codigo + ' - ' + c.nombre;
            if (selected && parseInt(c.idcuenta) === parseInt(selected)) o.selected = true;
            sel.appendChild(o);
        });
    });
}
function guardarCuenta() {
    var data = {codigo: document.getElementById('mcuCodigo').value.trim(), nombre: document.getElementById('mcuNombre').value.trim(), tipo: document.getElementById('mcuTipo').value, naturaleza: document.getElementById('mcuNaturaleza').value, nivel: parseInt(document.getElementById('mcuNivel').value)||3, idpadre: document.getElementById('mcuPadre').value||null};
    if (!data.codigo || !data.nombre || !data.tipo) { mostrarToast(__('completar'), 'warning'); return; }
    var cb = function(err) { if (err) { mostrarToast(err, 'danger'); return; } mostrarToast('OK', 'success'); bootstrap.Modal.getInstance(document.getElementById('modalCuenta')).hide(); cargarPlanCuentas(); };
    if (pcEditando) { data.idcuenta = pcEditando; p('plan-cuenta/update', data, cb); }
    else { p('plan-cuenta/create', data, cb); }
}
function eliminarCuenta(id, nombre) {
    confirmar(__('confirmar') + ' - ' + nombre, function() {
        p('plan-cuenta/delete', {idcuenta: id}, function(err) { if (err) { mostrarToast(err, 'danger'); return; } mostrarToast('OK', 'success'); cargarPlanCuentas(); });
    });
}