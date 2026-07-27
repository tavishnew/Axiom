require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
// Override PGPASSWORD to empty string
process.env.PGPASSWORD = '';
const dsn = process.env.DATABASE_URL;
console.log('DSN:', dsn.replace(/:[^@]*@/, ':***@'));
const { Client } = require('pg');
const client = new Client({ connectionString: dsn });
client.connect(err => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connected successfully!');
    client.end();
  }
});
