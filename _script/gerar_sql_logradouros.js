const fs = require('fs');
const path = require('path');

// Caminho da pasta onde os JSONs foram salvos pelo navegador
const diretorioOrigem = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\OSM_LOGRADOUROS';
const arquivoSaida = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\carga_osm_logradouros.sql';

function gerarSql() {
    try {
        // Lê apenas arquivos .json
        const arquivos = fs.readdirSync(diretorioOrigem).filter(file => file.endsWith('.json'));
        
        if (arquivos.length === 0) {
            console.log("Nenhum arquivo JSON encontrado no diretório especificado.");
            return;
        }

        let valoresSql = [];

        arquivos.forEach(arquivo => {
            const caminho = path.join(diretorioOrigem, arquivo);
            const dados = JSON.parse(fs.readFileSync(caminho, 'utf8'));

            // Mapeamento das novas chaves (com fallback para compatibilidade)
            const osmId = dados.OSM_ID || dados.osm_id;
            const scId = dados.SC_ID_LOGRADOURO || dados.sc_id_logradouro || '';
            const nomLog = (dados.NOM_LOGRADOURO || dados.logradouro || '').replace(/'/g, "''");
            const osmNomLog = (dados.OSM_NOM_LOGRADOURO || dados.osm_nom_logradouro || dados.nome_osm || '').replace(/'/g, "''");
            const wkt = dados.WKT || dados.wkt;

            if (osmId && wkt) {
                // Monta a tupla para o INSERT
                // Formato: (OSM_ID, SC_ID_LOGRADOURO, NOM_LOGRADOURO, OSM_NOM_LOGRADOURO, GEOMETRIA)
                valoresSql.push(`(${osmId}, '${scId}', '${nomLog}', '${osmNomLog}', ST_GeomFromText('${wkt}'))`);
            }
        });

        if (valoresSql.length > 0) {
            // Cria o comando SQL completo
            const sqlFinal = `INSERT INTO OSM_LOGRADOUROS (OSM_ID, SC_ID_LOGRADOURO, NOM_LOGRADOURO, OSM_NOM_LOGRADOURO, GEOMETRIA)\nVALUES\n${valoresSql.join(',\n')};`;

            fs.writeFileSync(arquivoSaida, sqlFinal, 'utf8');
            console.log(`--------------------------------------------------`);
            console.log(`SUCESSO!`);
            console.log(`Arquivo gerado: ${arquivoSaida}`);
            console.log(`Total de registros processados: ${valoresSql.length}`);
            console.log(`--------------------------------------------------`);
        }

    } catch (err) {
        console.error("Erro crítico ao processar arquivos:", err.message);
    }
}

gerarSql();