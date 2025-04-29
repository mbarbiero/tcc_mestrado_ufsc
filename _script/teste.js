const turf = require('@turf/turf');
const math = require('mathjs');

function createStreetCenterline(points, options = {}) {
  // Configurações padrão
  const {
    outlierThreshold = 50, // metros
    smoothness = 0.6,      // 0-1
    sampleDistance = 5     // metros entre pontos
  } = options;

  // 1. Remover outliers
  const centroid = turf.center(turf.featureCollection(points.map(p => turf.point(p))));
  const filtered = points.filter(p => 
    turf.distance(centroid, turf.point(p), {units: 'meters'}) < outlierThreshold
  );

  // 2. Encontrar direção principal (PCA simplificado)
  const xs = filtered.map(p => p[0]);
  const ys = filtered.map(p => p[1]);
  const cov = math.cov(xs, ys);
  const eigs = math.eigs(cov);
  const [vx, vy] = eigs.vectors[0];

  // 3. Projetar e ordenar pontos
  const projected = filtered.map(p => {
    const [x, y] = p;
    const t = (x * vx + y * vy) / (vx * vx + vy * vy);
    return [t * vx, t * vy];
  }).sort((a, b) => a[0] - b[0]);

  // 4. Criar e suavizar linha
  const line = turf.lineString(projected);
  const smoothed = turf.bezierSpline(line, {
    resolution: 10000,
    sharpness: smoothness
  });

  // 5. Amostrar pontos uniformemente
  const sampled = turf.lineChunk(smoothed, sampleDistance, {units: 'meters'});
  
  return sampled;
}

// Uso:

const streetCenterline = createStreetCenterline(pontosDomicilios, {
  outlierThreshold: 30,
  smoothness: 0.7
});

L.geoJSON(streetCenterline, {
  color: '#0066ff',
  weight: 4,
  opacity: 0.8
}).addTo(map);