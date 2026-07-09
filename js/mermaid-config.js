/**
 * ============================================
 * ROBENGATE SENTINEL — MERMAID CONFIG v2.0
 * ============================================
 * Configuración global de Mermaid.js
 * Colores corporativos RobenGate Sentinel
 * ============================================
 */

(function () {
  'use strict';

  /* Paleta corporativa RobenGate */
  const C = {
    primary:      '#0A1929',
    primaryLight: '#0F2A4A',
    accent:       '#00B4D8',
    accentHover:  '#00D4FF',
    white:        '#FFFFFF',
    grayLight:    '#B0BEC5',
    gray:         '#64748B',
    bgCard:       '#F8FAFC',
    border:       '#E2E8F0',
    font:         "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  /* ---- Tema CLARO ---- */
  const LIGHT = {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor:         C.primaryLight,
      primaryBorderColor:   C.accent,
      primaryTextColor:     C.primary,
      lineColor:            C.accent,
      secondaryColor:       C.bgCard,
      tertiaryColor:        C.bgCard,
      fontFamily:           C.font,
      nodeBorder:           C.accent,
      nodeTextColor:        C.primary,
      clusterBkg:           C.bgCard,
      clusterBorder:        C.border,
      titleColor:           C.primary,
      edgeLabelBackground:  C.white,
      actorBorder:          C.accent,
      actorBkg:             C.primaryLight,
      actorTextColor:       C.white,
      actorLineColor:       C.accent,
      signalColor:          C.primary,
      noteBorderColor:      C.accent,
      noteBkgColor:         '#FFFDE7',
      noteTextColor:        C.primary,
      taskBorderColor:      C.accent,
      taskBkgColor:         C.primaryLight,
      taskTextColor:        C.white,
      gridColor:            C.border,
      fillType0: C.primaryLight, fillType1: '#0D3352',
      fillType2: '#0F3D63',      fillType3: '#1B4F72',
      fillType4: C.bgCard,       fillType5: '#E8F4F8',
      fillType6: '#D1ECF1',      fillType7: '#BEE3F8',
    },
    securityLevel: 'loose',
    flowchart:    { useMaxWidth: true, htmlLabels: true, curve: 'basis', diagramPadding: 16 },
    sequence:     { useMaxWidth: true, showSequenceNumbers: false, diagramMarginX: 50 },
    gantt:        { useMaxWidth: true, barHeight: 24, barGap: 6 },
    journey:      { useMaxWidth: true },
    timeline:     { useMaxWidth: true },
    er:           { useMaxWidth: true, diagramPadding: 20 },
    pie:          { useMaxWidth: true },
  };

  /* ---- Tema OSCURO ---- */
  const DARK = {
    ...LIGHT,
    theme: 'dark',
    themeVariables: {
      ...LIGHT.themeVariables,
      primaryColor:         '#1A2A4A',
      primaryBorderColor:   C.accent,
      primaryTextColor:     '#E2E8F0',
      lineColor:            C.accent,
      secondaryColor:       '#1E293B',
      tertiaryColor:        '#0F172A',
      fontFamily:           C.font,
      nodeBorder:           C.accent,
      nodeTextColor:        '#E2E8F0',
      clusterBkg:           '#1E293B',
      clusterBorder:        '#2A3A5C',
      titleColor:           C.accentHover,
      edgeLabelBackground:  '#141B2D',
      actorBkg:             '#1A2A4A',
      actorTextColor:       '#E2E8F0',
      signalColor:          '#E2E8F0',
      noteBkgColor:         '#1E293B',
      noteTextColor:        '#E2E8F0',
      taskBkgColor:         '#1A2A4A',
      taskTextColor:        '#E2E8F0',
      gridColor:            '#2A3A5C',
    },
  };

  /* Guardar configuraciones globalmente */
  window.__MERMAID_CONFIGS = { light: LIGHT, dark: DARK };

  /**
   * Inicializa Mermaid con el tema indicado.
   * @param {'light'|'dark'} theme
   */
  function initMermaid(theme) {
    if (typeof mermaid === 'undefined') {
      console.warn('⚠️ Mermaid no está disponible');
      return;
    }
    mermaid.initialize(theme === 'dark' ? DARK : LIGHT);
    console.log(`📊 Mermaid inicializado (tema: ${theme})`);
  }

  /**
   * Re-renderiza todos los diagramas con el nuevo tema.
   * @param {'light'|'dark'} theme
   */
  async function updateMermaidTheme(theme) {
    if (typeof mermaid === 'undefined') return;
    initMermaid(theme);
    const nodes = document.querySelectorAll('.mermaid[data-processed]');
    nodes.forEach(n => {
      n.removeAttribute('data-processed');
      const svg = n.querySelector('svg');
      if (svg) svg.remove();
    });
    if (nodes.length) {
      try { await mermaid.run({ nodes }); }
      catch (e) { console.warn('Mermaid re-render:', e); }
    }
  }

  /* Exponer funciones al scope global */
  window.initMermaid        = initMermaid;
  window.updateMermaidTheme = updateMermaidTheme;

  /* Auto-inicializar con el tema guardado */
  const savedTheme = localStorage.getItem('robengate_theme') || 'light';
  initMermaid(savedTheme);

})();