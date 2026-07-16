/**
 * ============================================
 * ROBENGATE SENTINEL — MAIN JAVASCRIPT v2.0
 * ============================================
 * Documentación interactiva · 159 documentos
 * 27 categorías · Sidebar dinámico con búsqueda
 * ============================================
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  const CONFIG = {
    BASE_PATH:      'docs-es/',
    STORAGE_KEY:    'robengate_last_doc',
    THEME_KEY:      'robengate_theme',
    SECTIONS_KEY:   'robengate_open_sections',
    DEFAULT_DOC:    'MASTER_DOCUMENTATION.md',
    SEARCH_DELAY:   180,
  };

  // ============================================
  // ESTRUCTURA DE DOCUMENTACIÓN — 159 archivos
  // ============================================
  const DOCS = [
    {
      id: 'inicio', label: 'Inicio', icon: 'fa-house',
      files: [
        { path: 'README.md',               label: 'Léame' },
        { path: 'MASTER_DOCUMENTATION.md', label: 'Documentación Maestra' },
      ],
    },
    {
      id: 'arquitectura', label: 'Arquitectura del Sistema', icon: 'fa-project-diagram',
      files: [
        { path: 'architecture/arquitectura-sistema.md',         label: 'Arquitectura del Sistema' },
        { path: 'architecture/arquitectura-empresarial.md',     label: 'Arquitectura Empresarial' },
        { path: 'architecture/flujo-autenticacion.md',          label: 'Flujo de Autenticación' },
        { path: 'architecture/flujo-rbac.md',                   label: 'Flujo RBAC' },
        { path: 'architecture/flujo-siem.md',                   label: 'Flujo SIEM' },
        { path: 'architecture/flujo-ia.md',                     label: 'Flujo de IA' },
        { path: 'architecture/flujo-incidentes.md',             label: 'Flujo de Incidentes' },
        { path: 'architecture/flujo-honeypot.md',               label: 'Flujo Honeypot' },
        { path: 'architecture/flujo-threat-intelligence.md',    label: 'Flujo Threat Intelligence' },
        { path: 'architecture/flujo-motor-riesgo.md',           label: 'Flujo Motor de Riesgo' },
        { path: 'architecture/flujo-auditoria.md',              label: 'Flujo de Auditoría' },
      ],
    },
    {
      id: 'administracion', label: 'Administración', icon: 'fa-cogs',
      files: [
        { path: 'admin/administracion-rbac.md',      label: 'Administración RBAC' },
        { path: 'admin/administracion-usuarios.md',  label: 'Administración de Usuarios' },
        { path: 'admin/configuracion-plataforma.md', label: 'Configuración de Plataforma' },
        { path: 'admin/gestion-alertas.md',          label: 'Gestión de Alertas' },
        { path: 'admin/gestion-dispositivos.md',     label: 'Gestión de Dispositivos' },
        { path: 'admin/gestion-incidentes.md',       label: 'Gestión de Incidentes' },
      ],
    },
    {
      id: 'api', label: 'Referencia API', icon: 'fa-code',
      files: [
        { path: 'api/autenticacion.md',       label: 'Autenticación' },
        { path: 'api/usuarios.md',            label: 'Usuarios' },
        { path: 'api/roles-rbac.md',          label: 'Roles RBAC' },
        { path: 'api/dashboard.md',           label: 'Dashboard' },
        { path: 'api/alertas.md',             label: 'Alertas' },
        { path: 'api/incidentes.md',          label: 'Incidentes' },
        { path: 'api/devices.md',             label: 'Dispositivos' },
        { path: 'api/security-logs.md',       label: 'Security Logs' },
        { path: 'api/audit-logs.md',          label: 'Audit Logs' },
        { path: 'api/threat-hunting.md',      label: 'Threat Hunting' },
        { path: 'api/threat-intelligence.md', label: 'Threat Intelligence' },
        { path: 'api/ai-analysis.md',         label: 'AI Analysis' },
        { path: 'api/honeypot.md',            label: 'Honeypot' },
        { path: 'api/attack-map.md',          label: 'Attack Map' },
        { path: 'api/vulnerabilidades.md',    label: 'Vulnerabilidades' },
        { path: 'api/sessions.md',            label: 'Sesiones' },
        { path: 'api/configuracion.md',       label: 'Configuración' },
      ],
    },
    {
      id: 'database', label: 'Base de Datos', icon: 'fa-database',
      files: [
        { path: 'database/resumen.md',              label: 'Resumen' },
        { path: 'database/postgresql-schema.md',    label: 'Schema PostgreSQL' },
        { path: 'database/mongodb-schema.md',       label: 'Schema MongoDB' },
        { path: 'database/entity-relationships.md', label: 'Entidades y Relaciones' },
        { path: 'database/index-strategy.md',       label: 'Estrategia de Índices' },
        { path: 'database/retention-policies.md',   label: 'Políticas de Retención' },
      ],
    },
    {
      id: 'infraestructura', label: 'Infraestructura', icon: 'fa-cloud',
      files: [
        { path: 'infrastructure/resumen.md',               label: 'Resumen' },
        { path: 'infrastructure/environment-variables.md', label: 'Variables de Entorno' },
        { path: 'infrastructure/kubernetes.md',            label: 'Kubernetes' },
        { path: 'infrastructure/monitoring-stack.md',      label: 'Stack de Monitoreo' },
      ],
    },
    {
      id: 'operaciones', label: 'Operaciones', icon: 'fa-tools',
      files: [
        { path: 'operations/01-installation-guide.md',  label: 'Guía de Instalación' },
        { path: 'operations/02-development-guide.md',   label: 'Guía de Desarrollo' },
        { path: 'operations/03-deployment-guide.md',    label: 'Guía de Despliegue' },
        { path: 'operations/04-production-guide.md',    label: 'Guía de Producción' },
        { path: 'operations/05-troubleshooting-guide.md', label: 'Troubleshooting' },
        { path: 'operations/06-monitoring-guide.md',    label: 'Guía de Monitoreo' },
        { path: 'operations/07-backup-guide.md',        label: 'Guía de Backup' },
        { path: 'operations/08-recovery-guide.md',      label: 'Guía de Recuperación' },
        { path: 'operations/09-upgrade-guide.md',       label: 'Guía de Upgrades' },
      ],
    },
    {
      id: 'seguridad', label: 'Seguridad', icon: 'fa-lock',
      files: [
        { path: 'security/resumen.md',                label: 'Resumen' },
        { path: 'security/motor-riesgo.md',           label: 'Motor de Riesgo' },
        { path: 'security/frontend-storage-audit.md', label: 'Auditoría Almacenamiento' },
      ],
    },
    {
      id: 'soc', label: 'Centro de Operaciones (SOC)', icon: 'fa-shield-halved',
      files: [
        { path: 'soc/operaciones-soc.md',         label: 'Operaciones SOC' },
        { path: 'soc/procedimientos-soc.md',       label: 'Procedimientos SOC' },
        { path: 'soc/investigacion-alertas.md',    label: 'Investigación de Alertas' },
        { path: 'soc/investigacion-incidentes.md', label: 'Investigación de Incidentes' },
        { path: 'soc/analisis-riesgo.md',          label: 'Análisis de Riesgo' },
        { path: 'soc/analisis-ioc.md',             label: 'Análisis de IOC' },
        { path: 'soc/threat-hunting.md',           label: 'Threat Hunting SOC' },
      ],
    },
    {
      id: 'siem', label: 'SIEM', icon: 'fa-chart-line',
      files: [
        { path: 'siem/resumen.md',               label: 'Resumen SIEM' },
        { path: 'siem/motor-deteccion.md',        label: 'Motor de Detección' },
        { path: 'siem/capacidades-plataforma.md', label: 'Capacidades de la Plataforma' },
      ],
    },
    {
      id: 'modulos', label: 'Módulos del Sistema', icon: 'fa-puzzle-piece',
      files: [
        { path: 'honeypot/resumen.md',            label: 'Honeypot' },
        { path: 'threat-intelligence/resumen.md', label: 'Threat Intelligence' },
        { path: 'threat-hunting/resumen.md',      label: 'Threat Hunting' },
        { path: 'ai-analysis/resumen.md',         label: 'Análisis con IA' },
        { path: 'rbac/resumen.md',                label: 'Control de Acceso (RBAC)' },
        { path: 'attack-map/resumen.md',          label: 'Mapa de Ataques' },
        { path: 'audit-system/resumen.md',        label: 'Sistema de Auditoría' },
        { path: 'backend/resumen.md',             label: 'Backend' },
        { path: 'frontend/resumen.md',            label: 'Frontend' },
        { path: 'realtime/sistema-eventos.md',    label: 'Eventos en Tiempo Real' },
        { path: 'incident-management/resumen.md', label: 'Gestión de Incidentes' },
        { path: 'deployment/resumen.md',          label: 'Despliegue' },
        { path: 'ingestion/pipeline-ingesta.md',  label: 'Pipeline de Ingesta' },
        { path: 'integrations/resumen.md',        label: 'Integraciones' },
        { path: 'integrations/email-system.md',   label: 'Sistema de Email' },
      ],
    },
    {
      id: 'inventario', label: 'Inventario del Proyecto', icon: 'fa-folder-tree',
      files: [
        { path: 'project-inventory/system-overview.md',          label: 'Visión General del Sistema' },
        { path: 'project-inventory/backend-inventory.md',        label: 'Inventario Backend' },
        { path: 'project-inventory/frontend-inventory.md',       label: 'Inventario Frontend' },
        { path: 'project-inventory/database-inventory.md',       label: 'Inventario Base de Datos' },
        { path: 'project-inventory/api-inventory.md',            label: 'Inventario API' },
        { path: 'project-inventory/security-inventory.md',       label: 'Inventario Seguridad' },
        { path: 'project-inventory/infrastructure-inventory.md', label: 'Inventario Infraestructura' },
        { path: 'project-inventory/deployment-inventory.md',     label: 'Inventario Despliegue' },
      ],
    },
    /* ── SECCIONES OCULTAS TEMPORALMENTE ──────────────────────────────────
    {
      id: 'negocio', label: 'Negocio & SaaS', icon: 'fa-briefcase',
      files: [
        { path: 'business/vision-producto.md',            label: 'Visión del Producto' },
        { path: 'business/estrategia-saas.md',            label: 'Estrategia SaaS' },
        { path: 'business/analisis-competitivo.md',       label: 'Análisis Competitivo' },
        { path: 'business/casos-de-uso-empresariales.md', label: 'Casos de Uso Empresariales' },
        { path: 'business/contenido-faltante.md',         label: 'Contenido Faltante' },
      ],
    },
    {
      id: 'comercial', label: 'Comercial', icon: 'fa-handshake',
      files: [
        { path: 'comercial/propuesta-valor.md',       label: 'Propuesta de Valor' },
        { path: 'comercial/ventajas-competitivas.md', label: 'Ventajas Competitivas' },
        { path: 'comercial/casos-de-uso.md',          label: 'Casos de Uso' },
        { path: 'comercial/industrias-objetivo.md',   label: 'Industrias Objetivo' },
        { path: 'comercial/planes-saas.md',           label: 'Planes SaaS' },
        { path: 'comercial/pitch-comercial.md',       label: 'Pitch Comercial' },
      ],
    },
    {
      id: 'presentaciones', label: 'Presentaciones', icon: 'fa-display',
      files: [
        { path: 'presentaciones/presentacion-ejecutiva.md',    label: 'Presentación Ejecutiva' },
        { path: 'presentaciones/defensa-academica.md',         label: 'Defensa Académica' },
        { path: 'presentaciones/investor-pitch.md',            label: 'Investor Pitch' },
        { path: 'presentaciones/presentacion-reclutadores.md', label: 'Para Reclutadores' },
      ],
    },
    {
      id: 'demo', label: 'Demos', icon: 'fa-play-circle',
      files: [
        { path: 'demo/demo-15-minutos.md', label: 'Demo 15 Minutos' },
        { path: 'demo/demo-ejecutiva.md',  label: 'Demo Ejecutiva' },
        { path: 'demo/demo-tecnica.md',    label: 'Demo Técnica' },
      ],
    },
    {
      id: 'portfolio', label: 'Portfolio', icon: 'fa-star',
      files: [
        { path: 'portfolio/presentacion-profesional.md', label: 'Presentación Profesional' },
        { path: 'portfolio/caso-estudio.md',             label: 'Caso de Estudio' },
        { path: 'portfolio/competencias-demostradas.md', label: 'Competencias Demostradas' },
        { path: 'portfolio/impacto-del-proyecto.md',     label: 'Impacto del Proyecto' },
        { path: 'portfolio/metricas-del-proyecto.md',    label: 'Métricas del Proyecto' },
        { path: 'portfolio/aprendizajes.md',             label: 'Aprendizajes' },
      ],
    },
    {
      id: 'code-audit', label: 'Auditoría de Código', icon: 'fa-code-branch',
      files: [
        { path: 'code-audit/dead-code.md',              label: 'Código Muerto' },
        { path: 'code-audit/refactor-opportunities.md', label: 'Oportunidades de Refactor' },
        { path: 'code-audit/unused-components.md',      label: 'Componentes No Usados' },
        { path: 'code-audit/unused-packages.md',        label: 'Paquetes No Usados' },
        { path: 'code-audit/unused-routes.md',          label: 'Rutas No Usadas' },
      ],
    },
    {
      id: 'doc-audit', label: 'Auditoría de Documentación', icon: 'fa-book-open',
      files: [
        { path: 'documentation-audit/01-existing-documentation.md', label: 'Documentación Existente' },
        { path: 'documentation-audit/02-missing-documentation.md',  label: 'Documentación Faltante' },
        { path: 'documentation-audit/03-duplicate-documentation.md',label: 'Documentación Duplicada' },
        { path: 'documentation-audit/04-outdated-documentation.md', label: 'Documentación Desactualizada' },
        { path: 'documentation-audit/05-documentation-roadmap.md',  label: 'Hoja de Ruta de Docs' },
      ],
    },
    {
      id: 'final-audit', label: 'Auditoría Final', icon: 'fa-clipboard-list',
      files: [
        { path: 'final-audit/00-resumen-ejecutivo.md',     label: 'Resumen Ejecutivo' },
        { path: 'final-audit/00_resumen_auditoria.md',     label: 'Resumen de Auditoría' },
        { path: 'final-audit/01-modulos-funcionales.md',   label: 'Módulos Funcionales' },
        { path: 'final-audit/02-reportes-y-analiticas.md', label: 'Reportes y Analíticas' },
        { path: 'final-audit/03-auditoria-mongodb.md',     label: 'Auditoría MongoDB' },
        { path: 'final-audit/04-auditoria-postgresql.md',  label: 'Auditoría PostgreSQL' },
        { path: 'final-audit/04_recomendaciones.md',       label: 'Recomendaciones' },
        { path: 'final-audit/05-auditoria-frontend.md',    label: 'Auditoría Frontend' },
        { path: 'final-audit/06-auditoria-backend.md',     label: 'Auditoría Backend' },
        { path: 'final-audit/07-codigo-muerto.md',         label: 'Código Muerto' },
        { path: 'final-audit/08-datos-simulados.md',       label: 'Datos Simulados' },
        { path: 'final-audit/09-prioridades-correccion.md',label: 'Prioridades de Corrección' },
        { path: 'final-audit/10-plan-produccion.md',       label: 'Plan de Producción' },
        { path: 'final-audit/puntuacion-final.md',         label: 'Puntuación Final' },
      ],
    },
    {
      id: 'final-doc-audit', label: 'Auditoría Doc. Final', icon: 'fa-file-circle-check',
      files: [
        { path: 'final-documentation-audit/01-documentation-coverage.md',  label: 'Cobertura de Documentación' },
        { path: 'final-documentation-audit/02-undocumented-components.md',  label: 'Componentes Sin Documentar' },
        { path: 'final-documentation-audit/03-outdated-documents.md',       label: 'Documentos Desactualizados' },
        { path: 'final-documentation-audit/04-duplicate-documents.md',      label: 'Documentos Duplicados' },
        { path: 'final-documentation-audit/05-final-documentation-plan.md', label: 'Plan Final de Documentación' },
      ],
    },
    {
      id: 'final-prod-audit', label: 'Auditoría de Producción', icon: 'fa-industry',
      files: [
        { path: 'final-production-audit/01-production-readiness.md', label: 'Preparación para Producción' },
        { path: 'final-production-audit/02-simulated-features.md',   label: 'Características Simuladas' },
        { path: 'final-production-audit/03-missing-features.md',     label: 'Características Faltantes' },
        { path: 'final-production-audit/04-priority-fixes.md',       label: 'Correcciones Prioritarias' },
        { path: 'final-production-audit/05-path-to-production.md',   label: 'Camino a Producción' },
      ],
    },
    {
      id: 'revisiones', label: 'Revisiones & Seguimiento', icon: 'fa-wrench',
      files: [
        { path: 'audits/production-fixes.md',          label: 'Correcciones de Producción' },
        { path: 'auditoria/auditoria-presentacion.md', label: 'Auditoría de Presentación' },
      ],
    },
    {
      id: 'diseno', label: 'Diseño & UX', icon: 'fa-palette',
      files: [
        { path: 'design-system/design-system-enterprise.md', label: 'Design System Enterprise' },
        { path: 'landing-page/redesign-completo.md',         label: 'Rediseño Completo' },
        { path: 'landing-page/auditoria-completa.md',        label: 'Auditoría Completa' },
        { path: 'landing-page/design-decisions.md',          label: 'Decisiones de Diseño' },
        { path: 'landing-page/mobile-optimization.md',       label: 'Optimización Mobile' },
        { path: 'landing-page/ux-improvements.md',           label: 'Mejoras UX' },
      ],
    },
    {
      id: 'roadmap', label: 'Hoja de Ruta & Localización', icon: 'fa-road',
      files: [
        { path: 'future-roadmap/hoja-ruta.md',       label: 'Hoja de Ruta Futura' },
        { path: 'localization/translation-audit.md', label: 'Auditoría de Traducción' },
      ],
    },
    ── FIN SECCIONES OCULTAS ──────────────────────────────────────────── */
  ];

  /* Total de documentos */
  const TOTAL = DOCS.reduce((s, c) => s + c.files.length, 0);

  // ============================================
  // ESTADO
  // ============================================
  const state = {
    currentDoc:   null,
    isDark:       localStorage.getItem(CONFIG.THEME_KEY) === 'dark',
    openSections: new Set(
      JSON.parse(localStorage.getItem(CONFIG.SECTIONS_KEY) || '["inicio"]')
    ),
  };

  // ============================================
  // DOM HELPERS
  // ============================================
  const $ = id => document.getElementById(id);

  function escA(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escH(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ============================================
  // GENERACIÓN DE SIDEBAR
  // ============================================
  function buildSidebar() {
    const nav = $('sidebarNav');
    if (!nav) return;

    nav.innerHTML = DOCS.map(sec => {
      const open = state.openSections.has(sec.id);
      const items = sec.files.map(f => `
        <li>
          <a href="#" class="nav-link" data-file="${escA(f.path)}"
             data-section="${escA(sec.id)}" title="${escA(f.label)}">
            ${escH(f.label)}
          </a>
        </li>`).join('');
      return `
        <div class="nav-section${open ? ' open' : ''}" id="sec-${sec.id}">
          <button class="nav-section-header" data-section="${escA(sec.id)}"
                  aria-expanded="${open}" type="button">
            <span class="nsh-icon"><i class="fas ${escA(sec.icon)}"></i></span>
            <span class="nsh-label">${escH(sec.label)}</span>
            <span class="nsh-badge">${sec.files.length}</span>
            <span class="nsh-chevron"><i class="fas fa-chevron-right"></i></span>
          </button>
          <ul class="nav-section-files" role="list">${items}</ul>
        </div>`;
    }).join('');

    /* Stats */
    const stats = $('sidebarStats');
    if (stats) stats.innerHTML = `${TOTAL} docs &middot; ${DOCS.length} secciones`;

    const fc = $('footerDocCount');
    if (fc) fc.textContent = TOTAL;

    /* Attach events */
    nav.querySelectorAll('.nav-link').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        const f = a.dataset.file;
        if (f) { loadDoc(f); closeMobile(); }
      })
    );
    nav.querySelectorAll('.nav-section-header').forEach(btn =>
      btn.addEventListener('click', () => toggleSection(btn.dataset.section))
    );
  }

  function toggleSection(id) {
    const el = $(`sec-${id}`);
    if (!el) return;
    const isOpen = el.classList.contains('open');
    el.classList.toggle('open', !isOpen);
    el.querySelector('.nav-section-header').setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) state.openSections.add(id);
    else state.openSections.delete(id);
    localStorage.setItem(CONFIG.SECTIONS_KEY, JSON.stringify([...state.openSections]));
  }

  function setActiveLink(path) {
    document.querySelectorAll('#sidebarNav .nav-link').forEach(a => {
      const isActive = a.dataset.file === path;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    /* Auto-expand the matching section */
    DOCS.forEach(sec => {
      if (sec.files.some(f => f.path === path) && !state.openSections.has(sec.id)) {
        state.openSections.add(sec.id);
        const el = $(`sec-${sec.id}`);
        if (el) {
          el.classList.add('open');
          el.querySelector('.nav-section-header').setAttribute('aria-expanded', 'true');
        }
        localStorage.setItem(CONFIG.SECTIONS_KEY, JSON.stringify([...state.openSections]));
      }
    });
  }

  // ============================================
  // BÚSQUEDA
  // ============================================
  let _searchTimer = null;

  function onSearch(q) {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => applyFilter(q.trim().toLowerCase()), CONFIG.SEARCH_DELAY);
  }

  function applyFilter(q) {
    let total = 0;
    document.querySelectorAll('#sidebarNav .nav-section').forEach(sec => {
      const links = sec.querySelectorAll('.nav-link');
      let visible = 0;
      links.forEach(a => {
        const match = !q || a.textContent.toLowerCase().includes(q)
                         || (a.dataset.file || '').toLowerCase().includes(q);
        a.closest('li').style.display = match ? '' : 'none';
        if (match) visible++;
      });
      sec.style.display = (!q || visible > 0) ? '' : 'none';
      if (q && visible > 0) sec.classList.add('open');
      total += visible;
    });
    /* No results */
    let nr = document.querySelector('#sidebarNav .no-results');
    if (!q || total > 0) {
      if (nr) nr.style.display = 'none';
    } else {
      if (!nr) {
        nr = document.createElement('p');
        nr.className = 'no-results';
        $('sidebarNav').appendChild(nr);
      }
      nr.textContent = `Sin resultados para "${q}"`;
      nr.style.display = '';
    }
    const clr = $('searchClear');
    if (clr) clr.style.display = q ? '' : 'none';
  }

  // ============================================
  // CARGA DE DOCUMENTOS
  // ============================================
  let _loadCtrl = null;

  async function loadDoc(path) {
    if (!path || path.startsWith('http')) return;
    if (path === state.currentDoc) return; // evitar recarga innecesaria

    /* Cancelar petición anterior si sigue en vuelo */
    if (_loadCtrl) _loadCtrl.abort();
    _loadCtrl = new AbortController();

    const area = $('contentArea');
    area.innerHTML = `<div class="loading-state">
      <i class="fas fa-spinner fa-pulse"></i><p>Cargando...</p></div>`;

    try {
      const res = await fetch(`${CONFIG.BASE_PATH}${path}`, {
        cache: 'default',
        signal: _loadCtrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

      const md = await res.text();
      area.innerHTML = marked.parse(md);

      addHeadingAnchors(area);
      await renderMermaid(area);
      addCopyBtns(area);
      interceptContentLinks(area);
      setActiveLink(path);
      updateBreadcrumb(path);
      updateTitle(path);

      localStorage.setItem(CONFIG.STORAGE_KEY, path);
      state.currentDoc = path;
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      if (err.name === 'AbortError') return; // ignorar petición cancelada
      console.error('loadDoc:', err);
      area.innerHTML = `
        <div class="error-state">
          <i class="fas fa-triangle-exclamation"></i>
          <h2>Error al cargar el documento</h2>
          <p>${escH(err.message)}</p>
          <p class="error-path">Archivo: <code>${escH(path)}</code></p>
          <p class="error-hint">
            <i class="fas fa-info-circle"></i>
            Abre este sitio desde un servidor web local
            (ej. <strong>Live Server</strong> en VS Code o
            <code>python -m http.server</code>).
          </p>
          <button class="error-btn" onclick="window.__loadDoc('${escA(CONFIG.DEFAULT_DOC)}')">
            <i class="fas fa-house"></i> Volver al Índice
          </button>
        </div>`;
    }
  }

  async function renderMermaid(container) {
    if (typeof mermaid === 'undefined') return;
    /* Convert <code class="language-mermaid"> to <div class="mermaid"> */
    container.querySelectorAll('code.language-mermaid').forEach(code => {
      const pre = code.closest('pre');
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      if (pre) pre.replaceWith(div);
    });
    const nodes = container.querySelectorAll('.mermaid');
    if (!nodes.length) return;
    try { await mermaid.run({ nodes }); }
    catch (e) { console.warn('Mermaid:', e); }
  }

  function addHeadingAnchors(container) {
    container.querySelectorAll('h1, h2, h3, h4').forEach(heading => {
      const id = heading.textContent
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!id) return;
      heading.id = id;
      const a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = `#${id}`;
      a.tabIndex = -1;
      a.setAttribute('aria-hidden', 'true');
      a.innerHTML = '<i class="fas fa-link"></i>';
      heading.appendChild(a);
    });
  }

  function addCopyBtns(container) {
    container.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = '<i class="fas fa-copy"></i>';
      btn.title = 'Copiar código';
      btn.setAttribute('aria-label', 'Copiar al portapapeles');
      btn.addEventListener('click', async () => {
        const text = pre.querySelector('code')?.textContent ?? pre.textContent;
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
        } catch (_) { /* Clipboard not available */ }
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }

  function interceptContentLinks(container) {
    /* Build a map of all known doc paths for fast lookup (also indexed by filename) */
    const allPaths = new Set(DOCS.flatMap(s => s.files.map(f => f.path)));

    container.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      if (!href.endsWith('.md')) return;

      /* Normalise: strip leading slash, "./", "../" chains and "docs-es/" */
      const normalised = href
        .replace(/^\/+/, '')
        .replace(/^(\.\.\/)+/, '')
        .replace(/^\.\//, '')
        .replace(/^docs-es\//, '');

      /* Only intercept if it resolves to a known doc path */
      if (allPaths.has(normalised)) {
        a.addEventListener('click', e => {
          e.preventDefault();
          loadDoc(normalised);
        });
      }
    });
  }

  // ============================================
  // BREADCRUMB & TITLE
  // ============================================
  function updateBreadcrumb(path) {
    const bc = $('breadcrumb');
    if (!bc) return;
    let cat = null, fileLabel = path.split('/').pop().replace('.md','').replace(/-/g,' ');
    DOCS.forEach(s => {
      const f = s.files.find(f => f.path === path);
      if (f) { cat = s.label; fileLabel = f.label; }
    });
    bc.innerHTML = cat
      ? `<span><i class="fas fa-house"></i> Inicio</span>
         <span class="bc-sep"><i class="fas fa-chevron-right"></i></span>
         <span>${escH(cat)}</span>
         <span class="bc-sep"><i class="fas fa-chevron-right"></i></span>
         <span class="bc-current">${escH(fileLabel)}</span>`
      : `<span><i class="fas fa-house"></i> Inicio</span>
         <span class="bc-sep"><i class="fas fa-chevron-right"></i></span>
         <span class="bc-current">${escH(fileLabel)}</span>`;
  }

  function updateTitle(path) {
    let label = path.split('/').pop().replace('.md','').replace(/-/g,' ');
    DOCS.forEach(s => { const f = s.files.find(f => f.path === path); if (f) label = f.label; });
    document.title = `RobenGate Sentinel — ${label}`;
  }

  // ============================================
  // TEMA OSCURO / CLARO
  // ============================================
  function toggleTheme() {
    state.isDark = !state.isDark;
    applyTheme(state.isDark);
    localStorage.setItem(CONFIG.THEME_KEY, state.isDark ? 'dark' : 'light');
    if (typeof updateMermaidTheme === 'function')
      updateMermaidTheme(state.isDark ? 'dark' : 'light');
  }

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    const btn = $('themeToggle');
    if (btn) btn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  // ============================================
  // SIDEBAR MOBILE
  // ============================================
  function openSidebar()  {
    $('sidebar').classList.add('open');
    $('sidebarOverlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }
  function closeMobile()  { if (window.innerWidth <= 1024) closeSidebar(); }

  // ============================================
  // SCROLL TO TOP
  // ============================================
  function onScroll() {
    $('scrollTop')?.classList.toggle('visible', window.scrollY > 400);
  }

  // ============================================
  // EVENTOS
  // ============================================
  function attachEvents() {
    $('menuToggle')?.addEventListener('click', () =>
      $('sidebar').classList.contains('open') ? closeSidebar() : openSidebar());
    $('sidebarClose')?.addEventListener('click', closeSidebar);
    $('sidebarOverlay')?.addEventListener('click', closeSidebar);
    $('themeToggle')?.addEventListener('click', toggleTheme);
    $('searchInput')?.addEventListener('input', e => onSearch(e.target.value));
    $('searchClear')?.addEventListener('click', () => {
      const inp = $('searchInput');
      if (inp) inp.value = '';
      applyFilter('');
      inp?.focus();
    });
    $('scrollTop')?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    window.addEventListener('scroll', onScroll, { passive: true });

    document.addEventListener('keydown', e => {
      /* Ctrl+Shift+D → toggle sidebar */
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        $('sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
      }
      /* Esc → close sidebar on mobile */
      if (e.key === 'Escape' && window.innerWidth <= 1024) closeSidebar();
      /* Ctrl+K → focus search */
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const inp = $('searchInput');
        inp?.focus(); inp?.select();
      }
    });

    const fy = $('footerYear');
    if (fy) fy.textContent = new Date().getFullYear();
  }

  // ============================================
  // MARKED.JS — CONFIGURACIÓN ÚNICA
  // ============================================
  function initMarked() {
    marked.use({ gfm: true, breaks: false, pedantic: false });
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  function init() {
    applyTheme(state.isDark);
    buildSidebar();
    initMarked(); // configurar marked.js una sola vez

    const clr = $('searchClear');
    if (clr) clr.style.display = 'none';

    attachEvents();

    const last = localStorage.getItem(CONFIG.STORAGE_KEY) || CONFIG.DEFAULT_DOC;
    loadDoc(last);

    /* Exponer globalmente para botones de error */
    window.__loadDoc = loadDoc;

    console.group('🛡️ RobenGate Sentinel Docs');
    console.log(`📄 Documentos: ${TOTAL} en ${DOCS.length} secciones`);
    console.log(`🎨 Tema: ${state.isDark ? 'oscuro' : 'claro'}`);
    console.log('⌨️  Ctrl+Shift+D · Ctrl+K · Esc');
    console.groupEnd();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();

})();