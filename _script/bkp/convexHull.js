// Coordenadas geodésicas (Latitude, Longitude) de cidades do Brasil
const cidadesBrasil = [
    [-23.5505, -46.6333],  // São Paulo
    [-22.9068, -43.1729],  // Rio de Janeiro
    [-25.4289, -49.2663],  // Curitiba
    [-30.0346, -51.2295],  // Porto Alegre
    [-15.7939, -47.8823],  // Brasília
    [-12.9711, -38.5023],  // Salvador
    [-8.0636, -34.8813],   // Recife
    [-3.1019, -60.0258]     // Manaus
  ];
  
  // Converte para formato GeoJSON (Turf.js exige [longitude, latitude])
  const pontosGeoJSON = turf.featureCollection(
    cidadesBrasil.map(p => turf.point([p[1], p[0]]))
  );
  
  // Calcula o Convex Hull
  const convexHull = turf.convexHull(pontosGeoJSON);
  
  // Inicializa o mapa (centrado no Brasil)
  const mapa = L.map('map').setView([-15, -55], 4);
  
  // Adiciona base map (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);
  
  // Adiciona os pontos originais ao mapa
  cidadesBrasil.forEach(cidade => {
    L.marker([cidade[0], cidade[1]])
      .bindPopup(`Cidade: ${cidade[0]}, ${cidade[1]}`)
      .addTo(mapa);
  });
  
  // Adiciona o Convex Hull ao mapa (em vermelho)
  L.geoJSON(convexHull, {
    style: {
      color: 'red',
      weight: 2,
      fillOpacity: 0.1
    }
  }).bindPopup('Área do Convex Hull').addTo(mapa);