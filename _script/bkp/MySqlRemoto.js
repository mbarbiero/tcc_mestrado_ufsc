const mysql = require('mysql2');

// Configurações da conexão
const connection = mysql.createConnection({
  host: 'mysql.smuu.com.br', // IP ou domínio do servidor MySQL remoto
  user: 'smuu_add2',
  password: 'SmuuBd2',
  database: 'smuu',       // Opcional para apenas testar conexão
  port: 3306                       // Porta padrão do MySQL (ou altere se for diferente)
});

// Tentando conectar
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.message);
    return;
  }
  console.log('Conexão bem-sucedida ao servidor MySQL remoto!');
  connection.end();
});
