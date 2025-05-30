// db.js
require('dotenv').config();

const config = {
 user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: 50000,
  requestTimeout: 50000, 
};

module.exports = config;