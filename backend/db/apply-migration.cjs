require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'drizzle', '0000_overjoyed_johnny_blaze.sql');
let sql = fs.readFileSync(sqlPath, 'utf8');

// Remove comments? Not necessary for now.
// Split by semicolon, but ignore semicolons inside string literals.
// Simple split for now; assume no semicolons in strings.
const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => {
    console.log('Connected to database');
    let sequence = Promise.resolve();
    statements.forEach((stmt, index) => {
      if (stmt) {
        sequence = sequence.then(() => {
          console.log(`Executing statement ${index + 1}/${statements.length}: ${stmt.substring(0, 80)}...`);
          return client.query(stmt);
        });
      }
    });
    return sequence;
  })
  .then(() => {
    console.log('All statements executed successfully');
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
    process.exit(1);
  });
