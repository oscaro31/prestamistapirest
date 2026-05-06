var pcEditando = null;
function cargarPlanCuentas() {
    g('plan-cuenta/list', function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (d||{}).list || [];
        var hdr='<div class="py-1 px-2 border-bottom fw-bold small text-muted" style="font-size:16px"><table style="width:100%;table-layout:fixed"><tr><td style="width:84px">' + __('codigo') + '</td><td style="width:300px">' + __('nombre') + '</td><td style="width:50px;text-align:center">' + __('tipo') + '</td><td style="width:50px;text-align:center">Nat.</td><td style="width:50px;text-align:right">' + __('accion') + '</td></tr></table></div>';
        document.getElementById('pcTree').innerHTML = hdr + (renderTreeHtml(list, null, 0) || '<p class="text-center text-muted p-3">' + __('sin_datos') + '</p>');
    });
}
function renderTreeHtml(all, parentId, depth) {
    var children = all.filter(function(c) { return (parentId === null ? !c.idpadre : parseInt(c.idpadre) === parentId); });
    if (!children.length) return '';
    var h = '', tc = {Activo:'#198754', Pasivo:'#dc3545', Capital:'#0d6efd', Ingreso:'#ffc107', Gasto:'#6f42c1'};
    children.forEach(function(n) {
        var sub = all.filter(function(c) { return parseInt(c.idpadre) === parseInt(n.idcuenta); });
        var pad = depth * 20;
        h += '<div class="pc-item"><div class="py-1 border-bottom px-2" style="padding-left:' + pad + 'px"><table style="width:100%;table-layout:fixed"><tr>';
        h += '<td style="width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">';
        if (sub.length > 0) {
            h += '<span class="pc-toggle" onclick="event.stopPropagation();toggleTree(this)" style="cursor:pointer;margin-right:4px"><i class="bi bi-chevron-down" style="font-size:.65rem"></i></span>';
        } else {
            h += '<span style="display:inline-block;width:10px;margin-right:4px"></span>';
        }
        h += '<span class="fw-bold" style="font-size:16px">' + n.codigo + '</span></td>';
        h += '<td style="width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="font-size:16px">' + n.nombre + '</span></td>';
        h += '<td style="width:50px;text-align:center"><span class="badge" style="background:' + (tc[n.tipo]||'#666') + ';font-size:16px;padding:2px 8px">' + (n.tipo||'') + '</span></td>';
        h += '<td style="width:50px;text-align:center"><span class="badge" style="font-size:14px;padding:2px 6px;background:' + (n.naturaleza === 'Debe' ? '#198754' : '#dc3545') + ';color:white">' + (n.naturaleza || '') + '</span></td>';
        h += '<td style="width:50px;text-align:right;white-space:nowrap">';
        h += '<button class="btn btn-sm btn-outline-primary py-0 px-1" style="font-size:.7rem" onclick="event.stopPropagation();editarCuenta(' + n.idcuenta + ')"><i class="bi bi-pencil"></i></button>';
        h += '<button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" style="font-size:.7rem" onclick="event.stopPropagation();eliminarCuenta(' + n.idcuenta + ',' + JSON.stringify(n.nombre||'') + ')"><i class="bi bi-trash"></i></button>';
        h += '</td></tr></table></div>';
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
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (d||{}).list || [];
        var c = list.find(function(x) { return parseInt(x.idcuenta) === id; });
        if (!c) { mostrarToast(__('no_encontrado'), 'danger'); return; }
        document.getElementById('mcuCodigo').value = c.codigo || '';
        document.getElementById('mcuNombre').value = c.nombre || '';
        document.getElementById('mcuTipo').value = c.tipo || '';
        document.getElementById('mcuNaturaleza').value = c.naturaleza || 'Debe';
        document.getElementById('mcuNivel').value = c.nivel || '3';
        llenarSelectPadres(c.idpadre || null);
        new bootstrap.Modal(document.getElementById('modalCuenta')).show();
    });
}
function llenarSelectPadres(selected) {
    g('plan-cuenta/list', function(err, d) {
        if (err) return;
        var list = (d||{}).list || [];
        var sel = document.getElementById('mcuPadre');
        sel.innerHTML = '<option value="">' + __('ninguna') + '</option>';
        list.forEach(function(c) { sel.innerHTML += '<option value="' + c.idcuenta + '"' + (selected && parseInt(selected) === parseInt(c.idcuenta) ? ' selected' : '') + '>' + c.codigo + ' - ' + c.nombre + '</option>'; });
    });
}
function guardarCuenta() {
    var data = {
        codigo: document.getElementById('mcuCodigo').value.trim(),
        nombre: document.getElementById('mcuNombre').value.trim(),
        tipo: document.getElementById('mcuTipo').value,
        naturaleza: document.getElementById('mcuNaturaleza').value,
        nivel: parseInt(document.getElementById('mcuNivel').value)||3,
        idpadre: parseInt(document.getElementById('mcuPadre').value)||null
    };
    if (!data.codigo || !data.nombre) { mostrarToast(__('completar'), 'warning'); return; }
    if (pcEditando) data.idcuenta = pcEditando;
    var route = pcEditando ? 'plan-cuenta/update' : 'plan-cuenta/create';
    p(route, data, function(err) {
        if (err) { mostrarToast('Error: '+String(err), 'danger'); return; }
        mostrarToast(pcEditando ? __('actualizado') : __('creado'), 'success');
        bootstrap.Modal.getInstance(document.getElementById('modalCuenta')).hide();
        cargarPlanCuentas();
    });
}
function eliminarCuenta(id) {
    if (!confirm(__('confirmar_eliminar'))) return;
    p('plan-cuenta/delete', {idcuenta: id}, function(err) {
        if (err) { mostrarToast('Error: '+String(err), 'danger'); return; }
        mostrarToast(__('eliminado'), 'success');
        cargarPlanCuentas();
    });
}
function filtrarPlan() {
    var q = (document.getElementById('pcBuscar').value || '').toLowerCase();
    document.querySelectorAll('.pc-item').forEach(function(i) { i.style.display = i.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}
