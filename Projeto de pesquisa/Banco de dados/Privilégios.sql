CREATE USER ciata@localhost IDENTIFIED BY 'ciata';

GRANT ALL PRIVILEGES ON geo.* TO ciata@localhost;

FLUSH PRIVILEGES;

SHOW GRANTS FOR ciata@localhost;