// api/GetProperties/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GetProperties function processed a request.');
    let pool;
    try {
        pool = await getConnection();
        // Select property names, ordered alphabetically
        const result = await pool.request().query('SELECT Name FROM Properties ORDER BY Name');
        const properties = result.recordset.map(row => row.Name); // Extract just the names

        context.res = {
            status: 200,
            body: properties // Return array of strings
        };
    } catch (err) {
        context.log.error('Error fetching properties:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to fetch properties.", error: err.message }
        };
    }
    // Note: Connection pool is managed by db.js, no need to close here.
};
