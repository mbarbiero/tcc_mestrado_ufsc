
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

app.get('/testar-conexao', (req, res) => {
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
  const sql = 'SELECT * FROM CNEFE LIMIT 100'; // Limita a 100 registros para evitar sobrecarga

  connection.query(sql, (err, results) => {
    connection.end(); // Fecha a conexão após a consulta

    if (err) {
      console.error('Erro na consulta:', err.message);
      return res.status(500).json({ sucesso: false, erro: err.message });
    }

    console.log(`Dados da CNEFE retornados: ${results.length} registros`);
    res.json({dados: results });
    //res.json({ sucesso: true, dados: results });
  });
});

app.get('ciata/cnefe-geojson', (req, res) => {
  const connection = mysql.createConnection(dbConfig);
  
  // Supondo que a tabela CNEFE tem colunas de latitude/longitude
  const sql = `
    SELECT 
      NUM_QUADRA,
      latitude,
      longitude
    FROM CNEFE
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    LIMIT 100
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
          num_quadra: item.NUM_QUADRA
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

app.listen(PORT, () => {
  console.log('Começando');
  console.log(`Backend rodando em http://localhost:${PORT}`);
});

