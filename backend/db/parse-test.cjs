require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const urlString = process.env.DATABASE_URL;
console.log('Original connection string:', urlString.replace(/:[^@]*@/, ':***@'));
// Replace postgres:// with http:// to use URL constructor
let urlStr = urlString;
if (urlString.startsWith('postgres://')) {
  urlStr = 'http://' + urlString.substring('postgres://'.length);
}
try {
  const url = new URL(urlStr);
  console.log('Parsed:");
  console.log('  hostname:', url.hostname);
  console.log('  port:', url.port);
  console.log('  username:', url.username);
  console.log('  password:', url.password);
  console.log('  pathname:', url.pathname);
  const db = url.pathname.substring(1); // remove leading slash
  console.log('  database:', db);
  // Now try to connect using pg Client with these options
  const { Client } = require('pg');
  const client = new Client({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username,
    password: url.password,
    database: db,
  });
  client.connect(err => {
    if (err) {
      console.error('Connection error using parsed options:', err);
    } else {
      console.log('Connected successfully using parsed options');
      client.end();
    }
  });
} catch (e) {
  console.error('Error parsing URL:', e);
}
