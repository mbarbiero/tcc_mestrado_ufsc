const fs = require("fs");
const { parse } = require("csv-parse/sync");


function parse_csv_file(nm_arquivo){
  const dados = fs.readFileSync(nm_arquivo,
    { encoding: 'utf8', flag: 'r' });

  const linhas = parse(dados, {
    columns: true,
    skip_empty_lines: true
  });

  return (linhas);
}

const qpl = parse_csv_file('./DADOS/paranavai_quadras_por_logradouro.csv');

function ret_quadras_por_logradouro(nm_logradouro){
  const quadras = qpl.find((linha)=>{
    return(linha.nm_logradouro === nm_logradouro);
  });
  let id_quadras = quadras.id_quadra;
  id_quadras = id_quadras.replaceAll("'", '"');
  id_quadras = JSON.parse(id_quadras);
  
  return(id_quadras);
}

function ret_quadras_por_logradouros(nm_logradouros){
  intersec = ret_quadras_por_logradouro(nm_logradouros[0]);
  console.log(intersec);

  for(i=1; i<nm_logradouros.length; i++){
    let cjq = ret_quadras_por_logradouro(nm_logradouros[i])
    intersec = intersec.filter(q => cjq.includes(q));
  }
  return(intersec);
}

let logradouros = ['JUSCELINO KUBITSCHEK DE OLIVEIRA','ANTONIO FELIPPE'];
console.log(ret_quadras_por_logradouros(logradouros));



