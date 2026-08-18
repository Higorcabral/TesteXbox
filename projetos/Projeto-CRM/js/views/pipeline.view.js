/* =========================================================
   Rubra CRM — View: Funil de vendas (etapas + gráfico)
   ========================================================= */

(function (global) {
  'use strict';

  function renderStage(s) {
    return `
      <div class="stage">
        <div class="stage-label">${s.label}</div>
        <div class="stage-value">${s.value}</div>
        <div class="stage-count">${s.count}</div>
        <div class="bar" style="width:${s.width}%"></div>
      </div>`;
  }

  const PipelineView = {
    render(root, pipeline) {
      const stages = pipeline.stages.map(renderStage).join('');
      const { revenue, target } = pipeline.chart;

      root.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Funil de vendas</h3>
            <div class="sub">${pipeline.subtitle}</div>
          </div>
          <div class="tabs">
            <button>Semana</button>
            <button class="active">Mês</button>
            <button>Trimestre</button>
          </div>
        </div>
        <div class="card-body">
          <div class="pipeline">${stages}</div>

          <div class="chart-wrap">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none">
              <g stroke="var(--border)" stroke-width="1">
                <line x1="0" y1="40"  x2="600" y2="40"/>
                <line x1="0" y1="90"  x2="600" y2="90"/>
                <line x1="0" y1="140" x2="600" y2="140"/>
                <line x1="0" y1="190" x2="600" y2="190"/>
              </g>
              <defs>
                <linearGradient id="rubraGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.32"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,150 L50,130 L100,140 L150,110 L200,120 L250,95 L300,100 L350,75 L400,85 L450,60 L500,70 L550,45 L600,55 L600,220 L0,220 Z" fill="url(#rubraGrad)"/>
              <polyline points="${revenue}"
                        fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="${target}"
                        fill="none" stroke="var(--text-dim)" stroke-width="1.5" stroke-dasharray="4 4" stroke-linecap="round"/>
              <circle cx="600" cy="55" r="4" fill="var(--accent)"/>
              <circle cx="600" cy="55" r="7" fill="var(--accent)" opacity="0.2"/>
            </svg>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background:var(--accent)"></span> Receita realizada</span>
            <span><span class="legend-dot" style="background:var(--text-dim)"></span> Meta</span>
          </div>
        </div>
      `;
    }
  };

  global.CRM.PipelineView = PipelineView;
})(window);
