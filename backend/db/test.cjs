require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.stack);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
