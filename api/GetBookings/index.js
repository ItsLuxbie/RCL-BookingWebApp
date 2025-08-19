// api/GetBookings/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('GetBookings function processed a request.');
    let pool;
    try {
        pool = await getConnection();
        // Select all booking fields, formatting dates to YYYY-MM-DD
        const result = await pool.request().query(`
            SELECT 
                Id, 
                GuestName, 
                Property, 
                CONVERT(NVARCHAR(10), ArrivalDate, 120) AS ArrivalDate, 
                CONVERT(NVARCHAR(10), DepartureDate, 120) AS DepartureDate, 
                ContactInfo, 
                Notes 
            FROM Bookings
        `);
        
        context.res = {
            status: 200,
            body: result.recordset // Return array of booking objects
        };
    } catch (err) {
        context.log.error('Error fetching bookings:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to fetch bookings.", error: err.message }
        };
    }
};
