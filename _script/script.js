// Inicializa o mapa
var map = L.map('map').setView([-23.5505, -46.6333], 13);

// Adiciona uma camada de tiles (mapa base)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Habilita a edição no mapa
map.editTools = new L.Editable(map);

// Define as coordenadas do polígono
var polygonCoords = [
    [-23.5505, -46.6333], // Vértice 1
    [-23.5605, -46.6433], // Vértice 2
    [-23.5705, -46.6533], // Vértice 3
    [-23.5805, -46.6633]  // Vértice 4
];

// Cria o polígono e o torna editável
var polygon = L.polygon(polygonCoords, {
    color: 'blue',
    fillColor: 'lightblue',
    fillOpacity: 0.5
}).addTo(map);

// Habilita a edição do polígono (permite mover e editar vértices)
polygon.enableEdit();