const dsn = process.env.DATABASE_URL;
console.log('DSN (raw):', dsn);
// Mask password for logging
const masked = dsn.replace(/(:)[^@]*(@)/, '$1***$2');
console.log('DSN (masked):', masked);
// Attempt to parse
if (dsn.includes('@')) {
  const [prefix, rest] = dsn.split('://');
  const [creds, hostpart] = rest.split('@');
  const [user, password] = creds.split(':');
  console.log('User:', user);
  console.log('Password:', JSON.stringify(password));
  console.log('Password type:', typeof password);
  console.log('Password length:', password.length);
} else {
  console.log('No @ found in DSN');
}
const { Client } = require('pg');
const client = new Client({ connectionString: dsn });
client.connect(err => {
  if (err) {
    console.error('Connection error:', err);
    console.error('Error message:', err.message);
  } else {
    console.log('Connected successfully!');
    client.end();
  }
});
