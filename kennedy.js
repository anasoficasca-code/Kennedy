/**
 * RAPOT · Simuladores del Territorio Kennedy (kennedy.js)
 * 1. Visualizador dinámico de flujos logísticos de Corabastos (Canvas 2D multi-agente)
 * 2. Simulación bioacústica: Ruido vehicular vs. Fauna en Humedales El Burro y La Vaca
 * 3. Red Causal Dinámica: Bucles de realimentación sistémica en el territorio
 */

(function () {
  'use strict';

  /* ============================================================
   * 1. SIMULADOR CORABASTOS: FLUJOS LOGÍSTICOS Y SATURACIÓN
   * ============================================================ */
  const cCanvas = document.getElementById('corabastosCanvas');
  let cCtx = cCanvas ? cCanvas.getContext('2d') : null;
  let cWidth = 800, cHeight = 480;

  // Parámetros por turno
  const SHIFT_PROFILES = {
    madrugada: {
      truckCount: 65,
      speed: 1.8,
      saturation: 94,
      satLabel: '94% (Pico Crítico)',
      satColor: 'fill-danger',
      waste: '78 Ton/día',
      wastePct: '88%',
      desc: 'Ingreso masivo de tractomulas desde los Llanos, Boyacá y Cundinamarca.'
    },
    manana: {
      truckCount: 45,
      speed: 1.2,
      saturation: 78,
      satLabel: '78% (Alta congestión)',
      satColor: 'fill-warn',
      waste: '62 Ton/día',
      wastePct: '72%',
      desc: 'Distribución minorista, furgones medianos y compras de tenderos de la ciudad.'
    },
    tarde: {
      truckCount: 28,
      speed: 0.9,
      saturation: 60,
      satLabel: '60% (Salida de residuos)',
      satColor: 'fill-warn',
      waste: '45 Ton/día',
      wastePct: '55%',
      desc: 'Operación de limpieza, descargue secundario y evacuación de basuras orgánicas.'
    }
  };

  let currentShift = 'madrugada';
  let cVehicles = [];

  // Red de rutas de Corabastos y avenidas adyacentes
  const CORABASTOS_NODES = {
    nw: [180, 110], // Av. Américas con Cali
    ne: [620, 110], // Av. Américas oriental
    sw: [180, 390], // Av. Cali con Tintal
    se: [620, 390], // Villavicencio sur
    p1: [320, 210], // Puerta 1 (Principal pesados)
    p2: [480, 210], // Puerta 2 (Comercial)
    p6: [320, 310], // Puerta 6 (Frutas y verduras)
    p7: [480, 310], // Puerta 7 (Salida residuos)
    center: [400, 260] // Centro de acopio
  };

  const CORABASTOS_PATHS = [
    // Entrada norte por Av. Américas hacia Puerta 1
    [CORABASTOS_NODES.nw, [320, 110], CORABASTOS_NODES.p1, CORABASTOS_NODES.center],
    // Entrada oriente por Av. Américas hacia Puerta 2
    [CORABASTOS_NODES.ne, [480, 110], CORABASTOS_NODES.p2, CORABASTOS_NODES.center],
    // Entrada sur por Av. Cali hacia Puerta 6
    [CORABASTOS_NODES.sw, [320, 390], CORABASTOS_NODES.p6, CORABASTOS_NODES.center],
    // Salida desde el centro hacia Puerta 7 y Villavicencio
    [CORABASTOS_NODES.center, CORABASTOS_NODES.p7, [480, 390], CORABASTOS_NODES.se],
    // Bucle perimetral de saturación externa (Av. Cali y Américas)
    [CORABASTOS_NODES.nw, CORABASTOS_NODES.sw, [620, 390], CORABASTOS_NODES.ne, CORABASTOS_NODES.nw]
  ];

  class Vehicle {
    constructor() {
      this.reset();
    }
    reset() {
      this.pathIndex = Math.floor(Math.random() * CORABASTOS_PATHS.length);
      this.path = CORABASTOS_PATHS[this.pathIndex];
      this.segment = 0;
      this.progress = Math.random();
      this.type = Math.random() > 0.45 ? 'heavy' : 'light';
      this.color = this.type === 'heavy' ? '#f2dcaa' : '#a9e6ff';
      this.size = this.type === 'heavy' ? 4.5 : 3.0;
      this.speed = (0.003 + Math.random() * 0.004) * SHIFT_PROFILES[currentShift].speed;
    }
    update() {
      this.progress += this.speed;
      if (this.progress >= 1) {
        this.progress = 0;
        this.segment++;
        if (this.segment >= this.path.length - 1) {
          this.reset();
        }
      }
    }
    draw(ctx) {
      if (!this.path[this.segment] || !this.path[this.segment + 1]) return;
      const pA = this.path[this.segment];
      const pB = this.path[this.segment + 1];
      const x = pA[0] + (pB[0] - pA[0]) * this.progress;
      const y = pA[1] + (pB[1] - pA[1]) * this.progress;

      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.type === 'heavy' ? 8 : 4;
      ctx.beginPath();
      ctx.arc(x, y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function initCorabastos() {
    if (!cCanvas) return;
    cWidth = cCanvas.width;
    cHeight = cCanvas.height;
    cVehicles = [];
    const count = SHIFT_PROFILES[currentShift].truckCount;
    for (let i = 0; i < count; i++) {
      cVehicles.push(new Vehicle());
    }
  }

  function renderCorabastos() {
    if (!cCtx) return;
    cCtx.clearRect(0, 0, cWidth, cHeight);

    // Fondo oscuro con rejilla sutil de ordenamiento
    cCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    cCtx.lineWidth = 1;
    for (let x = 0; x < cWidth; x += 40) {
      cCtx.beginPath();
      cCtx.moveTo(x, 0);
      cCtx.lineTo(x, cHeight);
      cCtx.stroke();
    }
    for (let y = 0; y < cHeight; y += 40) {
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.lineTo(cWidth, y);
      cCtx.stroke();
    }

    // Dibujar polígono del gran mercado Corabastos
    cCtx.save();
    cCtx.fillStyle = 'rgba(242, 220, 170, 0.07)';
    cCtx.strokeStyle = 'rgba(242, 220, 170, 0.4)';
    cCtx.lineWidth = 1.5;
    cCtx.setLineDash([5, 5]);
    cCtx.beginPath();
    cCtx.rect(280, 180, 240, 160);
    cCtx.fill();
    cCtx.stroke();
    cCtx.setLineDash([]);

    // Rótulo de Corabastos
    cCtx.fillStyle = '#f2dcaa';
    cCtx.font = '600 13px Geist, sans-serif';
    cCtx.fillText('POLÍGONO CORABASTOS (42 Ha)', 300, 205);
    cCtx.font = '400 11px Geist, sans-serif';
    cCtx.fillStyle = 'rgba(242, 220, 170, 0.7)';
    cCtx.fillText('Plataformas · 57 Bodegas · Residuos', 300, 222);

    // Dibujar vías perimetrales
    cCtx.strokeStyle = 'rgba(169, 230, 255, 0.25)';
    cCtx.lineWidth = 3;
    // Av. Américas (Norte)
    cCtx.beginPath();
    cCtx.moveTo(100, 110);
    cCtx.lineTo(700, 110);
    cCtx.stroke();
    // Av. Cali (Occidente)
    cCtx.beginPath();
    cCtx.moveTo(180, 50);
    cCtx.lineTo(180, 430);
    cCtx.stroke();
    // Vía Tintal / Villavicencio (Sur)
    cCtx.beginPath();
    cCtx.moveTo(100, 390);
    cCtx.lineTo(700, 390);
    cCtx.stroke();

    // Rótulos de avenidas
    cCtx.fillStyle = 'rgba(169, 230, 255, 0.6)';
    cCtx.font = '500 11px Geist, sans-serif';
    cCtx.fillText('Av. de las Américas', 110, 100);
    cCtx.fillText('Av. Ciudad de Cali', 190, 70);
    cCtx.fillText('Eje Tintal - Av. Villavicencio', 110, 410);

    // Dibujar puertas de acceso
    const gates = [
      { name: 'P1: Pesados', x: 320, y: 180 },
      { name: 'P2: Minoristas', x: 480, y: 180 },
      { name: 'P6: Frutas', x: 320, y: 340 },
      { name: 'P7: Residuos', x: 480, y: 340 }
    ];
    gates.forEach((g) => {
      cCtx.fillStyle = '#ff7b72';
      cCtx.beginPath();
      cCtx.arc(g.x, g.y, 4, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.fillStyle = '#ffffff';
      cCtx.font = '400 10px Geist, sans-serif';
      cCtx.fillText(g.name, g.x - 25, g.y > 250 ? g.y + 16 : g.y - 8);
    });

    cCtx.restore();

    // Actualizar y dibujar vehículos
    cVehicles.forEach((v) => {
      v.update();
      v.draw(cCtx);
    });

    requestAnimationFrame(renderCorabastos);
  }

  // Cambio de turnos de Corabastos
  const shiftBtns = document.querySelectorAll('.c-time-btn');
  const metricSat = document.getElementById('metricSat');
  const fillSat = document.getElementById('fillSat');
  const metricRes = document.getElementById('metricRes');
  const fillRes = document.getElementById('fillRes');

  shiftBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const shift = btn.dataset.shift;
      if (!SHIFT_PROFILES[shift]) return;
      currentShift = shift;

      shiftBtns.forEach((b) => b.classList.toggle('active', b === btn));
      const p = SHIFT_PROFILES[shift];

      if (metricSat) metricSat.textContent = p.satLabel;
      if (fillSat) {
        fillSat.style.width = `${p.saturation}%`;
        fillSat.className = `meter-fill ${p.satColor}`;
      }
      if (metricRes) metricRes.textContent = p.waste;
      if (fillRes) fillRes.style.width = p.wastePct;

      initCorabastos();
      if (window.soundFX) window.soundFX.click();
    });
  });

  initCorabastos();
  requestAnimationFrame(renderCorabastos);

  /* ============================================================
   * 2. SIMULADOR BIOACÚSTICO: RUIDO VEHICULAR VS. FAUNA
   * ============================================================ */
  const aCanvas = document.getElementById('acusticaCanvas');
  const aCtx = aCanvas ? aCanvas.getContext('2d') : null;
  const noiseSlider = document.getElementById('noiseSlider');
  const noiseVal = document.getElementById('noiseVal');
  const faunaStress = document.getElementById('faunaStress');
  const fillStress = document.getElementById('fillStress');
  const faunaIndex = document.getElementById('faunaIndex');
  const fillIndex = document.getElementById('fillIndex');

  let currentDecibels = noiseSlider ? parseInt(noiseSlider.value, 10) : 78;
  let waveOffset = 0;

  // Aves y fauna simulada en los humedales
  const FAUNA = [
    // Humedal El Burro (Norte)
    { name: 'Tingua Bogotana', type: 'ave', home: [220, 120], x: 220, y: 120, tolerance: 62 },
    { name: 'Tingua Bogotana', type: 'ave', home: [300, 100], x: 300, y: 100, tolerance: 64 },
    { name: 'Monjita Bogotana', type: 'ave', home: [160, 150], x: 160, y: 150, tolerance: 58 },
    { name: 'Garza Real', type: 'ave', home: [260, 135], x: 260, y: 135, tolerance: 68 },
    { name: 'Curí Sabanero', type: 'mamifero', home: [190, 80], x: 190, y: 80, tolerance: 70 },

    // Humedal La Vaca (Sur)
    { name: 'Tingua Pico Rojo', type: 'ave', home: [580, 360], x: 580, y: 360, tolerance: 65 },
    { name: 'Tingua Bogotana', type: 'ave', home: [640, 380], x: 640, y: 380, tolerance: 62 },
    { name: 'Pato Turrio', type: 'ave', home: [520, 390], x: 520, y: 390, tolerance: 60 },
    { name: 'Rana Sabanera', type: 'anfibio', home: [610, 420], x: 610, y: 420, tolerance: 55 }
  ];

  function updateAcousticMetrics() {
    if (noiseVal) noiseVal.textContent = `${currentDecibels} dB`;

    // Cálculo dinámico de estrés e índice de permanencia
    // 50 dB es óptimo para humedal; >75 dB es crítico
    const stressPct = Math.min(100, Math.max(10, Math.round(((currentDecibels - 45) / 50) * 100)));
    const birdStay = Math.max(8, Math.min(95, Math.round(100 - stressPct * 0.88)));

    if (faunaStress) {
      if (currentDecibels < 55) {
        faunaStress.textContent = 'Bajo (Confort Ecológico)';
        if (fillStress) fillStress.className = 'meter-fill fill-good';
      } else if (currentDecibels < 72) {
        faunaStress.textContent = 'Moderado (Perturbación)';
        if (fillStress) fillStress.className = 'meter-fill fill-warn';
      } else {
        faunaStress.textContent = 'Crítico (Desplazamiento)';
        if (fillStress) fillStress.className = 'meter-fill fill-danger';
      }
    }

    if (fillStress) fillStress.style.width = `${stressPct}%`;
    if (faunaIndex) faunaIndex.textContent = `${birdStay}%`;
    if (fillIndex) {
      fillIndex.style.width = `${birdStay}%`;
      fillIndex.className = birdStay > 60 ? 'meter-fill fill-good' : (birdStay > 30 ? 'meter-fill fill-warn' : 'meter-fill fill-danger');
    }
  }

  function renderAcustica() {
    if (!aCtx) return;
    const w = aCanvas.width;
    const h = aCanvas.height;

    aCtx.clearRect(0, 0, w, h);
    waveOffset += 0.8;

    // 1. Dibujar Humedal El Burro (Sector Noroccidental)
    aCtx.save();
    aCtx.fillStyle = 'rgba(79, 220, 204, 0.12)';
    aCtx.strokeStyle = '#4fdccc';
    aCtx.lineWidth = 1.5;
    aCtx.beginPath();
    aCtx.ellipse(240, 120, 140, 75, -0.15, 0, Math.PI * 2);
    aCtx.fill();
    aCtx.stroke();

    aCtx.fillStyle = '#4fdccc';
    aCtx.font = '600 13px Geist, sans-serif';
    aCtx.fillText('HUMEDAL EL BURRO', 170, 70);
    aCtx.font = '400 11px Geist, sans-serif';
    aCtx.fillStyle = 'rgba(79, 220, 204, 0.7)';
    aCtx.fillText('Reserva Distrital de Humedal (19.4 Ha)', 170, 88);

    // 2. Dibujar Humedal La Vaca (Sector Suroriental)
    aCtx.fillStyle = 'rgba(79, 220, 204, 0.12)';
    aCtx.strokeStyle = '#4fdccc';
    aCtx.beginPath();
    aCtx.ellipse(590, 380, 130, 65, 0.2, 0, Math.PI * 2);
    aCtx.fill();
    aCtx.stroke();

    aCtx.fillStyle = '#4fdccc';
    aCtx.font = '600 13px Geist, sans-serif';
    aCtx.fillText('HUMEDAL LA VACA', 520, 335);
    aCtx.font = '400 11px Geist, sans-serif';
    aCtx.fillStyle = 'rgba(79, 220, 204, 0.7)';
    aCtx.fillText('Sector Sur recuperado comunitariamente', 520, 352);

    // 3. Dibujar la Avenida Ciudad de Cali que atraviesa y fractura el ecosistema
    const roadX1 = 440, roadY1 = 0;
    const roadX2 = 360, roadY2 = h;

    aCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    aCtx.lineWidth = 26;
    aCtx.beginPath();
    aCtx.moveTo(roadX1, roadY1);
    aCtx.lineTo(roadX2, roadY2);
    aCtx.stroke();

    // Línea central de la avenida
    aCtx.strokeStyle = '#f2dcaa';
    aCtx.lineWidth = 2;
    aCtx.setLineDash([8, 8]);
    aCtx.beginPath();
    aCtx.moveTo(roadX1, roadY1);
    aCtx.lineTo(roadX2, roadY2);
    aCtx.stroke();
    cCtx && aCtx.setLineDash([]);

    aCtx.fillStyle = '#ffffff';
    aCtx.font = '600 12px Geist, sans-serif';
    aCtx.fillText('AV. CIUDAD DE CALI (Tráfico vehicular continuo)', 260, 240);
    aCtx.restore();

    // 4. Ondas acústicas que se propagan desde la avenida hacia los humedales
    const waveIntensity = (currentDecibels - 45) / 50; // 0 a 1
    const waveCount = 5;
    const waveRadius = 380;

    aCtx.save();
    for (let i = 0; i < waveCount; i++) {
      const dist = ((waveOffset * 1.5 + i * 55) % waveRadius);
      const alpha = Math.max(0, (1 - dist / waveRadius) * waveIntensity * 0.45);

      const waveColor = currentDecibels > 75 ? `rgba(255, 123, 114, ${alpha})` : `rgba(242, 220, 170, ${alpha})`;
      aCtx.strokeStyle = waveColor;
      aCtx.lineWidth = 2 + waveIntensity * 3;

      // Ondas hacia el humedal El Burro (izquierda)
      aCtx.beginPath();
      aCtx.arc(400, 240, dist, Math.PI * 0.65, Math.PI * 1.35);
      aCtx.stroke();

      // Ondas hacia el humedal La Vaca (derecha)
      aCtx.beginPath();
      aCtx.arc(400, 240, dist, -Math.PI * 0.35, Math.PI * 0.35);
      aCtx.stroke();
    }
    aCtx.restore();

    // 5. Comportamiento y desplazamiento de la fauna
    FAUNA.forEach((animal) => {
      const isStressed = currentDecibels > animal.tolerance;
      const fleeFactor = Math.max(0, (currentDecibels - animal.tolerance) / 30);

      // Si está estresado, se desplaza hacia la orilla más alejada de la avenida
      const targetX = isStressed
        ? (animal.home[0] < 400 ? animal.home[0] - fleeFactor * 50 : animal.home[0] + fleeFactor * 50)
        : animal.home[0] + Math.sin(waveOffset * 0.05 + animal.home[1]) * 4;

      const targetY = animal.home[1] + Math.cos(waveOffset * 0.04 + animal.home[0]) * 3;

      animal.x += (targetX - animal.x) * 0.08;
      animal.y += (targetY - animal.y) * 0.08;

      // Dibujar especie
      aCtx.save();
      const dotColor = isStressed ? '#ff7b72' : '#4fdccc';
      aCtx.fillStyle = dotColor;
      aCtx.shadowColor = dotColor;
      aCtx.shadowBlur = isStressed ? 8 : 4;
      aCtx.beginPath();
      aCtx.arc(animal.x, animal.y, isStressed ? 3.5 : 4.5, 0, Math.PI * 2);
      aCtx.fill();

      // Etiqueta del ave o mamífero
      aCtx.fillStyle = isStressed ? 'rgba(255, 123, 114, 0.85)' : 'rgba(237, 255, 254, 0.85)';
      aCtx.font = '500 10px Geist, sans-serif';
      aCtx.fillText(animal.name, animal.x + 8, animal.y + 3);
      aCtx.restore();
    });

    requestAnimationFrame(renderAcustica);
  }

  if (noiseSlider) {
    noiseSlider.addEventListener('input', (e) => {
      currentDecibels = parseInt(e.target.value, 10);
      updateAcousticMetrics();
    });
  }

  updateAcousticMetrics();
  requestAnimationFrame(renderAcustica);

  /* ============================================================
   * 3. RED CAUSAL DINÁMICA DE KENNEDY (BUCLES SISTÉMICOS)
   * ============================================================ */
  const CAUSAL_NODES = [
    {
      id: 'abastecimiento',
      title: 'Hipercentralización en Corabastos',
      icon: 'fa-truck-ramp-box',
      category: 'Economía (ESECI)',
      color: '#f2dcaa',
      metric: '12.000 camiones / día',
      causes: ['congestion', 'residuos'],
      desc: 'El 80% de la comida de Bogotá ingresa por un solo punto no planificado para ese volumen metropolitano.'
    },
    {
      id: 'congestion',
      title: 'Colapso de Malla Vial y Ruido',
      icon: 'fa-traffic-light',
      category: 'Cuidado y Movilidad (EFC)',
      color: '#a9e6ff',
      metric: '85 dB en Av. Cali y Américas',
      causes: ['humedales', 'segregacion'],
      desc: 'El tráfico de carga pesada destroza la malla barrial y levanta un muro acústico permanente.'
    },
    {
      id: 'residuos',
      title: 'Sobrecarga Metabólica de Residuos',
      icon: 'fa-trash-can',
      category: 'Metabolismo Urbano',
      color: '#ff9a76',
      metric: '75 Toneladas / día',
      causes: ['humedales', 'segregacion'],
      desc: 'Residuos orgánicos sin aprovechamiento in situ generan lixiviados y vectores en el espacio público circundante.'
    },
    {
      id: 'humedales',
      title: 'Fragmentación de Humedales El Burro y La Vaca',
      icon: 'fa-feather',
      category: 'Ecológica (EEP)',
      color: '#4fdccc',
      metric: '68% pérdida de conectividad',
      causes: ['vulnerabilidad'],
      desc: 'La barrera acústica y física corta los corredores biológicos hacia el Río Bogotá y desplaza especies nativas.'
    },
    {
      id: 'segregacion',
      title: 'Déficit de Cuidado y Calidad de Vida',
      icon: 'fa-people-roof',
      category: 'Cuidado (EFC)',
      color: '#a9e6ff',
      metric: '1.2M habitantes con escasez de espacio verde',
      causes: ['vulnerabilidad'],
      desc: 'El tiempo de traslado y la contaminación enferman a los cuidadores y desintegran el tejido comunitario.'
    },
    {
      id: 'vulnerabilidad',
      title: 'Vulnerabilidad Climática Sistémica',
      icon: 'fa-cloud-showers-water',
      category: 'Resiliencia Territorial',
      color: '#f1b9ff',
      metric: 'Riesgo alto de inundación Tintal',
      causes: ['abastecimiento'], // Cierra el bucle de realimentación R1
      desc: 'Cuando el suelo pierde su capacidad de absorción y los humedales mueren, las lluvias anegan la central y las vías.'
    }
  ];

  const causalBoard = document.getElementById('causalBoard');

  function renderCausalNetwork() {
    if (!causalBoard) return;

    causalBoard.innerHTML = CAUSAL_NODES.map((node) => {
      return `
        <div class="causal-node-card" id="cnode-${node.id}" data-id="${node.id}">
          <div class="cnode-header">
            <span class="cnode-badge" style="background:${node.color}22; color:${node.color}">
              <i class="fa-solid ${node.icon}"></i> ${node.category}
            </span>
            <span class="cnode-metric">${node.metric}</span>
          </div>
          <h4>${node.title}</h4>
          <p>${node.desc}</p>
          <div class="cnode-footer">
            <span class="cnode-impacts">Impacta a: <strong>${node.causes.map((c) => {
              const target = CAUSAL_NODES.find((n) => n.id === c);
              return target ? target.title.split(' ')[0] : c;
            }).join(', ')}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    // Interacción al pasar cursor: resaltar enlaces y bucles
    const cards = causalBoard.querySelectorAll('.causal-node-card');
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        const id = card.dataset.id;
        const node = CAUSAL_NODES.find((n) => n.id === id);
        if (!node) return;

        cards.forEach((c) => {
          const cId = c.dataset.id;
          const isDirect = cId === id;
          const isCaused = node.causes.includes(cId);
          if (isDirect) {
            c.classList.add('focused-active');
            c.classList.remove('dimmed');
          } else if (isCaused) {
            c.classList.add('focused-target');
            c.classList.remove('dimmed');
          } else {
            c.classList.add('dimmed');
            c.classList.remove('focused-active', 'focused-target');
          }
        });
      });

      card.addEventListener('mouseleave', () => {
        cards.forEach((c) => {
          c.classList.remove('focused-active', 'focused-target', 'dimmed');
        });
      });
    });
  }

  renderCausalNetwork();

  // Control de pestañas del caso Kennedy
  const ktabs = document.querySelectorAll('.ktab');
  const kpanels = document.querySelectorAll('.kpanel');

  ktabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.ktab;
      ktabs.forEach((t) => t.classList.toggle('active', t === tab));
      kpanels.forEach((p) => p.classList.toggle('active', p.id === `kpanel-${target}`));
      if (window.soundFX) window.soundFX.chime();
    });
  });

  // Exponer API para sincronización
  window.kennedySim = {
    setShift: (s) => {
      const btn = document.querySelector(`.c-time-btn[data-shift="${s}"]`);
      if (btn) btn.click();
    },
    setDecibels: (db) => {
      if (noiseSlider) {
        noiseSlider.value = db;
        currentDecibels = db;
        updateAcousticMetrics();
      }
    }
  };
})();
