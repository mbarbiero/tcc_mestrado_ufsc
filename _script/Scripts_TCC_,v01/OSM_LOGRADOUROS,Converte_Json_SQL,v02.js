const fs = require('fs');
const path = require('path');

// Caminhos dos ficheiros
const fileQuadras = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\TCC_Quadras_v01.csv';
const fileLogradouros = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\osm_logradouros\\OSM_LOGRADOUROS.csv';
const fileOutput = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\TCC_,v01\\osm_logradouros\\inserir_pontos_proximos.sql';

// Função de distância Euclidiana (em graus)
const calcDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

function processar() {
    console.log('Lendo ficheiros...');
    
    // Ler e fazer o parse das Quadras (Delimitador vírgula)
    const quadrasRaw = fs.readFileSync(fileQuadras, 'utf8').split('\n');
    const headersQ = quadrasRaw[0].split(',');
    const listaQuadras = quadrasRaw.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',');
        return {
            CODIGO: values[0],
            LAT: parseFloat(values[4]),
            LNG: parseFloat(values[5]),
            SC_ID: values[6],
            FACE_ID: values[8] ? values[8].trim() : ''
        };
    });

    // Ler e fazer o parse dos Logradouros (Delimitador ponto e vírgula)
    const logradourosRaw = fs.readFileSync(fileLogradouros, 'utf8').split('\n');
    const listaLogradouros = logradourosRaw.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(';');
        return {
            OSM_ID: values[0],
            SC_ID: values[1],
            WKT: values[4]
        };
    });

    console.log(`Processando ${listaQuadras.length} faces de quadras...`);

    const sqlStream = fs.createWriteStream(fileOutput);
    sqlStream.write('-- Script de análise de proximidade (2 vizinhos mais próximos)\n');
    sqlStream.write('SET NAMES utf8mb4;\n\n');

    listaQuadras.forEach(q => {
        let todosVertices = [];

        // Filtra os trechos de logradouro que têm o mesmo ID da face da quadra
        const trechos = listaLogradouros.filter(l => l.SC_ID === q.SC_ID);

        trechos.forEach(t => {
            if (!t.WKT) return;
            // Limpa o WKT para obter as coordenadas
            const coords = t.WKT.replace('LINESTRING (', '').replace(')', '').split(', ');
            
            coords.forEach(c => {
                const parts = c.split(' ');
                const vLng = parseFloat(parts[0]);
                const vLat = parseFloat(parts[1]);
                const d = calcDist(q.LNG, q.LAT, vLng, vLat);
                
                todosVertices.push({ lng: vLng, lat: vLat, dist: d, osm_id: t.OSM_ID });
            });
        });

        // Ordenar e pegar os 2 vértices mais próximos
        todosVertices.sort((a, b) => a.dist - b.dist);
        const vizinhos = todosVertices.slice(0, 2);

        vizinhos.forEach((v, idx) => {
            const sql = `INSERT INTO ANALISE_ERRO_PROXIMIDADE (CODIGO_CARTOGRAFICO, CI_ID_FACE, RANK_VIZINHO, DISTANCIA_GRAUS, GEO_PONTO, OSM_VERTICE) VALUES ('${q.CODIGO}', '${q.FACE_ID}', ${idx + 1}, ${v.dist}, POINT(${q.LNG}, ${q.LAT}), POINT(${v.lng}, ${v.lat}));\n`;
            sqlStream.write(sql);
        });
    });

    sqlStream.end();
    console.log(`Sucesso! Ficheiro gerado: ${fileOutput}`);
}

processar();