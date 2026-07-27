const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'axiom',
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.stack);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
