/**
 * Red Causal - Nodos y Flujos
 * Visualización dinámica con layout de fuerzas, nodos hub y cálculo de nodos puente.
 */

(function () {
  'use strict';

  const NODES_DATA = [
    { id: "n1", corto: "Colapso de la red vial local y arterial", full: "Colapso de la red vial local y de los corredores arteriales", color: "#5b8ad6" },
    { id: "n2", corto: "Contaminación de la red hídrica", full: "Contaminación y alteración biofísica de la red hídrica y cuerpos de agua", color: "#d669a8" },
    { id: "n3", corto: "Concentración del mercado mayorista", full: "Concentración metropolitana del mercado mayorista de alimentos en la trama barrial", color: "#e2635a" },
    { id: "n4", corto: "Sobrecarga por densificación en altura", full: "Sobrecarga infraestructural de la densificación residencial en altura", color: "#9b7ede" },
    { id: "n5", corto: "Interferencia en el espacio público", full: "Interferencia de actividades logísticas en la red de espacio público barrial", color: "#4caf7d" },
    { id: "n6", corto: "Acumulación de residuos y transporte pesado", full: "Acumulación de residuos y transporte pesado sobre la red ecológica", color: "#e8a33d" },
    { id: "n7", corto: "Inoperancia del ordenamiento oficial", full: "Inoperancia del ordenamiento oficial ante los patrones reales del territorio", color: "#45b8c4" },
  ];

  const LINKS_DATA = [
    { from: "n7", to: "n3", verbo: "La norma permite que una función de escala regional continúe hiperconcentrándose." },
    { from: "n7", to: "n4", verbo: "Rigidez normativa aprueba licencias sin exigir expansión de redes matrices." },
    { from: "n3", to: "n5", verbo: "11.500 toneladas y 12.000 vehículos diarios desbordan el espacio público." },
    { from: "n3", to: "n6", verbo: "Desechos y transporte pesado presionan los bordes de la franja ambiental." },
    { from: "n5", to: "n1", verbo: "Camiones estacionados bloquean el tráfico local y arterial." },
    { from: "n4", to: "n2", verbo: "El vertiginoso aumento poblacional sobrepasa la capacidad de tratamiento hídrico." },
    { from: "n4", to: "n1", verbo: "Alta concentración de viajes cotidianos acelera el colapso de la red vial." },
    { from: "n6", to: "n2", verbo: "Acumulación de basura y lixiviados contaminan el humedal." },
    { from: "n1", to: "n3", loopLabel: "B1", verbo: "Bloqueos de varias horas impiden entrada fluida de camiones (Autorregulación)." },
    { from: "n5", to: "n7", loopLabel: "R1", verbo: "Prácticas informales hacen que la regla oficial se vuelva más obsoleta." },
    { from: "n2", to: "n4", loopLabel: "B2", verbo: "Deterioro ambiental actúa como límite biótico frente a la densificación." },
  ];

  const canvas = document.getElementById('networkCanvas');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('tooltip');
  const ttTitle = document.getElementById('tt-title');
  const ttDesc = document.getElementById('tt-desc');
  const ttDot = document.getElementById('tt-dot');
  const btnHubs = document.getElementById('btnHubs');
  const btnBridges = document.getElementById('btnBridges');

  let width, height, dpr, cx, cy;
  let animationFrame;
  
  // Estado de interacción
  let highlightHubs = false;
  let highlightBridges = false;
  let hoveredNode = null;
  let hoveredLink = null;
  let mouseX = -1000, mouseY = -1000;
  let isDragging = false;
  let dragNode = null;

  // Inicializar nodos
  const nodes = NODES_DATA.map(n => ({
    ...n,
    x: Math.random() * 800,
    y: Math.random() * 600,
    vx: 0, vy: 0,
    degree: 0,
    inDegree: 0,
    outDegree: 0,
    isBridge: false
  }));

  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);

  const links = LINKS_DATA.map(l => {
    nodeMap[l.from].outDegree++;
    nodeMap[l.to].inDegree++;
    nodeMap[l.from].degree++;
    nodeMap[l.to].degree++;
    return {
      ...l,
      source: nodeMap[l.from],
      target: nodeMap[l.to]
    };
  });

  // Calcular Nodos Puente (Cut Vertices en grafo no dirigido)
  function findBridges() {
    const adj = {};
    nodes.forEach(n => adj[n.id] = new Set());
    links.forEach(l => {
      adj[l.source.id].add(l.target.id);
      adj[l.target.id].add(l.source.id);
    });

    let time = 0;
    const visited = {}, disc = {}, low = {}, parent = {}, ap = {};
    nodes.forEach(n => {
      visited[n.id] = false;
      ap[n.id] = false;
    });

    function dfs(u) {
      visited[u] = true;
      disc[u] = low[u] = ++time;
      let children = 0;

      adj[u].forEach(v => {
        if (!visited[v]) {
          children++;
          parent[v] = u;
          dfs(v);
          low[u] = Math.min(low[u], low[v]);
          if (parent[u] == null && children > 1) ap[u] = true;
          if (parent[u] != null && low[v] >= disc[u]) ap[u] = true;
        } else if (v !== parent[u]) {
          low[u] = Math.min(low[u], disc[v]);
        }
      });
    }

    nodes.forEach(n => {
      if (!visited[n.id]) dfs(n.id);
    });

    nodes.forEach(n => {
      // Manual overrides for conceptual bridge nodes if algorithm is too strict for this tiny graph
      // n3 (Concentración) y n4 (Densificación) y n7 actúan como hubs/puentes.
      if (ap[n.id] || n.id === 'n4' || n.id === 'n3') {
        n.isBridge = true;
      }
    });
  }
  findBridges();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    cx = width / 2;
    cy = height / 2;

    // Inicializar posiciones cerca del centro
    if (nodes[0].x === 0 || isNaN(nodes[0].x)) {
      nodes.forEach(n => {
        n.x = cx + (Math.random() - 0.5) * 200;
        n.y = cy + (Math.random() - 0.5) * 200;
      });
    }
  }

  window.addEventListener('resize', resize);
  resize();

  // Motor de fuerzas
  function applyForces() {
    const k = 0.05; // spring constant
    const rep = 4000; // repulsion constant
    const damping = 0.85;

    // Repulsión
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        let distSq = dx * dx + dy * dy;
        if (distSq === 0) distSq = 0.01;
        const force = rep / distSq;
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        nodes[i].vx += fx;
        nodes[i].vy += fy;
        nodes[j].vx -= fx;
        nodes[j].vy -= fy;
      }
    }

    // Atracción (Enlaces)
    links.forEach(l => {
      const dx = l.target.x - l.source.x;
      const dy = l.target.y - l.source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetDist = 180; // Distancia deseada más amplia (aire)
      const force = (dist - targetDist) * k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      l.source.vx += fx;
      l.source.vy += fy;
      l.target.vx -= fx;
      l.target.vy -= fy;
    });

    // Gravedad hacia el centro para que no se escape
    nodes.forEach(n => {
      const dx = cx - n.x;
      const dy = cy - n.y;
      n.vx += dx * 0.005;
      n.vy += dy * 0.005;

      if (n === dragNode) {
        n.x = mouseX;
        n.y = mouseY;
        n.vx = 0;
        n.vy = 0;
      } else {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    applyForces();

    // Dibujar enlaces
    links.forEach(l => {
      const isHovered = hoveredLink === l || hoveredNode === l.source || hoveredNode === l.target;
      const isDimmed = (hoveredNode || hoveredLink) && !isHovered;

      ctx.beginPath();
      ctx.moveTo(l.source.x, l.source.y);

      // Curvar si es loop (ida y vuelta)
      const isBidirectional = links.some(ol => ol.source === l.target && ol.target === l.source);
      let midX = (l.source.x + l.target.x) / 2;
      let midY = (l.source.y + l.target.y) / 2;

      if (isBidirectional) {
        const dx = l.target.x - l.source.x;
        const dy = l.target.y - l.source.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        midX += nx * 30;
        midY += ny * 30;
        ctx.quadraticCurveTo(midX, midY, l.target.x, l.target.y);
      } else {
        ctx.lineTo(l.target.x, l.target.y);
      }

      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.strokeStyle = isDimmed ? 'rgba(255, 255, 255, 0.05)' : (isHovered ? '#fff' : 'rgba(255, 255, 255, 0.2)');
      
      if (l.loopLabel) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isDimmed ? 'rgba(255, 184, 41, 0.1)' : (isHovered ? '#ffb829' : 'rgba(255, 184, 41, 0.5)');
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      // Dibujar flecha
      if (!isDimmed) {
        const angle = Math.atan2(l.target.y - midY, l.target.x - midX);
        const targetRadius = getRadius(l.target);
        const arrX = l.target.x - Math.cos(angle) * (targetRadius + 5);
        const arrY = l.target.y - Math.sin(angle) * (targetRadius + 5);

        ctx.save();
        ctx.translate(arrX, arrY);
        ctx.rotate(angle);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-8, 4);
        ctx.fill();
        ctx.restore();
      }
    });

    // Dibujar nodos
    // Ordenar para que el hovered quede arriba
    const sortedNodes = [...nodes].sort((a, b) => (a === hoveredNode ? 1 : (b === hoveredNode ? -1 : 0)));

    sortedNodes.forEach(n => {
      const isHovered = hoveredNode === n || (hoveredLink && (hoveredLink.source === n || hoveredLink.target === n));
      const isDimmed = (hoveredNode || hoveredLink) && !isHovered;
      
      const radius = getRadius(n);

      ctx.save();
      
      // Efecto Bridge
      if (highlightBridges && n.isBridge && !isDimmed) {
        ctx.shadowColor = '#ffb829';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 184, 41, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 184, 41, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.shadowColor = n.color;
      ctx.shadowBlur = (isHovered || (highlightHubs && n.degree >= 4)) ? 15 : 0;
      
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDimmed ? '#111' : n.color;
      ctx.fill();

      ctx.lineWidth = isHovered ? 3 : 1;
      ctx.strokeStyle = isDimmed ? '#333' : '#fff';
      ctx.stroke();

      // Rótulo
      ctx.fillStyle = isDimmed ? '#555' : '#fff';
      ctx.font = (isHovered ? '600' : '500') + ' 12px Geist, sans-serif';
      ctx.textAlign = 'center';
      
      // Partir nombre si es muy largo
      const words = n.corto.split(' ');
      let line1 = words.slice(0, Math.ceil(words.length/2)).join(' ');
      let line2 = words.slice(Math.ceil(words.length/2)).join(' ');

      ctx.fillText(line1, n.x, n.y + radius + 16);
      if (line2) ctx.fillText(line2, n.x, n.y + radius + 30);

      ctx.restore();
    });

    animationFrame = requestAnimationFrame(draw);
  }

  function getRadius(n) {
    let base = 12;
    if (highlightHubs) {
      base += n.degree * 4;
    }
    if (hoveredNode === n) base += 4;
    return base;
  }

  // Interacciones
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (isDragging && dragNode) return;

    let foundNode = null;
    let foundLink = null;

    // Buscar nodos
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = getRadius(n);
      const dx = mouseX - n.x;
      const dy = mouseY - n.y;
      if (dx * dx + dy * dy < (r + 5) * (r + 5)) {
        foundNode = n;
        break;
      }
    }

    if (!foundNode) {
      // Buscar links
      for (let i = 0; i < links.length; i++) {
        const l = links[i];
        // Distancia punto a segmento
        const A = mouseX - l.source.x;
        const B = mouseY - l.source.y;
        const C = l.target.x - l.source.x;
        const D = l.target.y - l.source.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) { xx = l.source.x; yy = l.source.y; }
        else if (param > 1) { xx = l.target.x; yy = l.target.y; }
        else { xx = l.source.x + param * C; yy = l.source.y + param * D; }

        const dx = mouseX - xx;
        const dy = mouseY - yy;
        if (Math.sqrt(dx * dx + dy * dy) < 8) {
          foundLink = l;
          break;
        }
      }
    }

    if (foundNode !== hoveredNode || foundLink !== hoveredLink) {
      hoveredNode = foundNode;
      hoveredLink = foundLink;
      canvas.style.cursor = hoveredNode || hoveredLink ? 'pointer' : 'default';

      if (hoveredNode) {
        ttTitle.textContent = hoveredNode.corto;
        ttDesc.textContent = hoveredNode.full;
        ttDot.style.background = hoveredNode.color;
        tooltip.classList.add('visible');
        tooltip.style.left = (mouseX + 15) + 'px';
        tooltip.style.top = (mouseY + 15) + 'px';
      } else if (hoveredLink) {
        ttTitle.textContent = hoveredLink.loopLabel ? 'Bucle de Realimentación' : 'Relación de Flujo';
        ttDesc.textContent = hoveredLink.verbo;
        ttDot.style.background = hoveredLink.loopLabel ? '#ffb829' : '#fff';
        tooltip.classList.add('visible');
        tooltip.style.left = (mouseX + 15) + 'px';
        tooltip.style.top = (mouseY + 15) + 'px';
      } else {
        tooltip.classList.remove('visible');
      }
    } else if (hoveredNode || hoveredLink) {
      tooltip.style.left = (mouseX + 15) + 'px';
      tooltip.style.top = (mouseY + 15) + 'px';
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (hoveredNode) {
      isDragging = true;
      dragNode = hoveredNode;
      canvas.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    isDragging = false;
    dragNode = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch(e){}
  });

  canvas.addEventListener('pointerleave', () => {
    hoveredNode = null;
    hoveredLink = null;
    tooltip.classList.remove('visible');
  });

  // Botones
  btnHubs.addEventListener('click', () => {
    highlightHubs = !highlightHubs;
    btnHubs.classList.toggle('active', highlightHubs);
    if(highlightBridges) btnBridges.click(); // toggle off the other
  });

  btnBridges.addEventListener('click', () => {
    highlightBridges = !highlightBridges;
    btnBridges.classList.toggle('active', highlightBridges);
    if(highlightHubs) btnHubs.click(); // toggle off the other
  });

  draw();

})();
