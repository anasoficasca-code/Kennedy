/**
 * RAPOT · Aplicación Principal, Enrutador SPA y Sintetizador de Audio (app.js)
 * - Enrutamiento SPA con la View Transitions API moderna del navegador
 * - Sintetizador Web Audio API libre de dependencias (micro-efectos hápticos procedurales)
 * - Renderizado dinámico de las 6 citas verbatim del POT y filtrado por estructura
 * - Módulos del ecosistema de investigación
 * - Radar Chart dinámico y cálculo emergente para el "Modelo Propio de Ciudad"
 */

(function () {
  'use strict';

  /* ============================================================
   * 1. SINTETIZADOR WEB AUDIO API PROCEDURAL (CERO ARCHIVOS EXTERNOS)
   * ============================================================ */
  let audioCtx = null;
  let audioEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const soundFX = {
    click: () => {
      if (!audioEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.035);
      } catch (e) {}
    },
    chime: () => {
      if (!audioEnabled || !audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        [528, 792].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0.04, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.3);
        });
      } catch (e) {}
    },
    swoosh: () => {
      if (!audioEnabled || !audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } catch (e) {}
    }
  };

  window.soundFX = soundFX;

  // Botón para alternar audio en cabecera
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;
      btnAudioToggle.classList.toggle('active', audioEnabled);
      btnAudioToggle.innerHTML = audioEnabled
        ? '<i class="fa-solid fa-volume-high"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>';
      if (audioEnabled) soundFX.chime();
    });
  }

  /* ============================================================
   * 2. ENRUTADOR SPA CON NATIVE VIEW TRANSITIONS API
   * ============================================================ */
  const VIEW_IDS = ['inicio', 'relaciones', 'kennedy', 'modulos', 'modelo-propio'];
  const navLinks = document.querySelectorAll('.nav-link, a[data-view]');

  function navigateTo(targetView, skipSound) {
    if (!VIEW_IDS.includes(targetView)) targetView = 'inicio';

    // Función que realiza el cambio físico en el DOM
    const updateDOM = () => {
      VIEW_IDS.forEach((id) => {
        const panel = document.getElementById(`view-${id}`);
        if (panel) {
          panel.classList.toggle('active', id === targetView);
        }
      });

      // Actualizar enlaces de navegación activos
      navLinks.forEach((link) => {
        const viewAttr = link.dataset.view;
        const hrefAttr = (link.getAttribute('href') || '').replace('#', '');
        const isMatch = viewAttr === targetView || hrefAttr === targetView;
        if (link.classList.contains('nav-link')) {
          link.classList.toggle('active', isMatch);
        }
      });

      // Scroll fluido hacia la parte superior del contenedor
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Si se navega a inicio, asegurar resize correcto de la esfera
      if (targetView === 'inicio' && window.rapotOrb) {
        setTimeout(window.rapotOrb.resize, 80);
      }
    };

    // Usar la View Transitions API nativa del navegador si está soportada
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        updateDOM();
      });
    } else {
      updateDOM();
    }

    if (!skipSound) soundFX.swoosh();
  }

  // Interceptar clicks de enlaces de navegación interna
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-view], a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const viewId = href.replace('#', '');
      if (VIEW_IDS.includes(viewId)) {
        e.preventDefault();
        if (window.location.hash !== href) {
          history.pushState(null, '', href);
        }
        navigateTo(viewId);
      }
    }
  });

  window.addEventListener('popstate', () => {
    const hash = (window.location.hash || '#inicio').replace('#', '');
    navigateTo(hash, true);
  });

  /* ============================================================
   * 3. RELACIONES DEL POT: 6 CITAS VERBATIM Y FILTRADO ACTIVO
   * ============================================================ */
  const STRUCTURE_META = {
    eep: { name: 'Estructura Ecológica Principal', short: 'EEP', color: '#4fdccc' },
    efc: { name: 'Estructura Funcional y del Cuidado', short: 'EFC', color: '#a9e6ff' },
    eseci: { name: 'Estructura Socioeconómica, Creativa y de Innovación', short: 'ESECI', color: '#f2dcaa' },
    eip: { name: 'Estructura Integradora de Patrimonios', short: 'EIP', color: '#f1b9ff' }
  };

  const POT_RELATIONS = [
    {
      id: 1,
      from: 'eep',
      to: 'eseci',
      page: 'Página 31',
      title: 'Conservación ambiental como motor productivo',
      quote: '[…] la conservación del ambiente como formas de productividad, sustento y desarrollo sostenible.',
      critique: 'El POT supedita la salud del ecosistema a su capacidad de rentabilidad económica.'
    },
    {
      id: 2,
      from: 'eip',
      to: 'eep',
      page: 'Página 31',
      title: 'Patrimonio local y bancos de semillas',
      quote: 'Por eso promovemos la ciudad a que reconozca el patrimonio local, las dinámicas comunitarias, los sistemas cooperativos de producción sostenible como huertas productivas, bancos de semillas nativas y plantas de uso medicinal, entre otros.',
      critique: 'Reconoce el saber ancestral y comunitario como soporte de la biodiversidad.'
    },
    {
      id: 3,
      from: 'efc',
      to: 'eep',
      page: 'Página 31',
      title: 'Equipamientos rurales y turismo responsable',
      quote: 'En la ruralidad es urgente mejorar las condiciones habitacionales, desde los componentes de servicios públicos domiciliarios, accesibilidad y movilidad, con equipamientos que faciliten la economía campesina, familiar y comunitaria, el turismo responsable de naturaleza que vincule residentes y saberes del lugar y la conservación del ambiente como formas de productividad, sustento y desarrollo sostenible.',
      critique: 'Articula la dotación de servicios básicos con la protección de la reserva natural.'
    },
    {
      id: 4,
      from: 'efc',
      to: 'eseci',
      page: 'Página 126',
      title: 'Infraestructura social compatible y multifuncional',
      quote: 'Bajo la nueva visión del POT, la infraestructura social es compatible con otros usos y equipamientos, como centros deportivos, culturales y de recreación, entre otros. Esto propicia infraestructuras compartidas y multifuncionales que contribuyen a la interculturalidad, que estimulan la permanencia de los estudiantes en el sistema educativo y que promueven la generación de conocimiento.',
      critique: 'Habilita la multifuncionalidad del suelo pero delega el cuidado a la iniciativa privada.'
    },
    {
      id: 5,
      from: 'eip',
      to: 'efc',
      page: 'Página 30',
      title: 'Protección de pobladores originales',
      quote: 'El POT busca intervenir estratégicamente, vinculando las dinámicas patrimoniales, ambientales, sociales y culturales para proteger y garantizar la permanencia y calidad de vida de los pobladores originales de las zonas de renovación urbana y actuaciones estratégicas.',
      critique: 'Promesa normativa contra la gentrificación que raramente se cumple en obra pública.'
    },
    {
      id: 6,
      from: 'eip',
      to: 'eseci',
      page: 'Página 35',
      title: 'Patrimonio comunitario e innovación económica',
      quote: 'El mismo planteamiento vincula patrimonio local, dinámicas comunitarias y producción sostenible, permitiendo analizar su relación con la dimensión socioeconómica.',
      critique: 'Conecta la cultura de barrio con la economía popular y mercados solidarios.'
    }
  ];

  const relsGrid = document.getElementById('relsGrid');
  const relFilterChips = document.querySelectorAll('.filter-chip');

  function renderRelations(filterKey = 'all') {
    if (!relsGrid) return;

    const filtered = POT_RELATIONS.filter((r) => {
      if (filterKey === 'all') return true;
      return r.from === filterKey || r.to === filterKey;
    });

    relsGrid.innerHTML = filtered.map((r) => {
      const sFrom = STRUCTURE_META[r.from];
      const sTo = STRUCTURE_META[r.to];

      return `
        <article class="rel-card" data-from="${r.from}" data-to="${r.to}">
          <div class="rel-connector">
            <span class="rel-badge" style="border-color:${sFrom.color}; color:${sFrom.color}">
              <span class="rel-dot" style="background:${sFrom.color}"></span>
              ${sFrom.short}
            </span>
            <div class="rel-arrow-track">
              <i class="fa-solid fa-arrow-right rel-arrow-icon"></i>
            </div>
            <span class="rel-badge" style="border-color:${sTo.color}; color:${sTo.color}">
              <span class="rel-dot" style="background:${sTo.color}"></span>
              ${sTo.short}
            </span>
          </div>
          <h4>${r.title}</h4>
          <blockquote class="rel-quote">&ldquo;${r.quote}&rdquo;</blockquote>
          <div class="rel-footer">
            <span class="rel-citation"><i class="fa-solid fa-book-bookmark"></i> POT Decreto 555 · ${r.page}</span>
            <span class="rel-tag">Cita Verbatim</span>
          </div>
        </article>
      `;
    }).join('');
  }

  relFilterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.relFilter;
      relFilterChips.forEach((c) => c.classList.toggle('active', c === chip));
      renderRelations(filter);
      soundFX.click();
    });
  });

  renderRelations('all');

  /* ============================================================
   * 4. MÓDULOS DE INVESTIGACIÓN DEL ECOSISTEMA RAPOT
   * ============================================================ */
  const MODULE_CATEGORIES = [
    {
      group: '1. Leer el POT',
      intro: 'Qué dice el plan, cómo se mide matemáticamente y qué desequilibrios deja por fuera.',
      items: [
        { code: '02', title: 'Una ciudad que no cabe en el POT', desc: '¿Es suficiente el POT como único modelo oficial? Lectura cuantitativa de su mirada reduccionista.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-02.html' },
        { code: '03', title: 'Discurso vs. Realidad', desc: 'Simulación e indicadores: qué ocurre con la estabilidad urbana si desconectamos una estructura completa.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-03.html' },
        { code: '04', title: 'Macromodelos del POT', desc: 'Los modelos necesarios para capturar flujos, dinámicas temporales y metabolismo urbano.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-04.html' }
      ]
    },
    {
      group: '2. Explorar el Territorio',
      intro: 'Del conjunto metropolitano de la Sabana a la UPL y sus compromisos ambientales globales.',
      items: [
        { code: 'MET', title: 'Escala Metropolitana', desc: 'Bogotá completa y sus 22 municipios vecinos, ubicando a Kennedy en la conurbación.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-metropolitano.html' },
        { code: '05', title: 'Navegador Multiescalar', desc: 'Exploración territorial en cuatro dimensiones normativas sobre la UPL 13, Tintal.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-05.html' },
        { code: '06', title: 'POT y Objetivos ODS', desc: 'Cómo las relaciones del POT favorecen, limitan o colisionan con los ODS de Naciones Unidas.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-06.html' }
      ]
    },
    {
      group: '3. Simulación y Caso Kennedy',
      intro: 'La ciudad entendida como un sistema adaptativo complejo y no como zonificación estática.',
      items: [
        { code: '07', title: 'Bogotá como Sistema Complejo', desc: 'De qué componentes interactuantes emerge el fenómeno de la metrópoli viva.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-07.html' },
        { code: '08', title: 'Contaminación Acústica en Fauna', desc: 'Modelo empírico de ruido vial y su impacto en la fragmentación de aves en humedales.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-08.html' },
        { code: 'KEN', title: 'Problemáticas de Corabastos', desc: 'Kennedy frente a los macromodelos: sobrecarga logística y capacidad de soporte del suelo.', url: 'https://anasoficasca-code.github.io/modelamiento2/problemas.html#modulo-12-problemas.html' },
        { code: 'CAU', title: 'Red Causal de Residuos', desc: 'El colapso metabólico de 75 toneladas diarias de materia orgánica en descomposición.', url: 'https://anasoficasca-code.github.io/modelamiento2/problemas.html#red-residuos-organicos.html' }
      ]
    },
    {
      group: '4. Propuesta Regenerativa',
      intro: 'Una formulación alternativa propia tras deconstruir los sesgos del plan.',
      items: [
        { code: '09', title: 'Modelo Propio de Ciudad', desc: 'La ciudad como sistema de cuidado mutuo: arquitectura relacional simétrica y autorregulada.', url: 'https://anasoficasca-code.github.io/modelamiento2/modulo-09.html' }
      ]
    }
  ];

  const modGroupsContainer = document.getElementById('modGroups');
  if (modGroupsContainer) {
    modGroupsContainer.innerHTML = MODULE_CATEGORIES.map((cat) => {
      return `
        <div class="mod-category-block">
          <div class="mod-cat-header">
            <h3>${cat.group}</h3>
            <p>${cat.intro}</p>
          </div>
          <div class="mod-cards-grid">
            ${cat.items.map((m) => `
              <a href="${m.url}" target="_blank" rel="noopener" class="mod-card">
                <span class="mod-code">${m.code}</span>
                <div class="mod-info">
                  <h4>${m.title}</h4>
                  <p>${m.desc}</p>
                </div>
                <div class="mod-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ============================================================
   * 5. MODELO PROPIO: RADAR CHART Y EQUILIBRIO SISTÉMICO
   * ============================================================ */
  const radarCanvas = document.getElementById('propioRadar');
  const radarCtx = radarCanvas ? radarCanvas.getContext('2d') : null;

  const rangeEep = document.getElementById('rangeEep');
  const rangeEfc = document.getElementById('rangeEfc');
  const rangeEseci = document.getElementById('rangeEseci');
  const rangeEip = document.getElementById('rangeEip');

  const valEep = document.getElementById('valEep');
  const valEfc = document.getElementById('valEfc');
  const valEseci = document.getElementById('valEseci');
  const valEip = document.getElementById('valEip');

  const kpiResiliencia = document.getElementById('kpiResiliencia');
  const kpiEquidad = document.getElementById('kpiEquidad');
  const kpiConectividad = document.getElementById('kpiConectividad');
  const btnEquilibrar = document.getElementById('btnEquilibrar');

  const RADAR_AXES = [
    { label: 'Ecológica', color: '#4fdccc', getVal: () => parseInt(rangeEep?.value || 75, 10) },
    { label: 'Cuidado y Salud', color: '#a9e6ff', getVal: () => parseInt(rangeEfc?.value || 85, 10) },
    { label: 'Economía Circular', color: '#f2dcaa', getVal: () => parseInt(rangeEseci?.value || 60, 10) },
    { label: 'Patrimonio Comunitario', color: '#f1b9ff', getVal: () => parseInt(rangeEip?.value || 70, 10) }
  ];

  function drawRadarChart() {
    if (!radarCtx || !radarCanvas) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.min(w, h) * 0.38;

    radarCtx.clearRect(0, 0, w, h);

    // Rejillas poligonales concéntricas
    const levels = 4;
    for (let l = 1; l <= levels; l++) {
      const r = (maxR / levels) * l;
      radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      radarCtx.lineWidth = 1;
      radarCtx.beginPath();
      for (let i = 0; i < RADAR_AXES.length; i++) {
        const ang = (Math.PI * 2 / RADAR_AXES.length) * i - Math.PI / 2;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        if (i === 0) radarCtx.moveTo(x, y);
        else radarCtx.lineTo(x, y);
      }
      radarCtx.closePath();
      radarCtx.stroke();
    }

    // Ejes radiales y etiquetas
    RADAR_AXES.forEach((axis, i) => {
      const ang = (Math.PI * 2 / RADAR_AXES.length) * i - Math.PI / 2;
      const xEnd = cx + Math.cos(ang) * maxR;
      const yEnd = cy + Math.sin(ang) * maxR;

      radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      radarCtx.beginPath();
      radarCtx.moveTo(cx, cy);
      radarCtx.lineTo(xEnd, yEnd);
      radarCtx.stroke();

      // Rótulos exteriores
      const labelDist = maxR + 24;
      const lx = cx + Math.cos(ang) * labelDist;
      const ly = cy + Math.sin(ang) * labelDist;

      radarCtx.fillStyle = axis.color;
      radarCtx.font = '600 12px Geist, sans-serif';
      radarCtx.textAlign = 'center';
      radarCtx.textBaseline = 'middle';
      radarCtx.fillText(axis.label, lx, ly);
    });

    // Polígono de datos del sistema
    radarCtx.beginPath();
    const points = [];
    RADAR_AXES.forEach((axis, i) => {
      const val = axis.getVal();
      const norm = val / 100;
      const ang = (Math.PI * 2 / RADAR_AXES.length) * i - Math.PI / 2;
      const px = cx + Math.cos(ang) * maxR * norm;
      const py = cy + Math.sin(ang) * maxR * norm;
      points.push({ x: px, y: py, color: axis.color });
      if (i === 0) radarCtx.moveTo(px, py);
      else radarCtx.lineTo(px, py);
    });
    radarCtx.closePath();

    // Relleno degradado aurora en radar
    radarCtx.fillStyle = 'rgba(79, 220, 204, 0.28)';
    radarCtx.fill();
    radarCtx.strokeStyle = '#4fdccc';
    radarCtx.lineWidth = 2.5;
    radarCtx.stroke();

    // Vértices iluminados
    points.forEach((pt) => {
      radarCtx.fillStyle = pt.color;
      radarCtx.beginPath();
      radarCtx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      radarCtx.fill();
      radarCtx.strokeStyle = '#ffffff';
      radarCtx.lineWidth = 1.5;
      radarCtx.stroke();
    });
  }

  function updateModelMetrics() {
    const eep = parseInt(rangeEep?.value || 75, 10);
    const efc = parseInt(rangeEfc?.value || 85, 10);
    const eseci = parseInt(rangeEseci?.value || 60, 10);
    const eip = parseInt(rangeEip?.value || 70, 10);

    if (valEep) valEep.textContent = `${eep}%`;
    if (valEfc) valEfc.textContent = `${efc}%`;
    if (valEseci) valEseci.textContent = `${eseci}%`;
    if (valEip) valEip.textContent = `${eip}%`;

    // Fórmulas emergentes de resiliencia y equidad territorial
    const resiliencia = Math.round(eep * 0.52 + efc * 0.22 + eip * 0.16 + eseci * 0.1);
    const equidad = Math.round(efc * 0.44 + eip * 0.36 + eep * 0.2);
    const conectividad = Math.round(eseci * 0.38 + efc * 0.42 + eep * 0.2);

    if (kpiResiliencia) kpiResiliencia.textContent = `${resiliencia}%`;
    if (kpiEquidad) kpiEquidad.textContent = `${equidad}%`;
    if (kpiConectividad) kpiConectividad.textContent = `${conectividad}%`;

    drawRadarChart();
  }

  [rangeEep, rangeEfc, rangeEseci, rangeEip].forEach((slider) => {
    if (slider) {
      slider.addEventListener('input', () => {
        updateModelMetrics();
      });
    }
  });

  // Animación del botón "Equilibrar automáticamente"
  if (btnEquilibrar) {
    btnEquilibrar.addEventListener('click', () => {
      const targets = { eep: 88, efc: 92, eseci: 76, eip: 84 };
      let step = 0;
      const stepsTotal = 24;

      const start = {
        eep: parseInt(rangeEep.value, 10),
        efc: parseInt(rangeEfc.value, 10),
        eseci: parseInt(rangeEseci.value, 10),
        eip: parseInt(rangeEip.value, 10)
      };

      const animInterval = setInterval(() => {
        step++;
        const progress = step / stepsTotal;
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        rangeEep.value = Math.round(start.eep + (targets.eep - start.eep) * ease);
        rangeEfc.value = Math.round(start.efc + (targets.efc - start.efc) * ease);
        rangeEseci.value = Math.round(start.eseci + (targets.eseci - start.eseci) * ease);
        rangeEip.value = Math.round(start.eip + (targets.eip - start.eip) * ease);

        updateModelMetrics();

        if (step >= stepsTotal) {
          clearInterval(animInterval);
          soundFX.chime();
        }
      }, 20);
    });
  }

  updateModelMetrics();

  // Inicialización de la vista según el hash de URL actual
  const initialHash = (window.location.hash || '#inicio').replace('#', '');
  navigateTo(initialHash, true);
})();
