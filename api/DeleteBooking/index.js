// api/DeleteBooking/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('DeleteBooking function processed a request.');
    // Get ID from query parameter for GET request (e.g., /api/DeleteBooking?id=123)
    const id = req.query.id; 

    if (!id) {
        context.res = { status: 400, body: { message: "Missing booking ID." } };
        return;
    }

    let pool;
    try {
        pool = await getConnection();
        
        // Delete the booking by its ID
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM Bookings
                WHERE Id = @id;
            `);

        if (result.rowsAffected[0] === 0) {
            context.res = { status: 404, body: { message: "Booking not found or already deleted." } };
            return;
        }

        context.res = {
            status: 200,
            body: { success: true, message: "Booking deleted successfully." }
        };
    } catch (err) {
        context.log.error('Error deleting booking:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to delete booking.", error: err.message }
        };
    }
};
