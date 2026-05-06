function cargarConfigContable() {
    g('config-contable/list', function(err, d) {
        if (err) { mostrarToast(err, 'danger'); return; }
        var list = (d||{}).data || [];
        var tb = document.getElementById('ccBody');
        if (!list.length) { tb.innerHTML = '<p class="text-center text-muted p-4">' + __('sin_datos') + '</p>'; return; }
        g('plan-cuenta/list', function(e2, dc) {
            var all = ((dc||{}).list||[]);
            var opts = '<option value="">Seleccionar...</option>';
            all.forEach(function(c) { opts += '<option value="' + c.idcuenta + '">' + c.codigo + ' - ' + c.nombre + '</option>'; });
            var h = '<table class="table table-sm table-hover"><thead><tr><th>' + __('modulo') + '</th><th>' + __('submodulo') + '</th><th>' + __('cuenta_debe') + '</th><th>' + __('cuenta_haber') + '</th><th>' + __('descripcion') + '</th><th>' + __('accion') + '</th></tr></thead><tbody>';
            list.forEach(function(c) {
                h += '<tr><td>' + __(c.modulo||'') + '</td><td>' + (c.submodulo||'principal') + '</td>';
                h += '<td><select class="form-select form-select-sm cc-debe" data-id="' + c.idconfig + '">' + opts.replace('value="'+(c.idcuenta_debe||'')+'"', 'value="'+(c.idcuenta_debe||'')+'" selected') + '</select></td>';
                h += '<td><select class="form-select form-select-sm cc-haber" data-id="' + c.idconfig + '">' + opts.replace('value="'+(c.idcuenta_haber||'')+'"', 'value="'+(c.idcuenta_haber||'')+'" selected') + '</select></td>';
                h += '<td>' + (c.descripcion||'') + '</td>';
                h += '<td><button class="btn btn-sm btn-primary" onclick="guardarConfigContable(' + c.idconfig + ')"><i class="bi bi-save"></i></button></td></tr>';
            });
            h += '</tbody></table>';
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
