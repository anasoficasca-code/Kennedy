/**
 * RAPOT · Motor de la Esfera 3D Interactiva (orb.js)
 * Visualización matemática con distribución Fibonacci, proyección en perspectiva 3D,
 * rotación por arrastre con inercia, morphing entre 4 estados y tooltips de componentes.
 */

(function () {
  'use strict';

  // Datos oficiales del POT de Bogotá (Decreto 555 de 2021)
  const STRUCTURES = {
    eep: {
      name: 'Estructura Ecológica Principal',
      short: 'EEP',
      color: '#4fdccc',
      rgb: [79, 220, 204],
      nodes: [
        'Corredores montañosos',
        'Cerros Orientales',
        'Ríos y Rondas',
        'Quebradas',
        'Áreas protegidas',
        'Bosques urbanos',
        'Áreas de resiliencia climática',
        'Humedales del Distrito',
        'Parques ecológicos de montaña',
        'Complejos de páramos',
        'Coberturas vegetales',
        'Parques de borde',
        'Reservas forestales',
        'Paisajes sostenibles'
      ]
    },
    efc: {
      name: 'Estructura Funcional y del Cuidado',
      short: 'EFC',
      color: '#a9e6ff',
      rgb: [169, 230, 255],
      nodes: [
        'Servicios de cuidado',
        'Equipamientos de proximidad',
        'Servicios públicos domiciliarios',
        'Red de Ciclorrutas',
        'Servicios sociales básicos',
        'Sistema de transporte público',
        'Parques y espacio público',
        'Red vial arterial e intermedia',
        'Manzanas del Cuidado',
        'Corredores verdes y alamedas'
      ]
    },
    eseci: {
      name: 'Estructura Socioeconómica, Creativa y de Innovación',
      short: 'ESECI',
      color: '#f2dcaa',
      rgb: [242, 220, 170],
      nodes: [
        'Distrito Centro Tecnológico',
        'Centros de abastecimiento (Corabastos)',
        'Servicios empresariales e intensivos',
        'Plazas de mercado tradicionales',
        'Zonas industriales y logísticas',
        'Sistema de educación y formación',
        'Zonas de interés turístico',
        'Centros financieros metropolitanos',
        'Producción artesanal y popular'
      ]
    },
    eip: {
      name: 'Estructura Integradora de Patrimonios',
      short: 'EIP',
      color: '#f1b9ff',
      rgb: [241, 185, 255],
      nodes: [
        'Sistema de sitios sagrados',
        'Patrimonio arqueológico',
        'Patrimonio cultural inmaterial',
        'Patrimonio material inmueble',
        'Patrimonio natural y paisajístico'
      ]
    }
  };

  const KEYS = ['eep', 'efc', 'eseci', 'eip'];

  const RELATIONS = [
    { from: 'eep', to: 'eseci' },
    { from: 'eip', to: 'eep' },
    { from: 'efc', to: 'eep' },
    { from: 'efc', to: 'eseci' },
    { from: 'eip', to: 'efc' },
    { from: 'eip', to: 'eseci' }
  ];

  const PHASE_INFO = [
    {
      badge: 'Fase 0 de 3',
      title: 'Bogotá integrada como un solo sistema',
      desc: 'Gira la esfera 3D arrastrando con el cursor o el dedo. Los 38 componentes reconocidos por el POT conviven en una esfera densa e interactiva.'
    },
    {
      badge: 'Fase 1 de 3',
      title: 'Descomposición en cuatro estructuras',
      desc: 'El POT divide el territorio en cuatro silos normativos: Ecológica, Cuidado, Socioeconómica y Patrimonios. Cada componente viaja a su grupo.'
    },
    {
      badge: 'Fase 2 de 3',
      title: 'Seis relaciones oficiales declaradas',
      desc: 'El POT sólo declara 6 relaciones explícitas entre las 4 estructuras. Observa los haces de luz que conectan los centros normativos.'
    },
    {
      badge: 'Fase 3 de 3',
      title: 'Priorización y desequilibrios reales',
      desc: 'El tamaño de cada estructura refleja la cantidad de componentes que le asigna el POT. La ecología y el cuidado concentran el volumen, pero la economía centraliza los beneficios.'
    }
  ];

  // Elementos DOM
  const canvas = document.getElementById('orbCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('orbTooltip');
  const tipName = document.getElementById('tipName');
  const tipStruct = document.getElementById('tipStruct');
  const stepBadge = document.getElementById('stepBadge');
  const stepTitle = document.getElementById('stepTitle');
  const stepDesc = document.getElementById('stepDesc');
  const orbLegend = document.getElementById('orbLegend');
  const phaseBtns = document.querySelectorAll('.phase-btn');
  const btnNextPhase = document.getElementById('btnNextPhase');

  // Estado del motor
  let width = 0;
  let height = 0;
  let dpr = 1;
  let cx = 0;
  let cy = 0;
  let scaleBase = 1;
  let currentPhase = 0;
  let t0 = performance.now();
  let linkAlpha = 0;
  let labelAlpha = 0;
  let activeFilter = null;

  // Interacción 3D (arrastre con mouse o touch + inercia suave)
  let rotX = -0.25;
  let rotY = 0.4;
  let targetRotX = -0.25;
  let targetRotY = 0.4;
  let velX = 0;
  let velY = 0.002;
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let mouse = { x: -10000, y: -10000 };
  let hoverParticle = null;

  // Generación de partículas: 38 componentes reales + partículas de polvo ambiental
  const PARTICLES = [];
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  function fibonacciSphere(i, n) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    return [Math.cos(theta) * r, y, Math.sin(theta) * r];
  }

  KEYS.forEach((k) => {
    // Componentes reales
    STRUCTURES[k].nodes.forEach((label) => {
      PARTICLES.push({
        k: k,
        real: true,
        label: label,
        radius: 3.8
      });
    });

    // Polvo ambiental decorativo proporcional
    const dustCount = STRUCTURES[k].nodes.length * 28;
    for (let i = 0; i < dustCount; i++) {
      PARTICLES.push({
        k: k,
        real: false,
        label: '',
        radius: 0.7 + Math.random() * 1.1
      });
    }
  });

  // Mezclar orden para que las estructuras queden intercaladas en la esfera
  const globalOrder = PARTICLES.map((_, i) => i);
  for (let i = globalOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [globalOrder[i], globalOrder[j]] = [globalOrder[j], globalOrder[i]];
  }

  // Orden y conteo por grupo para estado 1, 2 y 3
  const groupN = {};
  const groupIdx = { eep: 0, efc: 0, eseci: 0, eip: 0 };
  const groupOrder = {};

  KEYS.forEach((k) => {
    groupN[k] = PARTICLES.filter((p) => p.k === k).length;
    const o = [];
    for (let i = 0; i < groupN[k]; i++) o.push(i);
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [o[i], o[j]] = [o[j], o[i]];
    }
    groupOrder[k] = o;
  });

  PARTICLES.forEach((p, i) => {
    p.sph = fibonacciSphere(globalOrder[i], PARTICLES.length);
    p.loc = fibonacciSphere(groupOrder[p.k][groupIdx[p.k]++], groupN[p.k]);
    p.jitter = 0.88 + Math.random() * 0.24;
    p.pos = [p.sph[0] * 0.2, p.sph[1] * 0.2, p.sph[2] * 0.2];
    p.screenX = 0;
    p.screenY = 0;
    p.depth = 0;
  });

  // Centros de las 4 estructuras en el espacio descompuesto (disposición en rombo armónico)
  const CENTERS = {
    eep: [0, -0.65, 0],
    eip: [-0.75, 0, 0],
    efc: [0.75, 0, 0],
    eseci: [0, 0.65, 0]
  };

  function getGroupRadius(k, phase) {
    if (phase === 3) {
      return 0.36 * Math.sqrt(STRUCTURES[k].nodes.length / 14);
    }
    return 0.25;
  }

  // Operaciones de rotación vectorial 3D
  function rotateY(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  }

  function rotateX(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  }

  function project(v) {
    const cameraDist = 3.4;
    const factor = cameraDist / (cameraDist - v[2]);
    return [cx + v[0] * scaleBase * factor, cy + v[1] * scaleBase * factor, factor];
  }

  function getTarget(p, phase) {
    if (phase === 0) {
      const v = rotateX(rotateY(p.sph, rotY), rotX);
      return [v[0] * p.jitter, v[1] * p.jitter, v[2] * p.jitter];
    }
    const r = getGroupRadius(p.k, phase);
    const c = CENTERS[p.k];
    const l = rotateX(rotateY(p.loc, rotY * 1.3), rotX);
    return [c[0] + l[0] * r * p.jitter, c[1] + l[1] * r * p.jitter, l[2] * r * p.jitter];
  }

  // Curvas de bezier para relaciones entre estructuras
  function getCurve(a, b) {
    const pa = project(CENTERS[a]);
    const pb = project(CENTERS[b]);
    const mx = (pa[0] + pb[0]) / 2;
    const my = (pa[1] + pb[1]) / 2;
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = len * 0.18;
    return {
      ax: pa[0],
      ay: pa[1],
      bx: pb[0],
      by: pb[1],
      qx: mx + nx * bend,
      qy: my + ny * bend,
      len: len
    };
  }

  function getQuadPoint(c, t) {
    const u = 1 - t;
    return [
      u * u * c.ax + 2 * u * t * c.qx + t * t * c.bx,
      u * u * c.ay + 2 * u * t * c.qy + t * t * c.by
    ];
  }

  // Redimensionar canvas de forma adaptativa
  function handleResize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    scaleBase = Math.min(width, height) * 0.38;
    cx = width * 0.5;
    cy = height * 0.5;
  }

  window.addEventListener('resize', handleResize);
  // Llamada diferida para garantizar dimensiones correctas del layout
  setTimeout(handleResize, 50);

  // Render Loop principal
  function render(timestamp) {
    const t = (timestamp - t0) / 1000;

    // Inercia y rotación automática suave cuando no se arrastra
    if (!isDragging) {
      velY = 0.0018;
      targetRotY += velY;
    }
    rotX += (targetRotX - rotX) * 0.08;
    rotY += (targetRotY - rotY) * 0.08;

    // Animación suave de transparencias de capas
    linkAlpha += ((currentPhase >= 2 ? 1 : 0) - linkAlpha) * 0.07;
    labelAlpha += ((currentPhase >= 1 ? 1 : 0) - labelAlpha) * 0.07;

    ctx.clearRect(0, 0, width, height);

    // Halo de profundidad atmosférico sutil
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, scaleBase * 1.55);
    halo.addColorStop(0, 'rgba(79, 220, 204, 0.12)');
    halo.addColorStop(0.5, 'rgba(18, 27, 43, 0.06)');
    halo.addColorStop(1, 'rgba(5, 7, 12, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    // Dibujar enlaces entre estructuras en fase 2 y 3
    if (linkAlpha > 0.02) {
      RELATIONS.forEach((rel, i) => {
        const c = getCurve(rel.from, rel.to);
        const ra = getGroupRadius(rel.from, currentPhase) * scaleBase * 1.05;
        const rb = getGroupRadius(rel.to, currentPhase) * scaleBase * 1.12;
        const t1 = Math.min(0.42, ra / c.len);
        const t2 = 1 - Math.min(0.42, rb / c.len);

        ctx.save();
        ctx.globalAlpha = linkAlpha * 0.65;
        ctx.strokeStyle = '#edfffe';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -t * 22;

        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const q = getQuadPoint(c, t1 + (t2 - t1) * (s / 24));
          if (s === 0) ctx.moveTo(q[0], q[1]);
          else ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Flecha direccional
        const pEnd = getQuadPoint(c, t2);
        const pBefore = getQuadPoint(c, t2 - 0.02);
        const angle = Math.atan2(pEnd[1] - pBefore[1], pEnd[0] - pBefore[0]);

        ctx.globalAlpha = linkAlpha * 0.9;
        ctx.fillStyle = '#edfffe';
        ctx.translate(pEnd[0], pEnd[1]);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-9, -4);
        ctx.lineTo(-9, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Fotón viajante por el haz de relación
        const photonPhase = (t * 0.4 + i / 6) % 1;
        const photonPt = getQuadPoint(c, t1 + (t2 - t1) * photonPhase);
        ctx.save();
        ctx.globalAlpha = linkAlpha * Math.sin(photonPhase * Math.PI) * 0.9;
        ctx.fillStyle = '#fde9ff';
        ctx.shadowColor = '#4fdccc';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(photonPt[0], photonPt[1], 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Calcular posición 3D de todas las partículas e interpolar suavemente
    const drawn = [];
    const ease = 0.065;
    for (let i = 0; i < PARTICLES.length; i++) {
      const p = PARTICLES[i];
      const target = getTarget(p, currentPhase);
      p.pos[0] += (target[0] - p.pos[0]) * ease;
      p.pos[1] += (target[1] - p.pos[1]) * ease;
      p.pos[2] += (target[2] - p.pos[2]) * ease;

      const proj = project(p.pos);
      p.screenX = proj[0];
      p.screenY = proj[1];
      p.depth = p.pos[2];
      drawn.push(p);
    }

    // Ordenar partículas por profundidad (Z-buffer del fondo al frente)
    drawn.sort((a, b) => a.depth - b.depth);

    // Detección de hover en los componentes reales
    hoverParticle = null;
    let closestDistSq = 18 * 18;

    for (let i = 0; i < drawn.length; i++) {
      const p = drawn[i];
      const struct = STRUCTURES[p.k];
      const rgb = struct.rgb;
      const depthFactor = (p.depth + 1.2) / 2.4; // 0 al fondo, 1 al frente
      const isFiltered = activeFilter && activeFilter !== p.k;

      let alpha = p.real ? 0.35 + depthFactor * 0.65 : 0.08 + depthFactor * 0.45;
      if (isFiltered) alpha *= 0.15;

      const size = p.radius * (0.65 + depthFactor * 0.7);

      if (p.real && !isFiltered) {
        const dx = p.screenX - mouse.x;
        const dy = p.screenY - mouse.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < closestDistSq && depthFactor > 0.3) {
          closestDistSq = dSq;
          hoverParticle = p;
        }

        // Halo suave en nodos reales
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Indicador y tooltip cuando se sobrevuela un nodo
    if (hoverParticle) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#4fdccc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(hoverParticle.screenX, hoverParticle.screenY, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (tooltip) {
        tooltip.style.left = `${hoverParticle.screenX}px`;
        tooltip.style.top = `${hoverParticle.screenY}px`;
        tipName.textContent = hoverParticle.label;
        tipStruct.textContent = STRUCTURES[hoverParticle.k].name;
        tipStruct.style.color = STRUCTURES[hoverParticle.k].color;
        tooltip.classList.add('visible');
      }
      canvas.style.cursor = 'pointer';
    } else {
      if (tooltip) tooltip.classList.remove('visible');
      canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    }

    // Etiquetas y conteos de estructura flotantes en fases 1, 2 y 3
    if (labelAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = labelAlpha;
      ctx.textAlign = 'center';

      KEYS.forEach((k) => {
        const pc = project(CENTERS[k]);
        const r = getGroupRadius(k, currentPhase) * scaleBase;
        const isEep = k === 'eep';
        const lx = isEep ? pc[0] + r + 24 : pc[0];
        const ly = isEep ? pc[1] - 4 : pc[1] + r + 26;

        ctx.textAlign = isEep ? 'left' : 'center';
        ctx.fillStyle = STRUCTURES[k].color;
        ctx.font = '600 13px Geist, sans-serif';
        ctx.fillText(STRUCTURES[k].short, lx, ly);

        if (currentPhase === 3) {
          const fontSize = Math.round(Math.max(20, r * 0.36));
          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${fontSize}px Space Grotesk, sans-serif`;
          ctx.fillText(String(STRUCTURES[k].nodes.length), lx, ly + fontSize + 2);
        }
      });
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // Cambio interactivo de fase
  function setPhase(phase) {
    if (phase < 0 || phase > 3) return;
    currentPhase = phase;

    // Actualizar botones de fase
    phaseBtns.forEach((btn) => {
      const p = parseInt(btn.dataset.phase, 10);
      btn.classList.toggle('active', p === currentPhase);
    });

    // Actualizar texto explicativo
    const info = PHASE_INFO[currentPhase];
    if (info) {
      if (stepBadge) stepBadge.textContent = info.badge;
      if (stepTitle) stepTitle.textContent = info.title;
      if (stepDesc) stepDesc.textContent = info.desc;
    }

    if (window.soundFX) window.soundFX.chime();
  }

  // Interacción de arrastre en 3D (Mouse y Touch)
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      targetRotY += dx * 0.007;
      targetRotX += dy * 0.007;
      // Limitar inclinación vertical para evitar inversión
      targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX));
    }
  });

  function stopDragging(e) {
    if (isDragging) {
      isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('pointercancel', stopDragging);
  canvas.addEventListener('pointerleave', () => {
    mouse.x = -10000;
    mouse.y = -10000;
  });

  // Botones de fases
  phaseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.phase, 10);
      setPhase(p);
    });
  });

  if (btnNextPhase) {
    btnNextPhase.addEventListener('click', () => {
      const next = (currentPhase + 1) % 4;
      setPhase(next);
    });
  }

  // Generar leyenda interactiva
  if (orbLegend) {
    orbLegend.innerHTML = KEYS.map((k) => {
      const s = STRUCTURES[k];
      return `
        <div class="legend-item" data-filter="${k}" title="Filtrar componentes de ${s.name}">
          <span class="legend-dot" style="background:${s.color}"></span>
          <span class="legend-name">${s.short}</span>
          <span class="legend-count">${s.nodes.length}</span>
        </div>
      `;
    }).join('');

    const legendItems = orbLegend.querySelectorAll('.legend-item');
    legendItems.forEach((item) => {
      item.addEventListener('click', () => {
        const f = item.dataset.filter;
        if (activeFilter === f) {
          activeFilter = null;
          legendItems.forEach((it) => it.classList.remove('active'));
        } else {
          activeFilter = f;
          legendItems.forEach((it) => it.classList.toggle('active', it === item));
        }
        if (window.soundFX) window.soundFX.click();
      });
    });
  }

  // Exponer API global para control de la esfera
  window.rapotOrb = {
    setPhase: setPhase,
    getPhase: () => currentPhase,
    resize: handleResize
  };
})();
