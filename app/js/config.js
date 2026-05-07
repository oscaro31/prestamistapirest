// Prestamist - API Configuration
var API='https://prestamist.optecnology.com/api/index.php?route=';
var tok=null,user=null,cls=[],mds=[],cgs=[];

function gt(){return tok||localStorage.getItem('prestamist_token');}

function x(m,r,d,cb){
    var x=new XMLHttpRequest();
    x.open(m,API+r,true);
    x.setRequestHeader('Content-Type','application/json');
    var t=gt();if(t)x.setRequestHeader('Authorization','Bearer '+t);
    x.onreadystatechange=function(){
        if(x.readyState!==4)return;
        if(x.status===401){
            try{var errMsg=JSON.parse(x.responseText);errMsg=errMsg.error||'Sesión expirada';}catch(e){errMsg='Sesión expirada';}
            localStorage.removeItem('prestamist_token');localStorage.removeItem('prestamist_user');
            sessionStorage.removeItem('prestamist_token');sessionStorage.removeItem('prestamist_user');
            tok=null;user=null;
            document.getElementById('app').style.display='none';
            document.getElementById('login').style.display='';
            document.getElementById('lerr').textContent=errMsg;
            document.getElementById('lerr').style.display='block';
            cb(errMsg,null);return;
        }
        try{var j=JSON.parse(x.responseText)}catch(e){j={error:'Invalid'}}
        if(x.status>=200&&x.status<300&&j.data!==undefined)cb(null,j.data);
        else cb(j.error||'Err '+x.status,null);
    };
    x.send(d?JSON.stringify(d):null);
}
function g(r,cb){x('GET',r,null,cb);}
function p(r,d,cb){x('POST',r,d,cb);}
function fm(n){if(n===null||n===undefined)return'0.00';var f=parseFloat(n);return f.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}function fms(n){var s=typeof _moneda_simbolo!=='undefined'?_moneda_simbolo:'RD$';return s+' '+fm(n);}function formatMonInput(el){if(!el)return;var v=el.value.replace(/[^\d.]/g,'');var partes=v.split('.');if(partes.length>2)v=partes[0]+'.'+partes[1];el.value=v;el.dataset.valor=v;}function monInputLive(el){if(!el)return;var v=el.value.replace(/[^\d.]/g,'');var partes=v.split('.');if(partes.length>2)v=partes[0]+'.'+partes[1];el.value=v;el.dataset.valor=v;}function monInputBlur(el){if(!el)return;var v=el.dataset.valor||el.value.replace(/[^\d.]/g,'');var num=parseFloat(v);if(!isNaN(num)&&v){el.value=num.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}else{el.value='';}}function getMonVal(el){if(!el)return 0;if(el.dataset&&el.dataset.valor)return parseFloat(el.dataset.valor)||0;return parseFloat(el.value.replace(/[^\d.]/g,''))||0;}

function avatarUrl(name){
    if(!name)return 'images/logo.jpg';
    if(name.indexOf('//')!==-1||name.indexOf('data:')===0)return name;
    return 'https://prestamist.optecnology.com/uploads/avatars/'+name;
}

// ===== INTERNATIONALIZATION =====
var LANG = {};

LANG.es = {
name:'Espa\u00F1ol',flag:'\uD83C\uDDEA\uD83C\uDDF8',
login:'Iniciar Sesión',dashboard:'Dashboard',prestamos:'Prestamos',registro:'Registro',historial:'Historial',fecha_desde:'Desde',fecha_hasta:'Hasta',
clientes:'Clientes',monedas:'Monedas',configuracion:'Configuracion',usuarios:'Usuarios',preferencias:'Preferencias',
perfil:'Perfil',cerrar:'Cerrar Sesion',cerrar_modal:'Cerrar',nuevo:'Nuevo',editar:'Editar',eliminar:'Eliminar',
// Superadmin
sa_dashboard:'Dashboard Global',sa_empresas:'Empresas',sa_usuarios:'Usuarios',sa_usuarios_globales:'Usuarios Globales',sa_bd_config:'BD Configuradas',sa_empresa:'Empresa',sa_estado:'Estado',sa_nuevo:'Nueva',sa_nombre:'Nombre',sa_acciones:'Acciones',sa_rol:'Rol',
sa_editar:'Editar Empresa',sa_probar_conexion:'Probar Conexion',sa_config_bd:'Configuracion BD',sa_slug_help:'Identificador unico (ej: mi-empresa)',sa_puerto:'Puerto',sa_bd:'Base de Datos',sa_usuario_bd:'Usuario BD',sa_password_bd:'Contrasena BD',
sa_sin_empresas:'Sin empresas registradas',sa_activa:'Activa',sa_inactiva:'Inactiva',sa_configurada:'Configurada',sa_sin_config:'Sin config',
sa_activo:'Activo',sa_inactivo:'Inactivo',
guardar:'Guardar',cancelar:'Cancelar',buscar:'Buscar',limpiar:'Limpiar',fecha:'Fecha',monto:'Monto',
pagado:'Pagado',cuotas:'Cuotas',interes:'Interes',estado:'Estado',cliente:'Cliente',moneda:'Moneda',
tipo_cuota:'Tipo Cuota',cargo:'Cargo',nombre:'Nombre',apellido:'Apellido',documento:'Documento',
telefono:'Telefono',email:'Email',direccion:'Direccion',login:'Login',clave:'Clave',usuario:'Usuario',nombre_completo:'Nombre Completo',
tema:'Tema',idioma:'Idioma',pagar:'Pagar',comprobante:'Comprobante',imprimir:'Imprimir',recibo:'Recibo',
monto_total:'Monto Total',valor_cuota:'Valor Cuota',total_pagado:'Total Pagado',tipo:'Tipo',restante:'Restante',
cuota:'Cuota',fecha_pago:'Fecha Pago',mora:'Mora',prestamo_creado:'Préstamo Creado',prestamo_capital_pagado:'Capital Pagado',prestamo_interes_pagado:'Interés Pagado',prestamo_cobrado_capital:'Capital Cobrado',prestamo_cobrado_interes:'Interés Cobrado',prestamo_mora:'Mora',sin_datos:'Sin datos',completar:'Complete todos los campos',
error:'Error',exito:'Exito',activo:'Activo',inactivo:'Inactivo',anulado:'Anulado',origen:'Origen',accion:'Accion',
saldo_pendiente:'Saldo Pendiente',cancelar_modal:'Cancelar',confirmar:'Confirmar',
creado:'creado',actualizado:'actualizado',eliminado:'eliminado',desactivado:'desactivado',activado:'activado',
desactivar:'Desactivar',activar:'Activar',cambiar_clave:'Cambiar Clave',nueva_clave:'Nueva Clave',
cliente_creado:'Cliente creado correctamente',cliente_actualizado:'Cliente actualizado correctamente',
prestamo_creado:'Prestamo creado correctamente',pago_realizado:'Pago realizado correctamente',
moneda_creada:'Moneda creada correctamente',moneda_actualizada:'Moneda actualizada correctamente',
moneda_eliminada:'Moneda eliminada correctamente',usuario_creado:'Usuario creado correctamente',
usuario_actualizado:'Usuario actualizado correctamente',usuario_desactivado:'Usuario desactivado correctamente',
usuario_activado:'Usuario activado correctamente',clave_actualizada:'Clave actualizada correctamente',
pago_cuotas:'Pago de Cuotas',pagar_total:'Pagar Total',monto_pagar:'Monto a Pagar',
seleccionadas:'cuota(s) seleccionada(s)',prestamo:'Prestamo',todos:'Todos',mostrando:'Mostrando',de:'de',por_pagina:'por página',
contabilidad:'Contabilidad',plan_cuentas:'Plan de Cuentas',asientos_contables:'Asientos Contables',
config_contable:'Config. Contable',reportes_contables:'Reportes Contables',nueva_cuenta:'Nueva Cuenta',
cuenta:'Cuenta',codigo:'C\u00F3digo',naturaleza:'Naturaleza',nivel:'Nivel',cuenta_padre:'Cuenta Padre',
nuevo_asiento:'Nuevo Asiento',agregar_linea:'Agregar L\u00EDnea',cuenta_contable:'Cuenta Contable',
totales:'Totales',diferencia:'Diferencia',concepto:'Concepto',operacion:'Operaci\u00F3n',
cuenta_debe:'Cuenta D\u00E9bito',cuenta_haber:'Cuenta Cr\u00E9dito',balance_comprobacion:'Balance de Comprobaci\u00F3n',
libro_diario:'Libro Diario',libro_mayor:'Libro Mayor',estado_resultados:'Estado de Resultados',
balance_general:'Balance General',config_info:'Configure las cuentas contables para cada operaci\u00F3n.',
asiento:'Asiento',detalles:'Detalles',datos_personales:'Datos Personales',seguridad:'Seguridad',
guardar_cambios:'Guardar Cambios',ultimos_prestamos:'\u00DAltimos Pr\u00E9stamos',
ultimos_pagos:'\u00DAltimos Pagos',cuotas_vencidas:'Cuotas Vencidas',usuarios_activos:'Usuarios Activos',
total_prestamos:'Total Pr\u00E9stamos',pendientes:'Pendientes',monto_prestado:'Monto Prestado',
capital_pendiente:'Capital Pendiente',vencidas:'Vencidas',proximas:'Pr\u00F3ximas',por_cobrar:'Por Cobrar',
ganancias:'Ganancias',vence:'Vence',inicio_pago:'Inicio Pago',nuevo_prestamo:'Nuevo Pr\u00E9stamo',
ganancias:'Ganancias',vence:'Vence',inicio_pago:'Inicio Pago',nuevo_prestamo:'Nuevo Préstamo',nuevo_cliente:'Nuevo Cliente',nuevo_usuario:'Nuevo Usuario',nueva_moneda:'Nueva Moneda',limite_ayuda:'Dejar vacío para sin límite',limite_prestamos_activos:'Préstamos Activos Máx.',limite_prestamos_activos_ayuda:'Máximo de préstamos activos simultáneos',moneda_default:'Moneda por Defecto',mora_activa:'Mora Activa',porcentaje_mora:'% Mora Diario',dias_gracia:'Días de Gracia',limite_prestamo:'Límite Máx Préstamo',tipo_mora:'Tipo de Mora',formato_recibo:'Formato Recibo',formato_mora_recibo:'Formato Mora en Recibo',mostrar_ganancias:'Mostrar Ganancias',total_debe:'Total Debe',total_haber:'Total Haber',diferencia:'Diferencia',detalles:'Detalles',descripcion:'Descripción',
amortizacion:'Amortizaci\u00F3n',ninguno:'Ninguno',tipo_doc:'Tipo Documento',simbolo:'S\u00EDmbolo',
datos_perfil:'Datos del Perfil',num_documento:'Nro. Documento',recordarme:'Recordarme',modulo:'M\u00F3dulo',
marcar_todas:'Marcar todas',sidebar_compacto:'Sidebar Compacto',cambiar:'Cambiar',semanal:'Semanal',quincenal:'Quincenal',mensual:'Mensual',
plazo:'Plazo'
};

LANG.en = {
name:'English',flag:'\uD83C\uDDEC\uD83C\uDDE7',
login:'Sign In',dashboard:'Dashboard',prestamos:'Loans',registro:'Register',historial:'History',fecha_desde:'From',fecha_hasta:'To',
clientes:'Clients',monedas:'Currencies',configuracion:'Configuration',usuarios:'Users',preferencias:'Preferences',
perfil:'Profile',cerrar:'Sign Out',cerrar_modal:'Close',nuevo:'New',editar:'Edit',eliminar:'Delete',
// Superadmin
sa_dashboard:'Global Dashboard',sa_empresas:'Companies',sa_usuarios:'Users',sa_usuarios_globales:'Global Users',sa_bd_config:'Configured DBs',sa_empresa:'Company',sa_estado:'Status',sa_nuevo:'New',sa_nombre:'Name',sa_acciones:'Actions',sa_rol:'Role',
sa_editar:'Edit Company',sa_probar_conexion:'Test Connection',sa_config_bd:'DB Configuration',sa_slug_help:'Unique identifier (e.g. my-company)',sa_puerto:'Port',sa_bd:'Database',sa_usuario_bd:'DB User',sa_password_bd:'DB Password',
sa_sin_empresas:'No companies registered',sa_activa:'Active',sa_inactiva:'Inactive',sa_configurada:'Configured',sa_sin_config:'No config',
sa_activo:'Active',sa_inactivo:'Inactive',
guardar:'Save',cancelar:'Cancel',buscar:'Search',limpiar:'Clear',fecha:'Date',monto:'Amount',
pagado:'Paid',cuotas:'Installments',interes:'Interest',estado:'Status',cliente:'Client',moneda:'Currency',
tipo_cuota:'Installment Type',cargo:'Role',nombre:'Name',apellido:'Last Name',documento:'Document',
telefono:'Phone',email:'Email',direccion:'Address',login:'Login',clave:'Password',usuario:'User',nombre_completo:'Full Name',
tema:'Theme',idioma:'Language',pagar:'Pay',comprobante:'Voucher',imprimir:'Print',recibo:'Receipt',
monto_total:'Total Amount',valor_cuota:'Installment Value',total_pagado:'Total Paid',tipo:'Type',restante:'Remaining',
cuota:'Installment',fecha_pago:'Payment Date',mora:'Late Fee',prestamo_creado:'Loan Created',prestamo_capital_pagado:'Capital Paid',prestamo_interes_pagado:'Interest Paid',prestamo_cobrado_capital:'Capital Collected',prestamo_cobrado_interes:'Interest Collected',prestamo_mora:'Late Fee',sin_datos:'No data',completar:'Complete fields',
error:'Error',exito:'Success',activo:'Active',inactivo:'Inactive',anulado:'Voided',origen:'Source',accion:'Action',
saldo_pendiente:'Pending Balance',cancelar_modal:'Cancel',confirmar:'Confirm',
creado:'created',actualizado:'updated',eliminado:'deleted',desactivado:'disabled',activado:'enabled',
desactivar:'Disable',activar:'Enable',cambiar_clave:'Change Password',nueva_clave:'New Password',
cliente_creado:'Client created',cliente_actualizado:'Client updated',prestamo_creado:'Loan created',
pago_realizado:'Payment successful',moneda_creada:'Currency created',moneda_actualizada:'Currency updated',
moneda_eliminada:'Currency deleted',usuario_creado:'User created',usuario_actualizado:'User updated',
usuario_desactivado:'User disabled',usuario_activado:'User enabled',clave_actualizada:'Password updated',
pago_cuotas:'Payment',pagar_total:'Pay Total',monto_pagar:'Amount to Pay',
seleccionadas:'installment(s) selected',prestamo:'Loan',todos:'All',mostrando:'Showing',de:'of',por_pagina:'per page',
contabilidad:'Accounting',plan_cuentas:'Chart of Accounts',asientos_contables:'Journal Entries',
config_contable:'Accounting Config',reportes_contables:'Accounting Reports',nueva_cuenta:'New Account',
cuenta:'Account',codigo:'Code',naturaleza:'Nature',nivel:'Level',cuenta_padre:'Parent Account',
nuevo_asiento:'New Entry',agregar_linea:'Add Line',cuenta_contable:'Account',totales:'Totals',
diferencia:'Difference',concepto:'Concept',operacion:'Operation',cuenta_debe:'Debit Account',
cuenta_haber:'Credit Account',balance_comprobacion:'Trial Balance',libro_diario:'General Journal',
libro_mayor:'General Ledger',estado_resultados:'Income Statement',balance_general:'Balance Sheet',
config_info:'Configure accounts for each operation.',asiento:'Entry',detalles:'Details',
datos_personales:'Personal Data',seguridad:'Security',guardar_cambios:'Save Changes',
ultimos_prestamos:'Latest Loans',ultimos_pagos:'Latest Payments',cuotas_vencidas:'Overdue Installments',
usuarios_activos:'Active Users',total_prestamos:'Total Loans',pendientes:'Pending',
monto_prestado:'Loaned Amount',capital_pendiente:'Outstanding Capital',vencidas:'Overdue',
proximas:'Upcoming',por_cobrar:'To Collect',ganancias:'Earnings',vence:'Due',inicio_pago:'Payment Start',
nuevo_prestamo:'New Loan',nuevo_cliente:'New Client',nuevo_usuario:'New User',nueva_moneda:'New Currency',limite_ayuda:'Leave empty for no limit',limite_prestamos_activos:'Max Active Loans',limite_prestamos_activos_ayuda:'Maximum simultaneous active loans',seleccionar:'Select...',nro_cuotas:'Installments',fecha_inicio:'Start Date',moneda_default:'Default Currency',mora_activa:'Active Late Fee',porcentaje_mora:'% Daily Late Fee',dias_gracia:'Grace Days',limite_prestamo:'Max Loan Limit',tipo_mora:'Late Fee Type',formato_recibo:'Receipt Format',formato_mora_recibo:'Late Fee Format on Receipt',mostrar_ganancias:'Show Earnings',total_debe:'Total Debit',total_haber:'Total Credit',diferencia:'Difference',detalles:'Details',descripcion:'Description',
datos:'Details',amortizacion:'Amortization',ninguno:'None',tipo_doc:'Doc. Type',simbolo:'Symbol',
datos_perfil:'Profile Data',num_documento:'Doc. Number',recordarme:'Remember Me',modulo:'Module',
marcar_todas:'Mark all read',sidebar_compacto:'Compact Sidebar',cambiar:'Change',semanal:'Weekly',quincenal:'Biweekly',mensual:'Monthly',
plazo:'Term'
};

LANG.fr = {
name:'Francais',flag:'\uD83C\uDDEB\uD83C\uDDF7',
login:'Connexion',dashboard:'Tableau de Bord',prestamos:'Pr\u00EAt',registro:'Enregistrement',historial:'Historique',fecha_desde:'Du',fecha_hasta:'Au',
clientes:'Clients',monedas:'Monnaies',configuracion:'Configuration',usuarios:'Utilisateurs',
preferencias:'Pr\u00E9f\u00E9rences',perfil:'Profil',cerrar:'D\u00E9connexion',cerrar_modal:'Fermer',
nuevo:'Nouveau',editar:'Modifier',eliminar:'Supprimer',guardar:'Enregistrer',cancelar:'Annuler',
buscar:'Rechercher',limpiar:'Effacer',fecha:'Date',monto:'Montant',pagado:'Pay\u00E9',
cuotas:'\u00C9ch\u00E9ances',interes:'Int\u00E9r\u00EAt',estado:'Statut',cliente:'Client',moneda:'Monnaie',
tipo_cuota:"Type d'\u00E9ch\u00E9ance",cargo:'R\u00F4le',nombre:'Nom',apellido:'Pr\u00E9nom',
documento:'Document',telefono:'T\u00E9l\u00E9phone',email:'Email',direccion:'Adresse',login:'Login',
clave:'Mot de passe',usuario:'Utilisateur',nombre_completo:'Nom Complet',tema:'Th\u00E8me',idioma:'Langue',pagar:'Payer',
comprobante:'Re\u00E7u',imprimer:'Imprimer',recibo:'Re\u00E7u',monto_total:'Montant Total',
valor_cuota:'Valeur \u00C9ch\u00E9ance',total_pagado:'Total Pay\u00E9',restante:'Restant',
cuota:'\u00C9ch\u00E9ance',fecha_pago:'Date Paiement',mora:'P\u00E9nalit\u00E9',
sin_datos:'Aucune donn\u00E9e',completar:'Completez les champs',error:'Erreur',exito:'Succ\u00E8s',
activo:'Actif',inactivo:'Inactif',anulado:'Annulé',origen:'Source',accion:'Action',saldo_pendiente:'Solde Restant',
cancelar_modal:'Annuler',confirmar:'Confirmer',creado:'cr\u00E9\u00E9',actualizado:'mis \u00E0 jour',
eliminado:'supprim\u00E9',desactivado:'d\u00E9sactiv\u00E9',activado:'activ\u00E9',
desactivar:'D\u00E9sactiver',activar:'Activer',cambiar_clave:'Changer Mot de Passe',
nueva_clave:'Nouveau Mot de Passe',cliente_creado:'Client cr\u00E9\u00E9',
cliente_actualizado:'Client mis \u00E0 jour',prestamo_creado:'Pr\u00EAt cr\u00E9\u00E9',
pago_realizado:'Paiement r\u00E9ussi',moneda_creada:'Monnaie cr\u00E9\u00E9e',
moneda_actualizada:'Monnaie mise \u00E0 jour',moneda_eliminada:'Monnaie supprim\u00E9e',
usuario_creado:'Utilisateur cr\u00E9\u00E9',usuario_actualizado:'Utilisateur mis \u00E0 jour',
usuario_desactivado:'Utilisateur d\u00E9sactiv\u00E9',usuario_activado:'Utilisateur activ\u00E9',
clave_actualizada:'Mot de passe mis \u00E0 jour',pago_cuotas:'Paiement',pagar_total:'Payer Total',
monto_pagar:'Montant \u00E0 Payer',seleccionadas:'\u00E9ch\u00E9ance(s) s\u00E9lectionn\u00E9e(s)',
prestamo:'Pr\u00EAt',todos:'Tous',mostrando:'Affichage',de:'sur',
contabilidad:'Comptabilit\u00E9',plan_cuentas:'Plan Comptable',asientos_contables:'\u00C9critures',
config_contable:'Config. Comptable',reportes_contables:'Rapports',nueva_cuenta:'Nouveau Compte',
cuenta:'Compte',codigo:'Code',naturaleza:'Nature',nivel:'Niveau',cuenta_padre:'Compte Parent',
nuevo_asiento:'Nouvelle \u00C9criture',agregar_linea:'Ajouter Ligne',cuenta_contable:'Compte',
totales:'Totaux',diferencia:'Diff\u00E9rence',concepto:'Concept',operacion:'Op\u00E9ration',
cuenta_debe:'Compte D\u00E9bit',cuenta_haber:'Compte Cr\u00E9dit',balance_comprobacion:'Balance de V\u00E9rification',
libro_diario:'Journal G\u00E9n\u00E9ral',libro_mayor:'Grand Livre',estado_resultados:'Compte de R\u00E9sultat',
balance_general:'Bilan',config_info:'Configurez les comptes pour chaque op\u00E9ration.',
asiento:'\u00C9criture',detalles:'D\u00E9tails',datos_personales:'Donn\u00E9es Personnelles',
seguridad:'S\u00E9curit\u00E9',guardar_cambios:'Enregistrer les Modifications',
ultimos_prestamos:'Derniers Pr\u00EAt',ultimos_pagos:'Derniers Paiements',
cuotas_vencidas:'\u00C9ch\u00E9ances en Retard',usuarios_activos:'Utilisateurs Actifs',
total_prestamos:'Total Pr\u00EAt',pendientes:'En Attente',monto_prestado:'Montant Pr\u00EAt\u00E9',
capital_pendiente:'Capital Restant',vencidas:'En Retard',proximas:'\u00C0 Venir',
por_cobrar:'\u00C0 Recevoir',ganancias:'Gains',vence:'\u00C9ch\u00E9ance',inicio_pago:'D\u00E9but Paiement',
nuevo_prestamo:'Nouveau Pr\u00EAt',seleccionar:'S\u00E9lectionner...',nro_cuotas:'Nb \u00C9ch\u00E9ances',
nuevo_prestamo:'Nouveau Prêt',nuevo_cliente:'Nouveau Client',nuevo_usuario:'Nouvel Utilisateur',nueva_moneda:'Nouvelle Devise',limite_ayuda:'Laisser vide pour aucune limite',limite_prestamos_activos:'Prêt Actifs Max.',limite_prestamos_activos_ayuda:'Maximum de prêts actifs simultanés',seleccionar:'Sélectionner...',nro_cuotas:'Nb Échéances',moneda_default:'Monnaie par Défaut',mora_activa:'Pénalité Active',porcentaje_mora:'% Pénalité/Jour',dias_gracia:'Jours de Grâce',limite_prestamo:'Montant Max Prêt',tipo_mora:'Type Pénalité',formato_recibo:'Format Reçu',formato_mora_recibo:'Format Pénalité sur Reçu',mostrar_ganancias:'Afficher Revenus',total_debe:'Total Débit',total_haber:'Total Crédit',diferencia:'Différence',detalles:'Détails',descripcion:'Description',
tipo_doc:'Type Document',simbolo:'Symbole',datos_perfil:'Donn\u00E9es du Profil',
num_documento:'N\u00B0 Document',recordarme:'Se souvenir',modulo:'Module',
marcar_todas:'Tout marquer',sidebar_compacto:'Barre Lat\u00E9rale Compacte',cambiar:'Changer',permisos:'Autorisations',semanal:'Hebdomadaire',
// Superadmin
sa_dashboard:'Tableau de Bord Global',sa_empresas:'Entreprises',sa_usuarios:'Utilisateurs',sa_usuarios_globales:'Utilisateurs Globaux',sa_bd_config:'BD Configurées',sa_empresa:'Entreprise',sa_estado:'Statut',sa_nuevo:'Nouveau',sa_nombre:'Nom',sa_acciones:'Actions',sa_rol:'Rôle',
sa_editar:'Modifier Entreprise',sa_probar_conexion:'Tester Connexion',sa_config_bd:'Configuration BD',sa_slug_help:'Identifiant unique (ex: mon-entreprise)',sa_puerto:'Port',sa_bd:'Base de Données',sa_usuario_bd:'Utilisateur BD',sa_password_bd:'Mot de Passe BD',
sa_sin_empresas:'Aucune entreprise enregistrée',sa_activa:'Active',sa_inactiva:'Inactive',sa_configurada:'Configurée',sa_sin_config:'Non config.',
sa_activo:'Actif',sa_inactivo:'Inactif',
quincenal:'Bimensuel',mensual:'Mensuel',plazo:'Dur\u00E9e'
};

LANG.pt = {
name:'Portugu\u00EAs',flag:'\uD83C\uDDE7\uD83C\uDDF7',
login:'Fazer Login',dashboard:'Dashboard',prestamos:'Empr\u00E9stimos',registro:'Registro',historial:'Histórico',fecha_desde:'De',fecha_hasta:'Até',
clientes:'Clientes',monedas:'Moedas',configuracao:'Configura\u00E7\u00E3o',usuarios:'Usu\u00E1rios',
preferencias:'Prefer\u00EAncias',perfil:'Perfil',cerrar:'Sair',cerrar_modal:'Fechar',nuevo:'Novo',
editar:'Editar',eliminar:'Excluir',guardar:'Salvar',cancelar:'Cancelar',buscar:'Buscar',limpiar:'Limpar',
fecha:'Data',monto:'Valor',pagado:'Pago',cuotas:'Parcelas',interes:'Juros',estado:'Status',
cliente:'Cliente',moneda:'Moeda',tipo_cuota:'Tipo de Parcela',cargo:'Cargo',nombre:'Nome',
apellido:'Sobrenome',documento:'Documento',telefono:'Telefone',email:'Email',direccion:'Endere\u00E7o',
login:'Login',clave:'Senha',usuario:'Usu\u00E1rio',nombre_completo:'Nome Completo',tema:'Tema',idioma:'Idioma',pagar:'Pagar',
comprobante:'Comprovante',imprimir:'Imprimir',recibo:'Recibo',monto_total:'Valor Total',
valor_cuota:'Valor Parcela',total_pagado:'Total Pago',tipo:'Tipo',restante:'Restante',cuota:'Parcela',
fecha_pago:'Data Pagamento',mora:'Multa',prestamo_creado:'Empréstimo Criado',prestamo_capital_pagado:'Capital Pago',prestamo_interes_pagado:'Juros Pagos',prestamo_cobrado_capital:'Capital Recebido',prestamo_cobrado_interes:'Juros Recebido',prestamo_mora:'Multa',sin_dados:'Sem dados',completar:'Preencha todos os campos',
error:'Erro',exito:'Sucesso',activo:'Ativo',inactivo:'Inativo',accion:'A\u00E7\u00E3o',
saldo_pendente:'Saldo Pendente',cancelar_modal:'Cancelar',confirmar:'Confirmar',
creado:'criado',actualizado:'atualizado',eliminado:'exclu\u00EDdo',desactivado:'desativado',
activado:'ativado',desactivar:'Desativar',activar:'Ativar',cambiar_clave:'Alterar Senha',
nueva_clave:'Nova Senha',cliente_creado:'Cliente criado',cliente_actualizado:'Cliente atualizado',
prestamo_creado:'Empr\u00E9stimo criado',pago_realizado:'Pagamento realizado',
moneda_creada:'Moeda criada',moneda_actualizada:'Moeda atualizada',moneda_eliminada:'Moeda exclu\u00EDda',
usuario_creado:'Usu\u00E1rio criado',usuario_actualizado:'Usu\u00E1rio atualizado',
usuario_desactivado:'Usu\u00E1rio desativado',usuario_activado:'Usu\u00E1rio ativado',
clave_actualizada:'Senha atualizada',pago_cuotas:'Pagamento',pagar_total:'Pagar Total',
monto_pagar:'Valor a Pagar',seleccionadas:'parcela(s) selecionada(s)',
prestamo:'Empr\u00E9stimo',todos:'Todos',mostrando:'Mostrando',de:'de',por_pagina:'por página',
modulo:'M\u00F3dulo',contabilidade:'Contabilidade',plan_cuentas:'Plano de Contas',
asientos_contables:'Lan\u00E7amentos',config_contable:'Config. Cont\u00E1bil',
reportes_contables:'Relat\u00F3rios',nueva_cuenta:'Nova Conta',codigo:'C\u00F3digo',
naturaleza:'Natureza',nivel:'N\u00EDvel',cuenta_padre:'Conta Pai',
nuevo_asiento:'Novo Lan\u00E7amento',agregar_linea:'Adicionar Linha',cuenta_contable:'Conta Cont\u00E1bil',
totales:'Totais',diferencia:'Diferen\u00E7a',concepto:'Conceito',operacion:'Opera\u00E7\u00E3o',
cuenta_debe:'Conta D\u00E9bito',cuenta_haber:'Conta Cr\u00E9dito',balance_comprobacion:'Balancete',
libro_diario:'Di\u00E1rio',libro_mayor:'Raz\u00E3o',estado_resultados:'Resultado',
balance_general:'Balan\u00E7o',config_info:'Configure as contas para cada opera\u00E7\u00E3o.',
asiento:'Lan\u00E7amento',datos_personales:'Dados do Perfil',segurança:'Seguran\u00E7a',
guardar_cambios:'Salvar Altera\u00E7\u00F5es',ultimos_prestamos:'\u00DAltimos Empr\u00E9stimos',
ultimos_pagos:'\u00DAltimos Pagamentos',cuotas_vencidas:'Parcelas Vencidas',
usuarios_activos:'Usu\u00E1rios Ativos',total_prestamos:'Total Empr\u00E9stimos',
pendientes:'Pendentes',monto_prestado:'Valor Emprestado',capital_pendiente:'Capital Pendente',
vencidas:'Vencidas',proximas:'Pr\u00F3ximas',por_cobrar:'A Receber',ganancias:'Ganhos',
vence:'Vence',inicio_pago:'In\u00EDcio Pagamento',nuevo_prestamo:'Novo Empr\u00E9stimo',
vence:'Vence',inicio_pago:'Início Pagamento',nuevo_prestamo:'Novo Empréstimo',nuevo_cliente:'Novo Cliente',nuevo_usuario:'Novo Usuário',nueva_moneda:'Nova Moeda',limite_ayuda:'Deixe vazio para sem limite',limite_prestamos_activos:'Empréstimos Ativos Máx.',limite_prestamos_activos_ayuda:'Máximo de empréstimos ativos simultâneos',moneda_default:'Moeda Padrão',mora_activa:'Multa Ativa',porcentaje_mora:'% Multa Diária',dias_gracia:'Dias de Graça',limite_prestamo:'Limite Máx Empréstimo',tipo_mora:'Tipo de Multa',formato_recibo:'Formato Recibo',formato_mora_recibo:'Formato Multa no Recibo',mostrar_ganancias:'Mostrar Ganhos',total_debe:'Total Débito',total_haber:'Total Crédito',diferencia:'Diferença',detalles:'Detalhes',descripcion:'Descrição',
datos:'Dados',amortizacion:'Amortiza\u00E7\u00E3o',ninguno:'Nenhum',tipo_doc:'Tipo Documento',
simbolo:'S\u00EDmbolo',datos_perfil:'Dados do Perfil',num_documento:'N\u00B0 Documento',
marcar_todas:'Marcar todas',recordarme:'Lembrar-me',detalles:'Detalhes',sidebar_compacto:'Sidebar Compacto',cambiar:'Alterar',permisos:'Permiss\u00F5es',
semanal:'Semanal',quincenal:'Quinzenal',mensual:'Mensal',plazo:'Prazo',
// Superadmin
sa_dashboard:'Dashboard Global',sa_empresas:'Empresas',sa_usuarios:'Usuários',sa_usuarios_globales:'Usuários Globais',sa_bd_config:'BD Configuradas',sa_empresa:'Empresa',sa_estado:'Status',sa_nuevo:'Nova',sa_nombre:'Nome',sa_acciones:'Ações',sa_rol:'Função',
sa_editar:'Editar Empresa',sa_probar_conexion:'Testar Conexão',sa_config_bd:'Configuração BD',sa_slug_help:'Identificador único (ex: minha-empresa)',sa_puerto:'Porta',sa_bd:'Base de Dados',sa_usuario_bd:'Usuário BD',sa_password_bd:'Senha BD',
sa_sin_empresas:'Nenhuma empresa registrada',sa_activa:'Ativa',sa_inactiva:'Inativa',sa_configurada:'Configurada',sa_sin_config:'Sem config.',
sa_activo:'Ativo',sa_inactivo:'Inativo'
};

function __(k){var l=L||'en';return(LANG[l]&&LANG[l][k])||LANG.en[k]||k;}
function __estado(est){
    var map={Pendiente:'pendientes',Pagado:'pagado',Pagada:'pagado',Vencido:'vencidas',Cancelado:'cancelar_modal'};
    return __(map[est]||est);
}
var titles={dashboard:'dashboard',prestamos:'registro',reimprimir:'historial',clientes:'clientes',monedas:'monedas',usuarios:'usuarios',config:'preferencias',perfil:'perfil','plan-cuentas':'plan_cuentas',asientos:'asientos_contables','config-contable':'config_contable','reportes-contables':'reportes_contables'};
function aplicarIdioma(){
    var li=localStorage.getItem('idioma');
    if(li && LANG[li]){L=li;}else{L='es';}
    var els=document.querySelectorAll('[data-i18n]');
    for(var i=0;i<els.length;i++){
        var k=els[i].getAttribute('data-i18n');
        var txt=__(k);
        els[i].textContent=txt;
    }
    var phs=document.querySelectorAll('[data-i18n-placeholder]');
    for(var i=0;i<phs.length;i++){
        var k=phs[i].getAttribute('data-i18n-placeholder');
        phs[i].placeholder=__(k);
    }
    var pg=document.querySelector('.pg.act');
    if(pg){var pt=document.getElementById('pt');if(pt){var tKey=(typeof titles!=='undefined'&&titles[pg.id.replace('p-','')])||pg.id.replace('p-','');pt.textContent=__(tKey);}}
    // Traducir badges de estado
    var badges=document.querySelectorAll('.badge');
    var estadoMap={'Pagado':'pagado','Pendiente':'pendientes','Vencido':'vencidas','Pagada':'pagado','Activo':'activo','Inactivo':'inactivo','Cancelado':'cancelar_modal'};
    for(var i=0;i<badges.length;i++){
        var txt=badges[i].textContent.trim();
        if(estadoMap[txt]){badges[i].textContent=__(estadoMap[txt]);}
    }
    if(L){localStorage.setItem('idioma',L);}
}

function cargarIdiomaGlobal(){
    if(!user)return;
    try{
        var prefs=JSON.parse(user.preferencias||'{}');
        if(prefs.idioma){L=prefs.idioma;localStorage.setItem('idioma',prefs.idioma);}
    }catch(e){}
}
var L=localStorage.getItem('idioma')||'es';
