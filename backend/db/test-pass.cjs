require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const dsn = process.env.DATABASE_URL;
console.log('DSN:', dsn.replace(/:[^@]*@/, ':***@'));
const match = dsn.match(/postgres:\/\/([^:]+):([^@]+)@/);
if (match) {
  const user = match[1];
  const password = match[2];
  console.log('User:', user);
  console.log('Password:', JSON.stringify(password)); // will show empty string as ""
  console.log('Password typeof:', typeof password);
  console.log('Password length:', password.length);
  const { Client } = require('pg');
  const client = new Client({ connectionString: dsn });
  client.connect(err => {
    if (err) {
      console.error('Connection error:', err);
    } else {
      console.log('Connected successfully');
      client.end();
    }
  });
} else {
  console.log('Could not parse DSN');
}
