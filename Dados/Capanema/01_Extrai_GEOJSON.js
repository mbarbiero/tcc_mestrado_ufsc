const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = 'Cadurb_Quadras_Capanema.csv';
const OUTPUT_DIR = 'geojson';

fse.ensureDirSync(OUTPUT_DIR);

fs.createReadStream(CSV_FILE)
  .pipe(
    csv({
      separator: ',',
      mapValues: ({ value }) => {
        if (!value) return '';
        if (value === '""""') return '';
        return value.replace(/^"+|"+$/g, '');
      }
    })
  )
  .on('data', (row) => {
    try {
      const codigo = row.codigo_cartografico;

      if (!codigo) {
        console.warn('Linha sem codigo_cartografico, ignorada.');
        return;
      }

      if (!row.geojson) {
        console.warn(`Sem geometria no código ${codigo}`);
        return;
      }

      // 🔹 Parse e normalização da geometria
      let geometry = JSON.parse(row.geojson);

      if (geometry.type === 'Feature' && geometry.geometry) {
        geometry = geometry.geometry;
      }

      const { geojson, ...properties } = row;

      const featureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry,
            properties
          }
        ]
      };

      const outputFile = path.join(
        OUTPUT_DIR,
        `${codigo}.geoJSON`
      );

      fs.writeFileSync(
        outputFile,
        JSON.stringify(featureCollection, null, 2),
        'utf8'
      );

    } catch (err) {
      console.error(
        `Erro ao processar código ${row.codigo_cartografico}:`,
        err.message
      );
    }
  })
  .on('end', () => {
    console.log('✅ Todos os arquivos GeoJSON foram gerados corretamente.');
  });