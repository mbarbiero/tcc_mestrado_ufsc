const fs = require('fs');

// Configurações de ficheiros
const fileQuadras = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\TCC_Quadras_v01.csv';
const fileLogradouros = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\OSM_LOGRADOUROS.csv';
const fileOutput = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\inserir_pontos_proximos.sql';
const fileOutputSQL = 'inserir_duplo.sql';
const fileOutputCSV = 'Pontos_proximos_duplo.csv';

// Cálculo de distância Euclidiana simples
const calcDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

function processar() {
    console.log('Iniciando processamento...');

    // 1. Ler Quadras (Delimitador vírgula)
    const qData = fs.readFileSync(fileQuadras, 'utf8').split('\n').filter(l => l.trim());
    const headersQ = qData[0].split(',');
    const quadras = qData.slice(1).map(line => {
        const v = line.split(',');
        return {
            codigo: v[0],
            lat: parseFloat(v[4]),
            lng: parseFloat(v[5]),
            sc_id: v[6],
            face_id: v[8] ? v[8].trim() : ''
        };
    });

    // 2. Ler Logradouros (Delimitador ponto e vírgula)
    const lData = fs.readFileSync(fileLogradouros, 'utf8').split('\n').filter(l => l.trim());
    const logradouros = lData.slice(1).map(line => {
        const v = line.split(';');
        return { sc_id: v[1], wkt: v[4] };
    });

    const resultados = [];

    // 3. Processamento Geográfico
    quadras.forEach(q => {
        let verticesDaRua = [];
        const trechos = logradouros.filter(l => l.sc_id === q.sc_id);

        trechos.forEach(t => {
            if (!t.wkt) return;
            const coords = t.wkt.replace('LINESTRING (', '').replace(')', '').split(', ');
            coords.forEach(c => {
                const parts = c.split(' ');
                const vLng = parseFloat(parts[0]);
                const vLat = parseFloat(parts[1]);
                verticesDaRua.push({ lat: vLat, lng: vLng, dist: calcDist(q.lng, q.lat, vLng, vLat) });
            });
        });

        // Ordenar e pegar os 2 melhores
        verticesDaRua.sort((a, b) => a.dist - b.dist);
        const v1 = verticesDaRua[0] || { lat: 0, lng: 0, dist: 0 };
        const v2 = verticesDaRua[1] || { lat: 0, lng: 0, dist: 0 };

        resultados.push({
            codigo: q.codigo,
            face: q.face_id,
            qLat: q.lat,
            qLng: q.lng,
            v1Lat: v1.lat,
            v1Lng: v1.lng,
            d1: v1.dist,
            v2Lat: v2.lat,
            v2Lng: v2.lng,
            d2: v2.dist
        });
    });

    // 4. Gerar SQL
    const sqlStream = fs.createWriteStream(fileOutputSQL);
    sqlStream.write('SET NAMES utf8mb4;\n');
    resultados.forEach(r => {
        const sql = `INSERT INTO ANALISE_ERRO_PROXIMIDADE_DUPLO (CODIGO_CARTOGRAFICO, CI_ID_FACE, GEO_PONTO, OSM_VERTICE_1, DISTANCIA_1, OSM_VERTICE_2, DISTANCIA_2) VALUES ('${r.codigo}', '${r.face}', POINT(${r.qLng}, ${r.qLat}), POINT(${r.v1Lng}, ${r.v1Lat}), ${r.d1}, POINT(${r.v2Lng}, ${r.v2Lat}), ${r.d2});\n`;
        sqlStream.write(sql);
    });
    sqlStream.end();

    // 5. Gerar CSV (Para o seu mapa HTML)
    const csvStream = fs.createWriteStream(fileOutputCSV);
    csvStream.write('CODIGO,FACE,QLAT,QLNG,V1LAT,V1LNG,D1,V2LAT,V2LNG,D2\n');
    resultados.forEach(r => {
        csvStream.write(`${r.codigo},${r.face},${r.qLat},${r.qLng},${r.v1Lat},${r.v1Lng},${r.d1},${r.v2Lat},${r.v2Lng},${r.d2}\n`);
    });
    csvStream.end();

    console.log('Ficheiros gerados com sucesso!');
}

processar();