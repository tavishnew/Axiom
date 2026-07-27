const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect(err => {
  if (err) {
    console.error('Connection error:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
  } else {
    console.log('Connected successfully');
    client.end();
  }
});
