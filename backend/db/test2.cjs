require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const url = process.env.DATABASE_URL;
console.log('DATABASE_URL:', url.replace(/:.*@/, ':****@'));
const { Pool } = require('pg');
const pool = new Pool({ connectionString: url });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err.stack);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
