const fs = require('fs');
const path = require('path');

// Configurações de caminhos
const diretorioOrigem = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\OSM_LOGRADOUROS';
const arquivoSaida = 'C:\\Users\\qto\\OneDrive\\Documentos\\Mestrado\\TCC\\Dados\\Capanema\\inserir_logradouros.sql';

// Função para processar os arquivos
function processarArquivos() {
    try {
        const arquivos = fs.readdirSync(diretorioOrigem).filter(file => file.endsWith('.json'));
        
        if (arquivos.length === 0) {
            console.log("Nenhum arquivo JSON encontrado na pasta.");
            return;
        }

        let valoresSql = [];

        arquivos.forEach(arquivo => {
            const caminhoCompleto = path.join(diretorioOrigem, arquivo);
            const conteudo = JSON.parse(fs.readFileSync(caminhoCompleto, 'utf8'));

            // Escapar aspas simples em nomes para evitar erro no SQL
            const nomeSolicitado = (conteudo.logradouro || conteudo.nome_solicitado || '').replace(/'/g, "''");
            const nomeOsm = (conteudo.osm_nom_logradouro || conteudo.nome_osm || '').replace(/'/g, "''");
            const scId = conteudo.SC_ID_LOGRADOURO || conteudo.sc_id_logradouro || '';
            const osmId = conteudo.osm_id || conteudo.OSM_ID;
            const wkt = conteudo.wkt || conteudo.WKT;

            if (wkt) {
                // Formatação para MySQL (usando ST_GeomFromText)
                // Se for outro banco (PostGIS), a sintaxe é similar
                valoresSql.push(`(${osmId}, '${scId}', '${nomeSolicitado}', '${nomeOsm}', ST_GeomFromText('${wkt}'))`);
            }
        });

        const sqlFinal = `INSERT INTO OSM_LOGRADOUROS (OSM_ID, SC_ID_LOGRADOURO, NOM_LOGRADOURO, OSM_NOM_LOGRADOURO, GEOMETRIA)\nVALUES\n${valoresSql.join(',\n')};`;

        fs.writeFileSync(arquivoSaida, sqlFinal);
        console.log(`Sucesso! Script SQL gerado: ${arquivoSaida}`);
        console.log(`Total de registros: ${valoresSql.length}`);

    } catch (err) {
        console.error("Erro ao processar:", err);
    }
}

processarArquivos();