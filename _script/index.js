
const mysql = require('mysql2');
const cors = require('cors');
const express = require('express');

const app = express();
const PORT = 21112;

app.use(cors()); // Permitir chamadas do navegador

// Configuração da conexão com o MySQL (reutilizável)
const dbConfig = {
  host: 'mysql.smuu.com.br',
  user: 'smuu_add2',
  password: 'SmuuBd2',
  database: 'smuu',
  port: 3306
};

app.get('/ciata/testar-conexao', (req, res) => {
  const connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    console.log('Testando conexão');
    if (err) {
      console.error('Erro na conexão:', err.message);
      return res.status(500).json({ sucesso: false, erro: err.message });
    }

    console.log('Conexão MySQL bem-sucedida!');
    connection.end();
    res.json({ sucesso: true, mensagem: 'Conexão MySQL OK!' });
  });
});

app.get('/ciata/cnefe', (req, res) => {
  const connection = mysql.createConnection(dbConfig);

  // Consulta SQL (ajuste o nome da tabela conforme necessário)
  const sql = 'SELECT * FROM cnefe LIMIT 100'; // Limita a 100 registros para evitar sobrecarga

  connection.query(sql, (err, results) => {
    connection.end(); // Fecha a conexão após a consulta

    if (err) {
      console.error('Erro na consulta:', err.message);
      return res.status(500).json({ sucesso: false, erro: err.message });
    }

    console.log(`Dados da cnefe retornados: ${results.length} registros`);
    res.json({ dados: results });
    //res.json({ sucesso: true, dados: results });
  });
});

app.get('/ciata/cnefe-geojson', (req, res) => {
  const connection = mysql.createConnection(dbConfig);
  var qtd = 0;

  const codMunicipio = req.query.COD_MUNICIPIO;
  const codQuadra = req.query.COD_QUADRA;

  // A tabela cnefe valores nas colunas de latitude/longitude
  const sql = `
    SELECT DISTINCT
      NUM_QUADRA,
      NUM_FACE,
      latitude,
      longitude,
      NOM_LOGRADOURO,
      NUM_ENDERECO
    FROM 
      cnefe
    WHERE 
      COD_MUNICIPIO = '${codMunicipio}' 
        AND
      NUM_QUADRA = '${codQuadra}'
        AND
      latitude IS NOT NULL AND longitude IS NOT NULL
    `;

  connection.query(sql, (err, results) => {
    connection.end();

    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    // Converter resultados para GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: results.map(item => ({
        type: "Feature",
        properties: {
          num_quadra: item.NUM_QUADRA,
          num_face: item.NUM_FACE,
          nom_logradouro: item.NOM_LOGRADOURO,
          num_endereco: item.NUM_ENDERECO
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)]
        }
      }))
    };

    res.json(geojson);
  });
});

app.get('/ciata/quadras-cnefe-geojson', (req, res) => {
  const connection = mysql.createConnection(dbConfig);
  var qtd = 0;

  const codMunicipio = req.query.COD_MUNICIPIO;

  // A tabela cnefe valores nas colunas de latitude/longitude
  const sql = `
    SELECT DISTINCT
      NUM_QUADRA,
      NUM_FACE,
      latitude,
      longitude,
      NOM_LOGRADOURO,
      NUM_ENDERECO
    FROM 
      cnefe
    WHERE 
      COD_MUNICIPIO = '${codMunicipio}' 
        AND
      latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY
      NUM_QUADRA, NUM_FACE
    `;

  connection.query(sql, (err, results) => {
    connection.end();

    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    // Converter resultados para GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: results.map(item => ({
        type: "Feature",
        properties: {
          num_quadra: item.NUM_QUADRA,
          num_face: item.NUM_FACE,
          nom_logradouro: item.NOM_LOGRADOURO,
          num_endereco: item.NUM_ENDERECO
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)]
        }
      }))
    };

    res.json(geojson);
  });
});


app.get('/ciata/CentroideFacesGeojson', (req, res) => {
  const connection = mysql.createConnection(dbConfig);
  var qtd = 0;

  const codMunicipio = req.query.COD_MUNICIPIO;

  // A tabela cnefe valores nas colunas de latitude/longitude
  const sql = `
    SELECT DISTINCT
      NUM_QUADRA,
      NUM_FACE,
      TIPO_LOGRADOURO,
      NOM_LOGRADOURO,
      LATITUDE_CENTROIDE,
      LONGITUDE_CENTROIDE      
    FROM 
      CNEFE_FACES
    WHERE 
      COD_MUNICIPIO = '${codMunicipio}' 
        AND
      LATITUDE_CENTROIDE IS NOT NULL AND LONGITUDE_CENTROIDE IS NOT NULL
    ORDER BY
      NUM_QUADRA, NUM_FACE
    `;

  connection.query(sql, (err, results) => {
    connection.end();

    if (err) {
      return res.status(500).json({ erro: err.message });
    }

    // Converter resultados para GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: results.map(item => ({
        type: "Feature",
        properties: {
          num_quadra: item.NUM_QUADRA,
          num_face: item.NUM_FACE,
          tipo_logradouro: item.TIPO_LOGRADOURO,
          nom_logradouro: item.NOM_LOGRADOURO
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(item.LONGITUDE_CENTROIDE), parseFloat(item.LATITUDE_CENTROIDE)]
        }
      }))
    };

    res.json(geojson);
  });
});

app.get('/ciata/cnefe-minmax', (req, res) => {
  const connection = mysql.createConnection(dbConfig);
  var qtd = 0;

  const codMunicipio = req.query.COD_MUNICIPIO;
  const codQuadra = req.query.COD_QUADRA;

  // A tabela cnefe valores nas colunas de latitude/longitude
  const sql = `
    SELECT 
      min(latitude) as minLat,
      min(longitude) as minLon,
      max(latitude) as maxLat,
      max(longitude) as maxLon
    FROM 
      cnefe
    WHERE 
      COD_MUNICIPIO = '${codMunicipio}' 
        AND
      NUM_QUADRA = '${codQuadra}'
        AND
      latitude IS NOT NULL AND longitude IS NOT NULL
    `;

  connection.query(sql, (err, results) => {
    connection.end();

    if (err) {
      return res.status(500).json({ erro: err.message });
    }


    // Converter resultados para GeoJSON
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            num_quadra: codQuadra
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [parseFloat(results[0].minLon), parseFloat(results[0].minLat)],
              [parseFloat(results[0].maxLon), parseFloat(results[0].minLat)],
              [parseFloat(results[0].maxLon), parseFloat(results[0].maxLat)],
              [parseFloat(results[0].minLon), parseFloat(results[0].maxLat)],
              [parseFloat(results[0].minLon), parseFloat(results[0].minLat)]
            ]]
          }
        }
      ]
    };
    res.json(geojson);
  });
});

app.listen(PORT, () => {
  console.log('Começando');
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

