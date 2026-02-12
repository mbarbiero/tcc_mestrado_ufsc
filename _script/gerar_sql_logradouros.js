const fs = require('fs');
const path = require('path');

// Configuração de caminhos
const diretorioOrigem = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\OSM_LOGRADOUROS';
const arquivoSaida = 'importar_osm_logradouros.sql';

// Função para tratar aspas simples em nomes (Ex: D'Oeste -> D''Oeste)
const escapeSQL = (str) => str ? str.replace(/'/g, "''") : "";

function gerarSQL() {
    try {
        const arquivos = fs.readdirSync(diretorioOrigem);
        const jsonArquivos = arquivos.filter(file => path.extname(file).toLowerCase() === '.json');

        console.log(`Encontrados ${jsonArquivos.length} arquivos para processar.`);

        let sqlContent = `-- Script de Importação gerado em ${new Date().toLocaleString()}\n`;
        sqlContent += `USE seu_nome_do_banco; -- AJUSTE O NOME DO SEU BANCO AQUI\n\n`;

        jsonArquivos.forEach(arquivo => {
            const caminhoCompleto = path.join(diretorioOrigem, arquivo);
            const rawData = fs.readFileSync(caminhoCompleto);
            const data = JSON.parse(rawData);

            // Montagem do comando INSERT para MariaDB 10.2
            // ST_GeomFromText(WKT, SRID)
            const query = `INSERT INTO OSM_LOGRADOUROS (OSM_ID, SC_ID_LOGRADOURO, NOM_LOGRADOURO, OSM_NOM_LOGRADOURO, GEOMETRIA) 
VALUES (${data.osm_id}, '${data.sc_id_logradouro}', '${escapeSQL(data.nome_logradouro)}', '${escapeSQL(data.osm_name)}', ST_GeomFromText('${data.geometry_wkt}', 4326));\n`;

            sqlContent += query;
        });

        fs.writeFileSync(arquivoSaida, sqlContent);
        console.log(`✅ Sucesso! Arquivo '${arquivoSaida}' criado com todos os comandos INSERT.`);

    } catch (err) {
        console.error("Erro ao processar arquivos:", err.message);
    }
}

gerarSQL();