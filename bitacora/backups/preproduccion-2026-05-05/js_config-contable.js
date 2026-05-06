function cargarConfigContable() {
    g('config-contable/list', function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = d || [];
        var tb = document.getElementById('ccBody');
        if (!list.length) { tb.innerHTML = '<tr><td colspan="6" class="text-center text-muted">' + __('sin_datos') + '</td></tr>'; return; }
        g('plan-cuenta/list', function(e2, dc) {
            var all = ((dc||{}).list||[]);
            var opts = '<option value="">Seleccionar...</option>';
            all.forEach(function(c) { opts += '<option value="' + c.idcuenta + '">' + c.codigo + ' - ' + c.nombre + '</option>'; });
            var h = '';
            list.forEach(function(c) {
                h += '<tr><td>' + c.modulo + '</td><td>' + (c.submodulo||'principal') + '</td>';
                h += '<td><select class="form-select form-select-sm cc-debe" data-id="' + c.idconfig + '">' + opts.replace('value="'+(c.idcuenta_debe||'')+'"', 'value="'+(c.idcuenta_debe||'')+'" selected') + '</select></td>';
                h += '<td><select class="form-select form-select-sm cc-haber" data-id="' + c.idconfig + '">' + opts.replace('value="'+(c.idcuenta_haber||'')+'"', 'value="'+(c.idcuenta_haber||'')+'" selected') + '</select></td>';
                h += '<td>' + (c.descripcion||'') + '</td>';
                h += '<td><button class="btn btn-sm btn-primary" onclick="guardarConfigContable(' + c.idconfig + ')"><i class="bi bi-save"></i></button></td></tr>';
            });
            tb.innerHTML = h;
        });
    });
}
function guardarConfigContable(id) {
    var debe = document.querySelector('.cc-debe[data-id="' + id + '"]')?.value || null;
    var haber = document.querySelector('.cc-haber[data-id="' + id + '"]')?.value || null;
    p('config-contable/update', {idconfig: id, idcuenta_debe: debe||null, idcuenta_haber: haber||null}, function(err) {
        if (err) { mostrarToast(err, 'danger'); return; }
        mostrarToast('OK', 'success');
    });
}