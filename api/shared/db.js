// api/shared/db.js
const sql = require('mssql');

// Configuration for your SQL Database connection.
// These values MUST be set as Application Settings (Environment Variables)
// in your Azure Function App in the Azure Portal for security.
const config = {
    user: process.env.SQL_USER,         // Your SQL admin username
    password: process.env.SQL_PASSWORD, // Your SQL admin password
    server: process.env.SQL_SERVER,     // Your SQL server FQDN (e.g., 'your-server-name.database.windows.net,1433')
    database: process.env.SQL_DATABASE, // Your database name (e.g., 'OccupationManagerDB')
    options: {
        encrypt: true,                  // Required for Azure SQL Database
        trustServerCertificate: false   // Set to true for local development with self-signed certs, false for production
    }
};

let pool; // Connection pool to reuse connections

/**
 * Establishes and returns a connection pool to the SQL database.
 * If a pool already exists and is connected, it returns the existing one.
 * @returns {Promise<sql.ConnectionPool>} A promise that resolves to the SQL connection pool.
 */
async function getConnection() {
    if (pool && pool.connected) {
        return pool;
    }
    try {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        console.log('SQL Connected successfully.');
        return pool;
    } catch (err) {
        console.error('SQL Connection Failed:', err.message);
        // It's crucial to throw the error so the calling function can handle it.
        throw err;
    }
}

module.exports = { getConnection, sql };
