// Prestamist - Application Core

// Password visibility toggle
function recargarMonedaSimbolo(){g('config/list',function(e,d){if(!d)return;var id=null;for(var i=0;i<d.length;i++){if(d[i].Clave==='moneda_default'){id=d[i].valor;break;}}if(!id||id==='0'){_moneda_simbolo='RD$';localStorage.setItem('moneda_simbolo','RD$');return;}_monedaId=parseInt(id);localStorage.setItem('moneda_id',id);g('monedas/list',function(e2,d2){if(e2||!d2)return;for(var j=0;j<d2.length;j++){if(String(d2[j].IdMoneda)===String(id)){_moneda_simbolo=d2[j].Simbolo;localStorage.setItem('moneda_simbolo',d2[j].Simbolo);break;}}});});}

function vt(){
    var p=document.getElementById('lpass');
    var b=document.getElementById('togglePass');
    if(p.type==='password'){p.type='text';b.innerHTML='<i class="bi bi-eye-slash"></i>';}
    else{p.type='password';b.innerHTML='<i class="bi bi-eye"></i>';}
}

// User dropdown
function toggleDrop(){
    var m=document.getElementById('userDrop');
    m.classList.toggle('show');
    var i=document.getElementById('dropIcon');
    i.classList.toggle('bi-chevron-down');
    i.classList.toggle('bi-chevron-up');
}
function hideDrop(){
    var m=document.getElementById('userDrop');
    m.classList.remove('show');
    var i=document.getElementById('dropIcon');
    i.classList.remove('bi-chevron-up');
    i.classList.add('bi-chevron-down');
}
document.addEventListener('click',function(e){
    var d=document.getElementById('userDrop');
    if(d&&!e.target.closest('.ug')){
        d.classList.remove('show');
        var i=document.getElementById('dropIcon');
        if(i){i.classList.remove('bi-chevron-up');i.classList.add('bi-chevron-down');}
    }
});

// Login
document.getElementById('lbtn').onclick=function(){
    var u=document.getElementById('luser').value.trim();
    var w=document.getElementById('lpass').value.trim();
    var rm=document.getElementById('lrem').checked;
    var le=document.getElementById('lerr');le.style.display='none';
    if(!u||!w){le.textContent='Campos requeridos';le.style.display='block';return;}
    this.disabled=true;this.innerHTML='Ingresando...';
    p('auth/login',{login:u,clave:w,remember:rm},function(e,d){
        document.getElementById('lbtn').disabled=false;
        document.getElementById('lbtn').innerHTML='<i class="bi bi-box-arrow-in-right"></i> '+__('login');
        if(e){le.textContent=e;le.style.display='block';return;}
        tok=d.token;user=d.user;
        // Save idioma from user preferences to localStorage (for page restore)
        try{var up=JSON.parse(user.preferencias||'{}');if(up.idioma){L=up.idioma;localStorage.setItem('idioma',up.idioma);}}catch(e){}
        // Recordarme: persistir en localStorage, si no en sessionStorage
        var storage=rm?localStorage:sessionStorage;
        storage.setItem('prestamist_token',tok);
        storage.setItem('prestamist_user',JSON.stringify(user));
        // Limpiar el otro storage
        if(rm){sessionStorage.removeItem('prestamist_token');sessionStorage.removeItem('prestamist_user');}
        else{localStorage.removeItem('prestamist_token');localStorage.removeItem('prestamist_user');}
        ea();
    });
};



// Enter app


function injectPerfilHTML() {
    var pp = document.getElementById('p-perfil');
    if (!pp || pp.hasAttribute('data-injected')) return;
    pp.setAttribute('data-injected', 'true');
    pp.innerHTML = `
        <div class="row g-4">
            <div class="col-md-12">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white fw-bold"><i class="bi bi-person"></i> <span data-i18n="datos_perfil">Datos del Perfil</span></div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-12 text-center mb-3">
                                <div style="position:relative;display:inline-block;cursor:pointer" onclick="document.getElementById('pfAvatarFile').click()">
                                <img src="images/logo.jpg" id="pfAvatar" class="rounded-circle" style="width:100px;height:100px;object-fit:cover;border:3px solid var(--accent)">
                                <div style="position:absolute;bottom:0;right:0;background:var(--accent);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:2px solid #fff"><i class="bi bi-camera-fill" style="color:#fff;font-size:.8rem"></i></div>
                                <input type="file" id="pfAvatarFile" accept="image/*" style="display:none" onchange="subirAvatar()">
                                </div>
                                <p class="text-muted small mt-1" id="pfCargoText">-</p>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="nombre">Nombre</label>
                                <input class="form-control" id="pfNombre" value="">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="apellido">Apellido</label>
                                <input class="form-control" id="pfApellido" value="">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="login">Login</label>
                                <input class="form-control" id="pfLogin" value="" disabled>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="cargo">Cargo</label>
                                <input class="form-control" id="pfCargo" value="" disabled>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="email">Correo</label>
                                <input class="form-control" id="pfEmail" value="">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="telefono">Telefono</label>
                                <input class="form-control" id="pfTelefono" value="">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="direccion">Direccion</label>
                                <input class="form-control" id="pfDireccion" value="">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="tipo_doc">Tipo Documento</label>
                                <select class="form-select" id="pfTipoDoc"><option value="">Seleccionar...</option><option value="1">Cedula</option><option value="2">Pasaporte</option><option value="3">RNC</option></select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold" data-i18n="num_documento">Nro Documento</label>
                                <input class="form-control" id="pfDocumento" value="">
                            </div>
                        </div>
                        <div class="mt-3 text-end">
                            <button class="btn btn-primary" onclick="guardarPerfil()"><i class="bi bi-save"></i> <span data-i18n="guardar">Guardar</span></button>
                        </div>
                    </div>
                </div>
                <div class="card border-0 shadow-sm mt-3">
                    <div class="card-header bg-white fw-bold"><i class="bi bi-gear"></i> <span data-i18n="preferencias">Preferencias</span></div>
                    <div class="card-body">
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="chkSidebarCompact" onchange="guardarSidebarCompactPerfil()">
                            <label class="form-check-label" for="chkSidebarCompact" data-i18n="sidebar_compacto">Sidebar Compacto</label>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold" data-i18n="idioma">Idioma</label>
                            <div id="idiomaSelector" class="d-flex flex-wrap gap-2"></div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold" data-i18n="tema">Tema</label>
                            <div id="temasSelector" class="d-flex flex-wrap gap-2"></div>
                        </div>
                    </div>
                </div>
                <div class="card border-0 shadow-sm mt-3">
                    <div class="card-header bg-white fw-bold"><i class="bi bi-key"></i> <span data-i18n="cambiar_clave">Cambiar Clave</span></div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <input type="password" class="form-control" id="pfNuevaClave" placeholder="" data-i18n-placeholder="nueva_clave">
                            </div>
                            <div class="col-md-6">
                                <button class="btn btn-warning" onclick="cambiarClavePerfil()"><i class="bi bi-key"></i> <span data-i18n="cambiar">Cambiar</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function injectDashboardHTML() {
    var pd = document.getElementById('p-dashboard');
    if (!pd || pd.hasAttribute('data-injected')) return;
    pd.setAttribute('data-injected', 'true');
    pd.innerHTML = `<div class="row g-3 mb-4">
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-people fs-4 text-primary"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="clientes">Clientes</h6>
                    <h3 class="mb-0 fw-bold" id="dClientes">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-cash-stack fs-4 text-success"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="total_prestamos">Total Prestamos</h6>
                    <h3 class="mb-0 fw-bold" id="dTotalPrestamos">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-clock fs-4 text-warning"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="pendientes">Pendientes</h6>
                    <h3 class="mb-0 fw-bold" id="dPendientes">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-currency-dollar fs-4 text-info"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="monto_prestado">Monto Prestado</h6>
                    <h3 class="mb-0 fw-bold" id="dMontoPrestado">RD$0.00</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-exclamation-triangle fs-4 text-danger"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="capital_pendiente">Capital Pendiente</h6>
                    <h3 class="mb-0 fw-bold" id="dCapitalPendiente">RD$0.00</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-calendar-x fs-4 text-danger"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="vencidas">Vencidas</h6>
                    <h3 class="mb-0 fw-bold" id="dVencidas">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-calendar-check fs-4 text-success"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="proximas">Proximas</h6>
                    <h3 class="mb-0 fw-bold" id="dProximas">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-cash-coin fs-4 text-primary"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="por_cobrar">Por Cobrar</h6>
                    <h3 class="mb-0 fw-bold" id="dPorCobrar">RD$0.00</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3" id="dCardUsuarios">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-secondary bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-people fs-4 text-secondary"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="usuarios_activos">Usuarios</h6>
                    <h3 class="mb-0 fw-bold" id="dUsuarios" style="color:#0d6efd">0</h3>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-lg-3" id="dGananciasWrap">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body text-center">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 p-3 mb-2" style="width:50px;height:50px">
                        <i class="bi bi-graph-up-arrow fs-4 text-success"></i>
                    </div>
                    <h6 class="text-muted mb-1 small" data-i18n="ganancias">Ganancias</h6>
                    <h3 class="mb-0 fw-bold" id="dGanancias">RD$0.00</h3>
                </div>
            </div>
        </div>
    </div>
    <div class="row g-3">
        <div class="col-md-6">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-bold" data-i18n="cuotas_vencidas">Cuotas Vencidas</div>
                <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th data-i18n="cliente">Cliente</th><th data-i18n="cuota">Cuota</th><th data-i18n="monto">Monto</th><th data-i18n="vence">Vence</th></tr></thead><tbody id="vbody"><tr><td colspan="4" class="text-muted text-center py-3" data-i18n="sin_datos">Sin datos</td></tr></tbody></table></div></div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-bold" data-i18n="proximas">Proximos Vencimientos</div>
                <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th data-i18n="cliente">Cliente</th><th data-i18n="cuota">Cuota</th><th data-i18n="monto">Monto</th><th data-i18n="vence">Vence</th></tr></thead><tbody id="qbody"><tr><td colspan="4" class="text-muted text-center py-3" data-i18n="sin_datos">Sin datos</td></tr></tbody></table></div></div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-bold" data-i18n="ultimos_pagos">Ultimos Pagos</div>
                <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th data-i18n="cliente">Cliente</th><th data-i18n="monto">Monto</th><th data-i18n="fecha">Fecha</th></tr></thead><tbody id="qbodyPagos"><tr><td colspan="3" class="text-muted text-center py-3" data-i18n="sin_datos">Sin datos</td></tr></tbody></table></div></div>
            </div>
        </div>
        <div class="col-md-6" id="dCardUsuariosTabla">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white fw-bold" data-i18n="usuarios_activos">Usuarios Activos</div>
                <div class="card-body p-0"><div class="table-responsive"><table class="table table-sm mb-0"><thead><tr><th data-i18n="usuario">Usuario</th><th data-i18n="cargo">Cargo</th><th data-i18n="estado">Estado</th></tr></thead><tbody id="ubody"><tr><td colspan="3" class="text-muted text-center py-3" data-i18n="sin_datos">Sin datos</td></tr></tbody></table></div></div>
        </div>
    </div>`;
    // Ocultar cards de usuarios activos si no es admin
    if(user && user.idcargo && parseInt(user.idcargo)!==1){
        var dc=document.getElementById('dCardUsuarios');
        if(dc)dc.style.display='none';
        var dt=document.getElementById('dCardUsuariosTabla');
        if(dt)dt.style.display='none';
    }
}

function ea(){
    document.getElementById('login').style.display='none';
    document.getElementById('app').style.display='block';
    document.getElementById('uname').textContent=user.nombre+(user.apellido?' '+user.apellido:'');
    
    document.getElementById('srole').textContent=user.cargo_nombre||'';
    if(user.avatar)document.getElementById('userAvatar').src=avatarUrl(user.avatar);
    
    // Mostrar menu segun rol
    if(user.rol==='superadmin'){
        document.getElementById('menuNormal').style.display='none';
        document.getElementById('menuSuperadmin').style.display='block';
        document.getElementById('srole').textContent+=' (Superadmin)';
        // Ocultar notificaciones para superadmin (aun no implementadas)
        var bell=document.getElementById('notifBell');
        if(bell)bell.style.display='none';
    }else{
        document.getElementById('menuNormal').style.display='block';
        document.getElementById('menuSuperadmin').style.display='none';
    }
    
    cargarTemaGlobal();aplicarPermisos();
    setTimeout(aplicarSidebarCompactGlobal,200);
    cargarIdiomaGlobal();aplicarIdioma();
    injectDashboardHTML();if(typeof aplicarIdioma==='function')aplicarIdioma();ld();
    setTimeout(cargarNotificaciones,200);
    g('cargos/list',function(e,d){if(!e)cgs=d;});
    g('config/list',function(e,d){
        if(d)for(var i=0;i<d.length;i++){
            var cl=d[i].Clave.toLowerCase();
            if(cl==='empresa_nombre')empresaNombre=d[i].valor;
            if(cl==='empresa_direccion')empresaDir=d[i].valor;
            if(cl==='empresa_telefono')empresaTel=d[i].valor;
        }
    });
}

// ===== NOTIFICACIONES =====
var _notifAbierto = false;

function cargarNotificaciones(){
    g('notificaciones/list', function(e,d){
        var badge = document.getElementById('notifBadge');
        var drop = document.getElementById('notifDrop');
        if(e || !d || d.length===0){
            if(badge) badge.style.display='none';
            if(drop) drop.innerHTML = '<div class="p-3 text-muted text-center small">Sin notificaciones</div>';
            return;
        }
        var noLeidas = d.filter(function(n){ return !n.leida; }).length;
        if(badge){
            if(noLeidas > 0){
                badge.textContent = noLeidas;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
        if(drop){
            var html = '<div class="d-flex justify-content-between align-items-center p-2 border-bottom"><strong class="small">Notificaciones</strong><button class="btn btn-sm btn-link p-0" onclick="marcarTodasLeidas()">'+__('marcar_todas')||'Marcar todas' +'</button></div>';
            d.forEach(function(n){
                var icono = n.tipo==='vencida' ? 'bi-exclamation-triangle text-danger' : (n.tipo==='proxima' ? 'bi-clock text-warning' : 'bi-info-circle text-primary');
                var bg = n.leida ? '' : 'bg-light';
                html += '<div class="p-2 border-bottom ' + bg + ' d-flex justify-content-between align-items-start"><div><i class="bi ' + icono + ' me-2"></i><span class="small">' + n.mensaje + '</span></div>';
                if(!n.leida) html += '<button class="btn btn-sm btn-link p-0 ms-2" onclick="marcarNotifLeida('+n.idnotificacion+')"><i class="bi bi-check"></i></button>';
                html += '</div>';
            });
            drop.innerHTML = html;
        }
    });
}

function toggleNotif(){
    _notifAbierto = !_notifAbierto;
    var drop = document.getElementById('notifDrop');
    if(drop) drop.classList.toggle('show', _notifAbierto);
}

function marcarNotifLeida(id){
    p('notificaciones/marcar-leida', {idnotificacion: id}, function(e,d){
        cargarNotificaciones();
    });
}

function marcarTodasLeidas(){
    p('notificaciones/marcar-todas', {}, function(e,d){
        cargarNotificaciones();
    });
}

// Cerrar panel al hacer clic fuera
document.addEventListener('click', function(e){
    var container = document.getElementById('notifContainer');
    if(container && !container.contains(e.target) && _notifAbierto){
        _notifAbierto = false;
        var drop = document.getElementById('notifDrop');
        if(drop) drop.classList.remove('show');
    }
});

// Logout
function cs(){
    // Notificar al backend que cierra sesion
    x('POST','auth/logout',{},function(){});
    tok=null;user=null;
    localStorage.removeItem('prestamist_token');
    localStorage.removeItem('prestamist_user');
    sessionStorage.removeItem('prestamist_token');
    sessionStorage.removeItem('prestamist_user');
    document.getElementById('app').style.display='none';
    document.getElementById('login').style.display='flex';
    document.getElementById('luser').value='';
    document.getElementById('lpass').value='';
    document.getElementById('lerr').style.display='none';
}

// Sidebar toggle
function ts(){
    var s=document.getElementById('sb');
    var tb=document.querySelector('.tb');
    var cw=document.querySelector('.cw');
    var ft=document.querySelector('.ft');
    var nts=s.querySelectorAll('.nt');
    var sh=s.querySelector('.sh div');
    var ic=s.style.width==='70px';
    if(ic){
        s.style.width='250px';tb.style.left='250px';
        cw.style.marginLeft='250px';ft.style.left='250px';
        for(var i=0;i<nts.length;i++)nts[i].style.display='';
        if(sh)sh.style.display='';
    }else{
        s.style.width='70px';tb.style.left='70px';
        cw.style.marginLeft='70px';ft.style.left='70px';
        for(var i=0;i<nts.length;i++)nts[i].style.display='none';
        if(sh)sh.style.display='none';
    }
}

// Page navigation
function aplicarSidebarCompactGlobal(){
    if(!window.user)return;
    var prefs=JSON.parse(user.preferencias||'{}');
    var s=document.getElementById('sb');
    if(!s)return;
    var isCompact=prefs.sidebar==='compact'||prefs.sidebar==='icon';
    var isNow=s.style.width==='70px';
    if(isCompact && !isNow)ts();
    else if(!isCompact && isNow)ts();
}


// Permission control
var perm={
    admin: 1,       // Administrator - full access
    usuario: 2,     // Usuario - limited
    vendedor: 3     // Vendedor - limited
};

function aplicarPermisos(){
    if(!user)return;
    if(_permisosCache && _permisosCache.idcargo===user.idcargo){
        aplicarPermisosDesde(_permisosCache.permisos);
        return;
    }
    g('cargo/permissions',function(e,d){
        if(d && d.permisos){
            _permisosCache={idcargo:user.idcargo, permisos:d.permisos};
            aplicarPermisosDesde(d.permisos);
        } else {
            // Fallback: si no se pudieron cargar permisos, inferir desde idcargo
            var defaults={dashboard:true,clientes:true,prestamos:true,reimprimir:true};
            if(user.idcargo==1){
                defaults.monedas=true;defaults.usuarios=true;defaults.config=true;
                defaults['plan-cuentas']=true;defaults.asientos=true;
                defaults['config-contable']=true;defaults['reportes-contables']=true;
            }
            if(user.idcargo==2){
                // Usuario: ve todo menos config, usuarios, monedas
                defaults['plan-cuentas']=true;defaults.asientos=true;
                defaults['config-contable']=true;defaults['reportes-contables']=true;
            }
            _permisosCache={idcargo:user.idcargo, permisos:defaults};
            aplicarPermisosDesde(defaults);
        }
    });
}
var _permisosCache=null;
function aplicarPermisosDesde(items){
    document.querySelectorAll('.ni[data-p]').forEach(function(n){
        var p=n.getAttribute('data-p');
        // No ocultar menús de superadmin
        if(p.indexOf('sa-')===0) return;
        n.style.display=(items[p]===false||items[p]===undefined)?'none':'';
    });
    document.querySelectorAll('.ni[onclick*="nextElementSibling"]').forEach(function(n){
        var p=n.getAttribute('data-p');
        if(p.indexOf('sa-')===0) return;
        n.style.display=(items[p]===false||items[p]===undefined)?'none':'';
        var sub=n.nextElementSibling;
        if(sub && n.style.display!='none'){
            sub.querySelectorAll('.ni').forEach(function(c){c.style.display='';});
        }
    });
}
function sp(pg){
    // Verificar permiso del módulo usando los permisos cargados
    var restringidas=['monedas','usuarios','config'];
    if(_permisosCache && _permisosCache.permisos && _permisosCache.permisos[pg]===false){
        mostrarToast('Permiso denegado','warning');
        pg='dashboard';
    } else if(user && user.idcargo && parseInt(user.idcargo)>1 && restringidas.indexOf(pg)>=0){
        // Fallback por si los permisos no están cargados
        mostrarToast('Permiso denegado','warning');
        pg='dashboard';
    }
    localStorage.setItem('lastPage',pg);
    // Close all submenus
    var parents=document.querySelectorAll('.ni[onclick*="nextElementSibling"]');
    for(var i=0;i<parents.length;i++){
        var sub=parents[i].nextElementSibling;
        if(sub&&sub.classList)sub.classList.remove('show');
    }
    document.querySelectorAll('.pg').forEach(function(s){s.classList.remove('act');});
    var titles={dashboard:'dashboard',prestamos:'registro',reimprimir:'historial',clientes:'clientes',monedas:'monedas',usuarios:'usuarios',config:'preferencias',perfil:'perfil','plan-cuentas':'plan_cuentas',asientos:'asientos_contables','config-contable':'config_contable','reportes-contables':'reportes_contables',
        'sa-dashboard':'Dashboard Global','sa-empresas':'Empresas','sa-usuarios':'Usuarios Globales'};
    document.getElementById('pt').textContent=__(titles[pg]||pg);
    // Forzar titulo directo para paginas SA
    if(pg==='sa-dashboard')document.getElementById('pt').textContent='Dashboard Global';
    else if(pg==='sa-empresas')document.getElementById('pt').textContent='Empresas';
    else if(pg==='sa-usuarios')document.getElementById('pt').textContent='Usuarios Globales';
    // Inyectar pagina SA si no existe
    if(pg.indexOf('sa-')===0 && !document.getElementById('p-'+pg)){
        var content=document.querySelector('.ca');
        if(!content)return;
        if(pg==='sa-dashboard') content.insertAdjacentHTML('beforeend', saDashboardHTML());
        else if(pg==='sa-empresas') content.insertAdjacentHTML('beforeend', saEmpresasHTML());
        else if(pg==='sa-usuarios') content.insertAdjacentHTML('beforeend', saUsuariosHTML());
    }
    var pgTarget=document.getElementById('p-'+pg);
    if(!pgTarget)return;
    pgTarget.classList.add('act');
    document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('act');});
    var n=document.querySelector('.ni[data-p="'+pg+'"]');
    if(n)n.classList.add('act');
    if(typeof aplicarIdioma==='function')aplicarIdioma();
    if(pg==='prestamos'){
        // Inject prestamos page HTML if not present
        if(!document.getElementById('filtroBusqueda')){
            var ppEl=document.getElementById('p-prestamos');
            if(ppEl){
                ppEl.innerHTML=`<div class="container-fluid p-4"><div class="card"><div class="card-body">
<div class="row mb-3">
  <div class="col-md-4"><input class="form-control" id="filtroBusqueda" data-i18n-placeholder="buscar" placeholder="Buscar cliente..." oninput="ppRender()"></div>
  <div class="col-md-2"><select class="form-select" id="filtroEstado" onchange="ppRender()"><option value="" data-i18n="estado">Estado</option><option value="Pendiente" data-i18n="pendientes">Pendiente</option><option value="Pagado" data-i18n="pagado">Pagado</option><option value="Vencido" data-i18n="vencidas">Vencido</option></select></div>
  <div class="col-md-2"><select class="form-select" id="filtroItems" onchange="cambiarItemsPagina()"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div>
  <div class="col-md-4 text-end"><button class="btn btn-primary" onclick="abrirNuevoPrestamo()"><i class="bi bi-plus-circle"></i> <span data-i18n="nuevo_prestamo">Nuevo Prestamo</span></button></div>
</div>
<div class="table-responsive"><table class="table table-hover"><thead><tr>
  <th style="cursor:pointer" onclick="ppToggleSort('IdPrestamo')">#</th>
  <th style="cursor:pointer" onclick="ppToggleSort('cliente_nombre')" data-i18n="cliente">Cliente</th>
  <th style="cursor:pointer" onclick="ppToggleSort('Monto')" data-i18n="monto">Monto</th>
  <th style="cursor:pointer" onclick="ppToggleSort('TasaInteres')" data-i18n="interes">Tasa</th>
  <th style="cursor:pointer" onclick="ppToggleSort('Plazo')" data-i18n="plazo">Plazo</th>
  <th style="cursor:pointer" onclick="ppToggleSort('FechaInicio')" data-i18n="fecha_inicio">Inicio</th>
  <th style="cursor:pointer" onclick="ppToggleSort('Estado')" data-i18n="estado">Estado</th>
  <th data-i18n="accion">Acciones</th>
</tr></thead><tbody id="pbody"></tbody></table></div>
<div class="d-flex justify-content-between align-items-center mt-2">
  <small class="text-muted" id="pInfo" data-i18n="mostrando"></small>
  <div>
    <nav><ul class="pagination pagination-sm mb-0" id="pPaginacion"></ul></nav>
    <span id="pPageSizeSelect"></span>
  </div>
</div>
</div></div></div>`;
            }
            lp();
        }else{
            lp();
        }        lp();
    }
    else if(pg==='clientes'){injectClientesHTML();lc();}
    else if(pg==='monedas'){injectMonedasHTML();lm();}
    else if(pg==='usuarios'){injectUsuariosHTML();lu();}
    else if(pg==='config'){injectConfigHTML();lg();}
    else if(pg==='plan-cuentas'){injectPlanCuentasHTML();if(typeof cargarPlanCuentas==='function')cargarPlanCuentas();else{var s=document.createElement('script');s.src='js/plan-cuentas.js?'+Date.now();s.onload=function(){cargarPlanCuentas()};document.body.appendChild(s);}}
        else if(pg==='asientos'){injectAsientosHTML();if(typeof cargarAsientos==='function')cargarAsientos();else{var s=document.createElement('script');s.src='js/asientos.js?'+Date.now();s.onload=function(){cargarAsientos()};document.body.appendChild(s);}}
        else if(pg==='config-contable'){injectConfigContableHTML();if(typeof cargarConfigContable==='function')cargarConfigContable();else{var s=document.createElement('script');s.src='js/config-contable.js?'+Date.now();s.onload=function(){cargarConfigContable()};document.body.appendChild(s);}}
        else if(pg==='reportes-contables'){injectReportesContablesHTML();if(typeof cargarReportesContables==='function')cargarReportesContables();else{var s=document.createElement('script');s.src='js/reportes-contables.js?'+Date.now();s.onload=function(){cargarReportesContables()};document.body.appendChild(s);}}
        else if(pg==='perfil'){
        injectPerfilHTML();if(typeof aplicarIdioma==='function')aplicarIdioma();
        if(typeof cargarPerfil==='function' && user) cargarPerfil();
        else if(user){
            injectPerfilHTML();if(typeof aplicarIdioma==='function')aplicarIdioma();
            document.getElementById('pfNombre') && (document.getElementById('pfNombre').value=user.nombre);
            document.getElementById('pfLogin') && (document.getElementById('pfLogin').value=user.login);
            document.getElementById('pfCargo') && (document.getElementById('pfCargo').value=user.cargo_nombre||'');
        }
    }else if(pg==='dashboard'){injectDashboardHTML();if(typeof aplicarIdioma==='function')aplicarIdioma();ld();cargarNotificaciones();}
    else if(pg==='reimprimir'){injectReimprimirHTML();lr();}
    // Paginas superadmin
    else if(pg==='sa-dashboard'){
        if(!document.getElementById('p-sa-dashboard'))document.querySelector('.ca').insertAdjacentHTML('beforeend',saDashboardHTML());
        saDashboardLoad();
    }else if(pg==='sa-empresas'){
        if(!document.getElementById('p-sa-empresas'))document.querySelector('.ca').insertAdjacentHTML('beforeend',saEmpresasHTML());
        saEmpresasLoad();
    }else if(pg==='sa-usuarios'){
        if(!document.getElementById('p-sa-usuarios'))document.querySelector('.ca').insertAdjacentHTML('beforeend',saUsuariosHTML());
        saUsuariosLoad();
    }
    aplicarIdioma();
    setTimeout(function(){if(typeof aplicarIdioma==='function')aplicarIdioma();},200);
}
// Back to top button
document.addEventListener('scroll',function(){
    var btt=document.getElementById('backToTop');
    if(btt)btt.classList.toggle('show',window.scrollY>300);
},{passive:true});

// Imprimir recibo
var formatoRecibo='punto-venta';
function imprimirRecibo(c,formato){
    formato=formato||formatoRecibo;
    var w=window.open('','_blank','width='+(formato==='boleta'?'800':'500')+',height='+(formato==='boleta'?'1000':'700'));
    var css='';
    if(formato==='boleta'){
        css='@page{margin:15mm;size:letter}';
        css+='body{font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;width:700px;margin:20px auto;padding:20px;white-space:pre-wrap}';
        css+='h1{text-align:center;font-size:22px;font-weight:bold;margin-bottom:2px}h2{text-align:center;font-size:16px;font-weight:bold;margin-bottom:2px;color:#333}h4{text-align:center;font-size:13px;color:#555;margin-top:0;margin-bottom:2px}';
        css+='.recibo{padding:20px;background:#fff}';
        css+='table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:8px;text-align:left}';
        css+='.total{font-weight:bold;font-size:14px;text-align:right;margin-top:10px}';
        css+='.footer{text-align:center;margin-top:20px;font-size:10px;color:#999}';
    }else{
        css='@page{margin:5mm 0 0 0;padding:0}';
        css+='body{font-family:Courier New,Courier,monospace;font-size:14px;line-height:1.5;white-space:pre;width:320px;margin:10px auto 0;padding:10px}';
        css+='@media print{body{width:80mm;padding:3mm 5mm}}';
    }
    var html='<html><head><title>Recibo</title><style>'+css+'</style></head><body>';
    if(formato==='boleta'){
        // Normalizar saltos de linea (\n literal o real)
        c=c.replace(/\\n/g,'\n');
        var lines=c.split('\n');
        html+='<div class="recibo">';
        html+='<h1>'+lines[0].trim()+'</h1>';
        html+='<h2>'+lines[1].trim()+'</h2>';
        html+='<h4>'+lines[2].trim()+'</h4>';
        html+='<hr style="border:none;border-top:1px solid #ccc;margin:10px 0">';
        html+='<table>';
        for(var i=3;i<lines.length;i++){
            var l=lines[i].trim();
            if(l.indexOf('=====')>=0)html+='<tr><td colspan="2"><hr style="border:none;border-top:1px dashed #ccc"></td></tr>';
            else if(l.indexOf('DETALLE')>=0||l.indexOf('CUOTA')>=0||l.indexOf('AMORTIZACION')>=0||l.indexOf('COMPROBANTE')>=0||l.indexOf('RECIBO')>=0||l.indexOf('Gracias')>=0||l.indexOf('Recibido')>=0||l.indexOf('Entregado')>=0){html+='<tr><td colspan="2" style="padding-top:10px"><strong>'+l+'</strong></td></tr>';}
            else if(l.indexOf('Cuota #')>=0||l.indexOf('Total')>=0||l.indexOf('Monto')>=0||l.indexOf('Saldo')>=0||l.indexOf('Interes')>=0||l.indexOf('Estado')>=0||l.indexOf('Prestamo')>=0||l.indexOf('Cliente')>=0||l.indexOf('Fecha')>=0){
                var parts=l.split(':');
                html+='<tr><td style="width:200px">'+parts[0]+'</td><td>'+(parts[1]||'')+'</td></tr>';
            }
            else if(l.indexOf('www')<0&&l.indexOf('OP Tecnology')<0&&l!=='')html+='<tr><td colspan="2">'+l+'</td></tr>';
        }
        html+='</table>';
        html+='<div class="footer">Powered by OP Tecnology</div>';
        html+='</div>';
    }else{
        html+=c.replace(/\\n/g,'<br>');
    }
    html+='</body></html>';
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function(){w.print();},800);
}

// Apply default language to login screen
aplicarIdioma();

// Auto-login
(function(){
    // Check localStorage first (persistente), luego sessionStorage
    var st=localStorage.getItem('prestamist_token');
    var su=localStorage.getItem('prestamist_user');
    if(!st||!su){
        st=sessionStorage.getItem('prestamist_token');
        su=sessionStorage.getItem('prestamist_user');
    }
    if(st&&su){
        tok=st;
        try{user=JSON.parse(su);}catch(e){}
        if(user){
            var x2=new XMLHttpRequest();
            x2.open('GET',API+'auth/validate',true);
            x2.setRequestHeader('Authorization','Bearer '+st);
            x2.onreadystatechange=function(){
                if(x2.readyState===4){
                    if(x2.status!==200){
                        try{var err=JSON.parse(x2.responseText);var msg=err.error||'Sesión expirada';}catch(e){msg='Sesión expirada';}
                        localStorage.removeItem('prestamist_token');
                        localStorage.removeItem('prestamist_user');
                        sessionStorage.removeItem('prestamist_token');
                        sessionStorage.removeItem('prestamist_user');
                        tok=null;user=null;
                        var le=document.getElementById('lerr');
                        if(le){le.textContent=msg;le.style.display='block';}
                        return;
                    }
                    document.getElementById('login').style.display='none';
                    document.getElementById('app').style.display='block';
                    document.getElementById('uname').textContent=user.nombre+(user.apellido?' '+user.apellido:'');
                    
                    document.getElementById('srole').textContent=user.cargo_nombre||'';
                    if(user.avatar)document.getElementById('userAvatar').src=avatarUrl(user.avatar);
                    
                    // Mostrar menu segun rol (tambien en recarga)
                    if(user.rol==='superadmin'){
                        document.getElementById('menuNormal').style.display='none';
                        document.getElementById('menuSuperadmin').style.display='block';
                        var bell=document.getElementById('notifBell');
                        if(bell)bell.style.display='none';
                    }else{
                        document.getElementById('menuNormal').style.display='block';
                        document.getElementById('menuSuperadmin').style.display='none';
                    }
                    
                    cargarTemaGlobal();aplicarPermisos();
    setTimeout(aplicarSidebarCompactGlobal,200);
                    cargarIdiomaGlobal();aplicarIdioma();
                    setTimeout(function(){if(user.rol!=='superadmin'){injectDashboardHTML();if(typeof aplicarIdioma==='function')aplicarIdioma();ld();cargarNotificaciones();}},100);
                    (function(){
                        var xx=new XMLHttpRequest();
                        xx.open('GET',API+'config/list',true);
                        xx.setRequestHeader('Authorization','Bearer '+st);
                        xx.onreadystatechange=function(){
                            if(xx.readyState===4&&xx.status===200){
                                try{var j=JSON.parse(xx.responseText);
                                    if(j.data)for(var i=0;i<j.data.length;i++){
                                        var c=j.data[i].Clave.toLowerCase();
                                        if(c==='empresa_nombre')empresaNombre=j.data[i].valor;
                                        if(c==='empresa_direccion')empresaDir=j.data[i].valor;
                                        if(c==='empresa_telefono')empresaTel=j.data[i].valor;
                                    }}catch(e){}
                            }
                        };
                        xx.send();
                    })();
                    // Refrescar preferencias del usuario desde BD (recarga)
                    (function(){
                        var px=new XMLHttpRequest();
                        px.open('GET',API+'users/preferencias',true);
                        px.setRequestHeader('Authorization','Bearer '+st);
                        px.onreadystatechange=function(){
                            if(px.readyState===4&&px.status===200){
                                try{var j=JSON.parse(px.responseText);
                                    if(j.data&&j.data.preferencias){
                                        user.preferencias=j.data.preferencias;
                                        var st=localStorage.getItem('prestamist_user');
                                        if(st){try{var u=JSON.parse(st);u.preferencias=user.preferencias;localStorage.setItem('prestamist_user',JSON.stringify(u));}catch(e){}}
                                        st=sessionStorage.getItem('prestamist_user');
                                        if(st){try{var u=JSON.parse(st);u.preferencias=user.preferencias;sessionStorage.setItem('prestamist_user',JSON.stringify(u));}catch(e){}}
                                        cargarTemaGlobal();cargarIdiomaGlobal();aplicarIdioma();
                                        if(typeof aplicarSidebarCompactGlobal==='function')aplicarSidebarCompactGlobal();
                                    }}catch(e){}
                            }
                        };
                        px.send();
                    })();
                    // Recarga: redirigir a pagina correcta segun rol
                    var last=localStorage.getItem('lastPage');
                    if(user.rol==='superadmin'){
                        sp('sa-dashboard');
                    }else if(last && document.getElementById('p-'+last)){
                        sp(last);
                    }else{
                        sp('dashboard');
                    }
                }
            };
            x2.send();
        }
    }
})();

function cargarTemaGlobal(){
    // Apply from user object first
    if(user){
        try{
            var prefs=JSON.parse(user.preferencias||'{}');
            if(prefs.tema){document.body.className=prefs.tema;return;}
        }catch(e){}
    }
    // Fallback: fetch from DB via config/list
    g('config/list',function(e,d){
        if(!e&&d){
            for(var i=0;i<d.length;i++){
                if(d[i].clave==='tema'&&d[i].valor){
                    document.body.className=d[i].valor;
                    break;
                }
            }
        }
    });
}

function injectClientesHTML(){
    var el=document.getElementById('p-clientes');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="row mb-3"><div class="col text-end"><button class="btn btn-primary" onclick="ec(0)"><i class="bi bi-plus-circle"></i> <span data-i18n="nuevo_cliente">Nuevo Cliente</span></button></div></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>#</th><th data-i18n="tipo_doc">Tipo Doc</th><th data-i18n="documento">Documento</th><th data-i18n="nombre">Nombre</th><th data-i18n="apellido">Apellido</th><th data-i18n="email">Email</th><th data-i18n="telefono">Teléfono</th><th data-i18n="accion">Acción</th></tr></thead><tbody id="cbody"></tbody></table></div></div></div><div id="cbodyPagination"></div></div>';el.dataset.loaded='1';}
}
function injectMonedasHTML(){
    var el=document.getElementById('p-monedas');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="row mb-3"><div class="col text-end"><button class="btn btn-primary" onclick="abrirModalMoneda()"><i class="bi bi-plus-circle"></i> <span data-i18n="nueva_moneda">Nueva Moneda</span></button></div></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>#</th><th data-i18n="nombre">Nombre</th><th data-i18n="simbolo">Símbolo</th><th data-i18n="accion">Acción</th></tr></thead><tbody id="mbody"></tbody></table></div></div></div><div id="mbodyPagination"></div></div>';el.dataset.loaded='1';}
}
function injectUsuariosHTML(){
    var el=document.getElementById('p-usuarios');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="row mb-3"><div class="col text-end"><button class="btn btn-primary" onclick="eu(0)"><i class="bi bi-plus-circle"></i> <span data-i18n="nuevo_usuario">Nuevo Usuario</span></button></div></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th data-i18n="usuario">Usuario</th><th data-i18n="nombre_completo">Nombre Completo</th><th data-i18n="cargo">Cargo</th><th data-i18n="estado">Estado</th><th data-i18n="accion">Acción</th></tr></thead><tbody id="ubody2"></tbody></table></div></div></div><div id="ubody2Pagination"></div></div>';el.dataset.loaded='1';}
}
function injectConfigHTML(){
    var el=document.getElementById('p-config');
    if(el){
        if(!el.dataset.loaded){
            var x=new XMLHttpRequest();
            x.open('GET','pages/config.html',true);
            x.onreadystatechange=function(){if(x.readyState===4&&x.status===200){el.innerHTML=x.responseText;el.dataset.loaded='1';lg();}};
            x.send();
        } else {
            lg();
        }
    }
}
function injectReimprimirHTML(){
    var el=document.getElementById('p-reimprimir');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="row g-3 mb-3"><div class="col-md-4"><label class="form-label" data-i18n="prestamo">Prestamo</label><select class="form-select" id="rrCliente" onchange="buscar()"><option value="">'+__('todos')+'</option></select></div><div class="col-md-3"><label class="form-label" data-i18n="fecha_desde">Desde</label><input type="date" class="form-control" id="rrDesde" onchange="buscar()"></div><div class="col-md-3"><label class="form-label" data-i18n="fecha_hasta">Hasta</label><input type="date" class="form-control" id="rrHasta" onchange="buscar()"></div><div class="col-md-2 d-flex align-items-end"><button class="btn btn-primary w-100" onclick="buscar()"><i class="bi bi-search"></i> '+__('buscar')+'</button></div></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>#</th><th data-i18n="fecha">Fecha</th><th data-i18n="cliente">Cliente</th><th data-i18n="tipo">Tipo</th><th data-i18n="cuotas">Cuotas</th><th data-i18n="monto_total">Total</th><th data-i18n="accion">Acción</th></tr></thead><tbody id="rrbody"></tbody></table></div><div id="rrPagination"></div></div></div></div>';el.dataset.loaded='1';}
    // Cargar prestamos en el select
    setTimeout(function(){
        var sel=document.getElementById('rrCliente');
        if(sel && sel.options.length<=1){
            g('prestamos/list',function(ee,dd){
                if(!ee&&dd){
                    for(var i=0;i<dd.length;i++){
                        sel.innerHTML+='<option value="'+dd[i].IdPrestamo+'">#'+dd[i].IdPrestamo+' '+(dd[i].cliente_nombre||'')+' '+(dd[i].cliente_apellido||'')+'</option>';
                    }
                }
            });
        }
    },100);
}
function injectPlanCuentasHTML(){
    var el=document.getElementById('p-plan-cuentas');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="row mb-3"><div class="col-md-6"><input class="form-control" id="pcBuscar" data-i18n-placeholder="buscar" placeholder="Buscar..." oninput="filtrarPlan()"></div><div class="col-md-6 text-end"><button class="btn btn-primary" onclick="nuevaCuenta()"><i class="bi bi-plus-circle"></i> <span data-i18n="nueva_cuenta">Nueva Cuenta</span></button></div></div><div id="pcTree"></div></div></div></div>';el.dataset.loaded='1';
        // Modal Plan Cuentas
        if(!document.getElementById('modalPlanCuenta')){
            var m=document.createElement('div');
            m.innerHTML='<div class="modal fade" id="modalCuenta" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="mcuTitulo"></h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><div class="mb-2"><label class="form-label small">Codigo</label><input class="form-control form-control-sm" id="mcuCodigo"></div><div class="mb-2"><label class="form-label small">Nombre</label><input class="form-control form-control-sm" id="mcuNombre"></div><div class="row g-2 mb-2"><div class="col-md-4"><label class="form-label small">Tipo</label><select class="form-select form-select-sm" id="mcuTipo"><option value="Activo">Activo</option><option value="Pasivo">Pasivo</option><option value="Patrimonio">Patrimonio</option><option value="Ingreso">Ingreso</option><option value="Gasto">Gasto</option></select></div><div class="col-md-4"><label class="form-label small">Naturaleza</label><select class="form-select form-select-sm" id="mcuNaturaleza"><option value="Debe">Debe</option><option value="Haber">Haber</option></select></div><div class="col-md-4"><label class="form-label small">Nivel</label><select class="form-select form-select-sm" id="mcuNivel"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div></div><div class="mb-2"><label class="form-label small">Cuenta Padre</label><select class="form-select form-select-sm" id="mcuPadre"><option value="">Ninguna</option></select></div></div><div class="modal-footer"><button class="btn btn-primary" onclick="guardarCuenta()">Guardar</button><button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button></div></div></div></div>';
            document.body.appendChild(m.firstElementChild);
        }
    }
}
function injectAsientosHTML(){
    var el=document.getElementById('p-asientos');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="mb-0" data-i18n="asientos_contables">Asientos Contables</h5><button class="btn btn-success" onclick="nuevoAsiento()"><i class="bi bi-plus-circle"></i> <span data-i18n="nuevo_asiento">Nuevo Asiento</span></button></div><div class="row g-3 mb-3"><div class="col-md-3"><input type="date" class="form-control" id="asFiltroDesde"></div><div class="col-md-3"><input type="date" class="form-control" id="asFiltroHasta"></div><div class="col-md-3"><select class="form-select" id="asFiltroModulo"><option value="">'+__('todos')+'</option><option value="prestamo">'+__('prestamo')+'</option><option value="pago">'+__('pago')+'</option><option value="manual">'+__('manual')+'</option></select></div><div class="col-md-3"><button class="btn btn-primary w-100" onclick="cargarAsientos()"><i class="bi bi-search"></i> <span data-i18n="buscar">Buscar</span></button></div></div><div class="table-responsive"><table class="table table-hover table-sm" id="asTable"><thead><tr><th>#</th><th data-i18n="fecha">Fecha</th><th data-i18n="concepto">Concepto</th><th data-i18n="estado">Estado</th><th class="text-end" data-i18n="debe">Debe</th><th class="text-end" data-i18n="haber">Haber</th><th data-i18n="origen">Origen</th><th data-i18n="tipo">Tipo</th><th data-i18n="usuario">Usuario</th><th data-i18n="accion">Acci&oacute;n</th></tr></thead><tbody id="asBody"></tbody></table></div><div id="asPagination"></div><div id="asInfo" class="text-muted small mt-1"></div></div></div></div>';
        el.dataset.loaded='1';}
}
function injectConfigContableHTML(){
    var el=document.getElementById('p-config-contable');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><div id="ccBody"></div></div></div></div>';el.dataset.loaded='1';}
}
function injectReportesContablesHTML(){
    var el=document.getElementById('p-reportes-contables');
    if(el){el.innerHTML='<div class="container-fluid p-4"><div class="card"><div class="card-body"><h5 class="mb-3" data-i18n="reportes_contables">Reportes Contables</h5><div id="repContenido"><p class="text-muted text-center py-4">'+__('cargando')+'...</p></div></div></div></div>';el.dataset.loaded='1';}
}
// Called by index.html after all page content loaded
window._initApp=function(){
    var last=localStorage.getItem('lastPage');
    // Superadmin: ir a dashboard global, no inyectar nada
    if(user && user.rol==='superadmin'){
        sp('sa-dashboard');
        return;
    }
    // Solo inyectar dashboard normal si NO es superadmin
    injectDashboardHTML();
    // Verificar si la última página está permitida según el cargo
    if(last && document.getElementById('p-'+last)){
        var restringidas=['usuarios','config','monedas'];
        if(user && user.idcargo && parseInt(user.idcargo)>1 && restringidas.indexOf(last)>=0){
            last='dashboard';
        }
        sp(last);
    }
    else if(document.getElementById('p-dashboard')) sp('dashboard');
    else sp('dashboard');
};

// ============================================
// SUPERADMIN VIEWS
// ============================================
function saDashboardHTML(){
    return '<div class="pg act" id="p-sa-dashboard"><div class="container-fluid p-4"><h4><i class="bi bi-server"></i> '+__('sa_dashboard')+'</h4><div class="row g-3 mt-2"><div class="col-md-4"><div class="card border-0 shadow-sm"><div class="card-body text-center py-4"><h5><i class="bi bi-building"></i></h5><h3 id="saTotalEmpresas">0</h3><small class="text-muted">'+__('sa_empresas')+'</small></div></div></div><div class="col-md-4"><div class="card border-0 shadow-sm"><div class="card-body text-center py-4"><h5><i class="bi bi-people-fill"></i></h5><h3 id="saTotalUsuarios">0</h3><small class="text-muted">'+__('sa_usuarios')+'</small></div></div></div><div class="col-md-4"><div class="card border-0 shadow-sm"><div class="card-body text-center py-4"><h5><i class="bi bi-check-circle"></i></h5><h3 id="saBdActivas">0</h3><small class="text-muted">'+__('sa_bd_config')+'</small></div></div></div></div><div class="table-responsive mt-3"><table class="table table-hover"><thead><tr><th>'+__('sa_empresa')+'</th><th>Slug</th><th>'+__('sa_estado')+'</th><th>BD</th></tr></thead><tbody id="saEmpresasBody"><tr><td colspan="4" class="text-muted text-center">'+__('cargando')+'...</td></tr></tbody></table></div></div></div>';
}
function saDashboardLoad(){
    g("empresas/list",function(e,d){
        if(e||!d)return;
        document.getElementById("saTotalEmpresas").textContent=d.length||0;
        var conBD=d.filter(function(x){return x.tiene_config>0});
        document.getElementById("saBdActivas").textContent=conBD.length||0;
        var h="";
        d.forEach(function(r){
            h+="<tr><td>"+r.nombre+"</td><td>"+r.slug+"</td><td><span class=\"badge bg-"+(r.activo?"success\">"+__('sa_activa'):"secondary\">"+__('sa_inactiva'))+"</span></td><td>"+(r.tiene_config>0?'<span class="badge bg-success">'+__('sa_configurada')+'</span>':'<span class="badge bg-warning">'+__('sa_sin_config')+'</span>')+"</td></tr>";
        });
        document.getElementById("saEmpresasBody").innerHTML=h||'<tr><td colspan="4" class="text-muted text-center">'+__('sa_sin_empresas')+'</td></tr>';
        // Usuarios total
        g("users/list",function(e2,d2){
            document.getElementById("saTotalUsuarios").textContent=d2?d2.length:0;
        });
    });
}

function saEmpresasHTML(){
    return '<div class="pg act" id="p-sa-empresas"><div class="container-fluid p-4"><div class="d-flex justify-content-between mb-3"><h4><i class="bi bi-building"></i> '+__('sa_empresas')+'</h4><button class="btn btn-primary btn-sm" onclick="saEmpresaModal(0)"><i class="bi bi-plus"></i> '+__('sa_nueva')+'</button></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>#</th><th>'+__('sa_nombre')+'</th><th>Slug</th><th>'+__('sa_estado')+'</th><th>BD</th><th>'+__('sa_acciones')+'</th></tr></thead><tbody id="saEmpBody"><tr><td colspan="6" class="text-muted text-center">'+__('cargando')+'...</td></tr></tbody></table></div></div></div>';
}
function saEmpresasLoad(){
    g("empresas/list",function(e,d){
        if(e||!d){document.getElementById("saEmpBody").innerHTML='<tr><td colspan="6" class="text-danger">'+e+'</td></tr>';return;}
        var h="";
        d.forEach(function(r){
            h+="<tr><td>"+r.idempresa+"</td><td>"+r.nombre+"</td><td>"+r.slug+"</td><td><span class=\"badge bg-"+(r.activo?"success\">"+__('sa_activa'):"secondary\">"+__('sa_inactiva'))+"</span></td>"+
               "<td>"+(r.tiene_config>0?'<span class="badge bg-success">'+__('sa_configurada')+'</span>':'<span class="badge bg-warning">'+__('sa_sin_config')+'</span>')+"</td>"+
               "<td><button class=\"btn btn-sm btn-outline-primary\" onclick=\"saEmpresaModal("+r.idempresa+")\"><i class=\"bi bi-gear\"></i></button></td></tr>";
        });
        document.getElementById("saEmpBody").innerHTML=h||'<tr><td colspan="6" class="text-muted text-center">'+__('sa_sin_empresas')+'</td></tr>';
    });
}
function saEmpresaModal(id){
    // Modal para crear/editar empresa + config BD
    var _t=__('sa_nombre'),_e=__('sa_editar'),_n=__('sa_nueva'),_g=__('guardar'),_c=__('cancelar'),_pc=__('sa_probar_conexion'),_cb=__('sa_config_bd');
    var t=id?_e+' #'+id:_n;
    var html='<div class="modal fade" id="saEmpModal"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5>'+t+'</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">'+
        '<div class="mb-3"><label>'+_t+'</label><input class="form-control" id="saEmpNombre" value=""></div>'+
        '<div class="mb-3"><label>Slug</label><input class="form-control" id="saEmpSlug" value=""><small class="text-muted">'+__('sa_slug_help')+'</small></div>'+
        '<hr><h6>'+_cb+'</h6>'+
        '<div class="mb-3"><label>Host</label><input class="form-control" id="saBDHost" value="localhost"></div>'+
        '<div class="row g-2"><div class="col-4"><label>'+__('sa_puerto')+'</label><input class="form-control" id="saBDPuerto" value="3306"></div>'+
        '<div class="col-8"><label>'+__('sa_bd')+'</label><input class="form-control" id="saBDDbname" value=""></div></div>'+
        '<div class="mb-3"><label>'+__('sa_usuario_bd')+'</label><input class="form-control" id="saBDUser" value=""></div>'+
        '<div class="mb-3"><label>'+__('sa_password_bd')+'</label><input type="password" class="form-control" id="saBDPass" value=""></div>'+
        '<button class="btn btn-outline-success btn-sm" onclick="saTestConexion()"><i class="bi bi-plug"></i> '+_pc+'</button>'+
        '</div><div class="modal-footer">'+
        '<button class="btn btn-success" onclick="saGuardarEmpresa('+id+')"><i class="bi bi-check"></i> '+_g+'</button></div></div></div></div>';
    // Si existe removerlo
    var old=document.getElementById('saEmpModal');
    if(old)old.remove();
    document.body.insertAdjacentHTML('beforeend',html);
    if(id>0){
        g("empresas/get&id="+id,function(e,d){
            if(e||!d)return;
            document.getElementById('saEmpNombre').value=d.nombre;
            document.getElementById('saEmpSlug').value=d.slug;
            document.getElementById('saBDHost').value=d.host||'localhost';
            document.getElementById('saBDPuerto').value=d.puerto||3306;
            document.getElementById('saBDDbname').value=d.dbname||'';
            document.getElementById('saBDUser').value=d.dbuser||'';
            document.getElementById('saBDPass').value=d.dbpass||'';
        });
    }
    var modal=new bootstrap.Modal(document.getElementById('saEmpModal'));
    modal.show();
}
function saTestConexion(){
    var data={host:document.getElementById('saBDHost').value,puerto:document.getElementById('saBDPuerto').value,dbname:document.getElementById('saBDDbname').value,dbuser:document.getElementById('saBDUser').value,dbpass:document.getElementById('saBDPass').value};
    if(!data.host||!data.dbname){mostrarToast('Complete los campos de BD','warning');return;}
    p("empresas/test-conexion",data,function(e,r){
        if(e)mostrarToast(e,'danger');
        else mostrarToast((r||{}).message||'Conexion exitosa','success');
    });
}
function saGuardarEmpresa(id){
    var data={idempresa:id,nombre:document.getElementById('saEmpNombre').value,slug:document.getElementById('saEmpSlug').value};
    // Agregar datos BD si se ingresaron
    var h=document.getElementById('saBDHost');
    if(h&&h.value){
        data.host=h.value;
        data.puerto=document.getElementById('saBDPuerto').value;
        data.dbname=document.getElementById('saBDDbname').value;
        data.dbuser=document.getElementById('saBDUser').value;
        data.dbpass=document.getElementById('saBDPass').value;
    }
    p("empresas/save",data,function(e,r){
        if(e)mostrarToast(e,'danger');
        else{mostrarToast('Empresa guardada','success');document.getElementById('saEmpModal').querySelector('.btn-close').click();saEmpresasLoad();}
    });
}

function saUsuariosHTML(){
    return '<div class="pg act" id="p-sa-usuarios"><div class="container-fluid p-4"><h4><i class="bi bi-people-fill"></i> '+__('sa_usuarios_globales')+'</h4><div class="table-responsive mt-3"><table class="table table-hover"><thead><tr><th>#</th><th>'+__('sa_nombre')+'</th><th>Login</th><th>Email</th><th>'+__('sa_empresa')+'</th><th>'+__('sa_rol')+'</th><th>'+__('sa_estado')+'</th></tr></thead><tbody id="saUserBody"><tr><td colspan="7" class="text-muted text-center">'+__('cargando')+'...</td></tr></tbody></table></div></div></div>';
}
function saUsuariosLoad(){
    g("users/list",function(e,d){
        if(e||!d){document.getElementById("saUserBody").innerHTML='<tr><td colspan="7" class="text-danger">'+e+'</td></tr>';return;}
        var h="";
        d.forEach(function(r){
            var rNom=r.nombre||'';
            var rApe=r.apellido||'';
            var rEml=r.email||'';
            var rEmp=r.empresa_nombre||'';
            var bRol=r.rol==='superadmin'?'danger':'primary';
            var rRol=r.rol||'usuario';
            var bAct=r.activo==1||r.activo==='1'?'success':'secondary';
            var tAct=r.activo==1||r.activo==='1'?__('sa_activo'):__('sa_inactivo');
            h+='<tr><td>'+r.idusuario+'</td><td>'+rNom+' '+rApe+'</td><td>'+r.login+'</td><td>'+rEml+'</td><td>'+rEmp+'</td><td><span class="badge bg-'+bRol+'">'+rRol+'</span></td><td><span class="badge bg-'+bAct+'">'+tAct+'</span></td></tr>';
        });
        document.getElementById("saUserBody").innerHTML=h||'<tr><td colspan="7" class="text-muted text-center">Sin usuarios</td></tr>';
    });
}
