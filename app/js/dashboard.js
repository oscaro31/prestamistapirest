var _mc1=null,_mc2=null,_ld_loading=false;

function ld(){

    g('dashboard/resumen',function(e,d){
        if(e)return;
        
        // Stat cards
        document.getElementById('dClientes').textContent = d.TotalClientes || '0';
        document.getElementById('dTotalPrestamos').textContent = d.TotalPrestamos || '0';
        document.getElementById('dPendientes').textContent = d.PrestamosPendientes || '0';
        document.getElementById('dMontoPrestado').textContent = 'RD$' + fm(d.MontoTotalPrestado || '0');
        
        // Capital pendiente = monto prestado - pagado
        var prestado = parseFloat((d.MontoTotalPrestado || '0').replace(/,/g, ''));
        var pagado = parseFloat((d.PagadoCuotas || '0').replace(/,/g, ''));
        var capitalPendiente = Math.max(0, prestado - pagado);
        document.getElementById('dCapitalPendiente').textContent = 'RD$' + capitalPendiente.toFixed(2);
        
        document.getElementById('dVencidas').textContent = d.CuotasVencidas || '0';
        document.getElementById('dProximas').textContent = d.CuotasProximas || '0';
        document.getElementById('dPorCobrar').textContent = 'RD$' + fm(d.MontoPendiente || '0');
        document.getElementById('dUsuarios').textContent = (d.UsuariosActivos || '0') + '/' + (d.TotalUsuarios || '0');
        
        var ganancias = document.getElementById('dGanancias');
        if (ganancias) ganancias.textContent = 'RD$' + fm(d.InteresTotal || '0');
        var gw = document.getElementById('dGananciasWrap');
        if (gw) {
            var canSee = user && (user.idcargo == 1 || user.idcargo == '1') && (d.MostrarGanancias === '1');
            gw.style.display = canSee ? '' : 'none';
        }

        // ============================================================
        // TABLA: Cuotas Vencidas
        // ============================================================
        var vbody = '';
        if (d.CuotasVencidasDetalle && d.CuotasVencidasDetalle.length > 0) {
            for (var i = 0; i < d.CuotasVencidasDetalle.length; i++) {
                var v = d.CuotasVencidasDetalle[i];
                var cliente = (v.cliente_nombre || '') + ' ' + (v.cliente_apellido || '');
                var monto = 'RD$' + (v.MontoCuota || '0');
                var fecha = v.FechaPago ? v.FechaPago.substring(0, 10) : '-';
                var cuotaNum = v.NroCuota || v.nro_cuota || '';
                vbody += '<tr><td>' + cliente + '</td><td>' + cuotaNum + '</td><td>' + monto + '</td><td>' + fecha + '</td></tr>';
            }
        } else {
            vbody = '<tr><td colspan="4" class="text-muted text-center">Sin datos</td></tr>';
        }
        var vbodyEl = document.getElementById('vbody');
        if (vbodyEl) vbodyEl.innerHTML = vbody;

        // ============================================================
        // TABLA: Próximos Vencimientos
        // ============================================================
        var qbody = '';
        if (d.CuotasProximasDetalle && d.CuotasProximasDetalle.length > 0) {
            for (var i = 0; i < d.CuotasProximasDetalle.length; i++) {
                var q = d.CuotasProximasDetalle[i];
                var cliente = (q.cliente_nombre || '') + ' ' + (q.cliente_apellido || '');
                var monto = 'RD$' + (q.MontoCuota || '0');
                var fecha = q.FechaPago ? q.FechaPago.substring(0, 10) : '-';
                var cuotaNum = q.NroCuota || q.nro_cuota || '';
                qbody += '<tr><td>' + cliente + '</td><td>' + cuotaNum + '</td><td>' + monto + '</td><td>' + fecha + '</td></tr>';
            }
        } else {
            qbody = '<tr><td colspan="4" class="text-muted text-center">Sin datos</td></tr>';
        }
        var qbodyEl = document.getElementById('qbody');
        if (qbodyEl) qbodyEl.innerHTML = qbody;

        // ============================================================
        // TABLA: Últimos Pagos
        // ============================================================
        var pagosBody = '';
        if (d.UltimosPagos && d.UltimosPagos.length > 0) {
            for (var i = 0; i < d.UltimosPagos.length; i++) {
                var p = d.UltimosPagos[i];
                var cliente = (p.cliente_nombre || '') + ' ' + (p.cliente_apellido || '');
                var monto = p.MontoPagado ? 'RD$' + parseFloat(p.MontoPagado).toFixed(2) : 'RD$0.00';
                var fecha = p.FechaPago ? p.FechaPago.substring(0, 10) : '-';
                pagosBody += '<tr><td>' + cliente + '</td><td>' + monto + '</td><td>' + fecha + '</td></tr>';
            }
        } else {
            pagosBody = '<tr><td colspan="3" class="text-muted text-center">Sin datos</td></tr>';
        }
        var pagosEl = document.getElementById('qbodyPagos');
        if (pagosEl) pagosEl.innerHTML = pagosBody;

        // ============================================================
        // TABLA: Últimos Préstamos
        // ============================================================
        var ultimosBody = '';
        if (d.UltimosPrestamos && d.UltimosPrestamos.length > 0) {
            for (var i = 0; i < d.UltimosPrestamos.length; i++) {
                var u = d.UltimosPrestamos[i];
                var cliente = (u.cliente_nombre || '') + ' ' + (u.cliente_apellido || '');
                var monto = 'RD$' + (u.MontoPrestamo || '0');
                var estado = u.Estado || 'Pendiente';
                var badge = estado === 'Cancelado' ? 'bc' : 'bp';
                var fecha = u.FechaCreacion ? u.FechaCreacion.substring(0, 10) : '-';
                ultimosBody += '<tr><td>' + cliente + '</td><td>' + monto + '</td><td><span class="badge ' + badge + '">' + estado + '</span></td><td>' + fecha + '</td></tr>';
            }
        } else {
            ultimosBody = '<tr><td colspan="4" class="text-muted text-center">Sin datos</td></tr>';
        }
        var ubodyEl = document.getElementById('ubody');
        if (ubodyEl) ubodyEl.innerHTML = ultimosBody;

        // ============================================================
        // TABLA: Usuarios Activos
        // ============================================================
        var usuariosBody = '';
        if (d.Usuarios && d.Usuarios.length > 0) {
            for (var i = 0; i < d.Usuarios.length; i++) {
                var us = d.Usuarios[i];
                var estado = us.status_nombre || (us.idtipoestatususuarios == 1 ? 'Online' : 'Offline');
                var badge = (us.idtipoestatususuarios == 1) ? 'badge bg-success' : 'badge bg-secondary';
                usuariosBody += '<tr><td>' + (us.nombre || '') + ' (' + (us.login || '') + ')</td><td>' + (us.cargo_nombre || '-') + '</td><td><span class="badge ' + badge + '">' + estado + '</span></td></tr>';
            }
        } else {
            usuariosBody = '<tr><td colspan="3" class="text-muted text-center">Sin datos</td></tr>';
        }
        // La tabla de usuarios usa id="ubody" pero ya tenemos conflictos con la de prestamos,
        // mejor usamos un ID específico para usuarios activos
        var usuariosTable = document.querySelector('.card:has(#ubody) tbody');
        // Buscar por texto del card-header "Usuarios Activos"
        var allCards = document.querySelectorAll('.card');
        for (var ci = 0; ci < allCards.length; ci++) {
            var header = allCards[ci].querySelector('.card-header');
            if (header && header.textContent.indexOf('Usuarios') >= 0 && header.textContent.indexOf('Activos') >= 0) {
                var tb = allCards[ci].querySelector('tbody');
                if (tb) tb.innerHTML = usuariosBody;
                break;
            }
        }

        // Charts
        destroyCharts();
        renderCharts(d);
        
        if (typeof aplicarIdioma === 'function') aplicarIdioma();
    });
}

function renderCharts(d) {
    var w1 = document.getElementById('chartWrapper1');
    var w2 = document.getElementById('chartWrapper2');
    if (!w1 && !w2) return;

    // Chart 1: Préstamos por mes (bar chart)
    if (w1) {
        w1.innerHTML = '<canvas style="max-height:180px;width:100%"></canvas>';
        var c1 = w1.querySelector('canvas');
        if (c1 && typeof Chart !== 'undefined' && d.PrestamosPorMes && d.PrestamosPorMes.length > 0) {
            var meses = [];
            var montos = [];
            for (var i = 0; i < d.PrestamosPorMes.length; i++) {
                meses.push(d.PrestamosPorMes[i].mes);
                montos.push(parseFloat(d.PrestamosPorMes[i].monto));
            }
            try {
                _mc1 = new Chart(c1, {
                    type: 'bar',
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'RD$',
                            data: montos,
                            backgroundColor: 'rgba(15,52,96,.7)',
                            borderColor: '#0f3460',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            } catch(e) {}
        }
    }

    // Chart 2: Doughnut chart
    if (w2) {
        w2.innerHTML = '<canvas style="max-height:180px;width:100%"></canvas>';
        var c2 = w2.querySelector('canvas');
        if (c2 && typeof Chart !== 'undefined' && d.PrestamosPorQuincena && d.PrestamosPorQuincena.length > 0) {
            var qlabels = [];
            var qmontos = [];
            for (var i = 0; i < d.PrestamosPorQuincena.length; i++) {
                qlabels.push(d.PrestamosPorQuincena[i].quincena);
                qmontos.push(parseFloat(d.PrestamosPorQuincena[i].monto));
            }
            try {
                _mc2 = new Chart(c2, {
                    type: 'doughnut',
                    data: {
                        labels: qlabels,
                        datasets: [{
                            data: qmontos,
                            backgroundColor: ['#0f3460', '#ffc107'],
                            borderColor: '#fff',
                            borderWidth: 2,
                            hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            tooltip: {
                                callbacks: {
                                    label: function(ctx) {
                                        var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                        var pct = ((ctx.parsed / total) * 100).toFixed(1);
                                        return ctx.label + ': RD$ ' + ctx.parsed.toLocaleString() + ' (' + pct + '%)';
                                    }
                                }
                            }
                        }
                    }
                });
            } catch(e) {}
        }
    }
}

function destroyCharts(){
    if (_mc1) { try { _mc1.destroy(); } catch(e) {} _mc1 = null; }
    if (_mc2) { try { _mc2.destroy(); } catch(e) {} _mc2 = null; }
}
