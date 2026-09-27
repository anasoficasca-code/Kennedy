# RAPOT · Modelamiento Dinámico · Caso Kennedy 🌐🏙️

> **Ingeniería inversa al Plan de Ordenamiento Territorial de Bogotá (Decreto 555 de 2021) con foco analítico y simulado en la localidad de Kennedy.**  
> Aplicación web ultra-ligera, modular y dinámica diseñada con la **View Transitions API**, simuladores en HTML5 Canvas y arquitectura SPA sin dependencias.

🔗 **Sitio web en vivo (GitHub Pages):**  
👉 **[https://anasoficasca-code.github.io/Kennedy/](https://anasoficasca-code.github.io/Kennedy/)**

---

## ⚡ ¿Por qué esta nueva versión?

La versión previa de investigación contenía archivos GeoJSON y documentos de referencia de gran volumen (~255 MB), lo que ralentizaba la carga en navegadores web y dispositivos móviles.

Esta nueva entrega **reduce el peso total del repositorio a menos de 100 KB** (un ahorro superior al **99.9%**), eliminando tiempos de espera y transformando la experiencia en una interfaz interactiva de alta fidelidad:

1. **Navegación Dinámica sin Recargas**: Utiliza la **View Transitions API** nativa de los navegadores para lograr transiciones fluidas de página completa tipo aplicación nativa.
2. **Esfera 3D Interactiva (`orb.js`)**: Visualización matemática con distribución Fibonacci y proyección en perspectiva 3D de los 38 componentes del POT. Permite rotación táctil o con cursor y transición morfológica entre cuatro fases.
3. **Laboratorio de Simulación Kennedy (`kennedy.js`)**:
   - **Corabastos y Flujos Logísticos**: Simulación multi-agente en tiempo real del tránsito de 12.000 camiones diarios según turnos (Madrugada, Mañana, Tarde) y saturación perimetral.
   - **Dispersión Bioacústica vs. Fauna**: Modelo empírico del impacto del ruido vehicular de la Av. Ciudad de Cali sobre las aves endémicas (Tingua Bogotana) en los humedales El Burro y La Vaca.
   - **Red Causal Dinámica**: Matriz interactiva de bucles de realimentación y sobrecarga metabólica del territorio.
4. **Sintetizador Web Audio API**: Sonificación procedural en tiempo real (micro-clicks táctiles y campanas armónicas de transición) sin cargar ningún archivo de audio MP3 externo.
5. **Radar Dinámico del Modelo Propio**: Calculadora y gráfico interactivo de respuesta sistémica territorial que mide resiliencia climática, equidad territorial y conectividad urbana.

---

## 🧭 Vistas y Secciones

- **1. La Esfera (`#inicio`)**: Análisis en 4 fases del POT oficial (Toda la ciudad, Descomposición en 4 estructuras, 6 relaciones oficiales y Priorización por tamaño).
- **2. Relaciones del POT (`#relaciones`)**: Las 6 citas textuales verbatim extraídas del POT "Bogotá Reverdece 2022-2035", con filtros cruzados por estructura emisora/receptora.
- **3. Caso Kennedy (`#kennedy`)**: Los 3 simuladores dinámicos del territorio crítico.
- **4. Módulos de Investigación (`#modulos`)**: Enlaces directos a los módulos cuantitativos y simulaciones complementarias de la investigación.
- **5. Modelo Propio (`#modelo-propio`)**: La hipótesis de la ciudad como sistema de cuidado mutuo, con reguladores reactivos y equilibrio automatizado.

---

## 🛠️ Tecnologías y Estándares

- **HTML5 Semántico**: Accesibilidad, metaetiquetas de viewport y tipografía responsiva.
- **CSS3 Moderno**: View Transitions (`::view-transition-old/new`), CSS Custom Properties (Variables de diseño), gradientes Aurora bioluminiscentes, Glassmorphism y Flexbox/CSS Grid.
- **JavaScript Moderno (ES6+)**:
  - `document.startViewTransition()` con fallback degradado.
  - Proyección vectorial 3D (Z-buffering, rotación por matrices y algoritmos de Fibonacci).
  - Web Audio API (Osciladores sinusoidales y curvas de ganancia exponencial).
  - Canvas 2D adaptativo al `devicePixelRatio`.
- **Cero dependencias de empaquetado**: No requiere `npm`, `webpack` ni `vite`. Carga instantánea directa en cualquier servidor web estático o GitHub Pages.

---

## 📁 Estructura del Proyecto

```text
Kennedy/
├── index.html        # Estructura principal y maquetado de las 5 vistas SPA
├── style.css         # Sistema de diseño Aurora, transiciones y componentes
├── orb.js            # Motor Canvas 3D de la esfera de componentes del POT
├── kennedy.js        # Simuladores interactivos de Corabastos, acústica y red causal
├── app.js            # Enrutador View Transitions, sintetizador de audio y radar
├── .nojekyll         # Deshabilita el procesamiento de Jekyll en GitHub Pages
└── README.md         # Documentación de la investigación y arquitectura
```

---

## 🚀 Despliegue en GitHub Pages

Para ejecutar o clonar localmente:
```bash
git clone https://github.com/anasoficasca-code/Kennedy.git
cd Kennedy
# Abre index.html en cualquier navegador moderno
```

---

*Proyecto desarrollado con fines académicos y de investigación en modelamiento de sistemas urbanos complejos.*
