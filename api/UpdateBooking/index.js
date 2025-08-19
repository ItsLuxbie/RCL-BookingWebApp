// api/UpdateBooking/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('UpdateBooking function processed a request.');
    // Destructure expected fields from the request body
    const { id, guestName, property, arrivalDate, departureDate, contactInfo, notes } = req.body;

    // Basic input validation
    if (!id || !guestName || !property || !arrivalDate || !departureDate) {
        context.res = { status: 400, body: { message: "Missing required fields (id, guestName, property, arrivalDate, departureDate)." } };
        return;
    }

    let pool;
    try {
        pool = await getConnection();

        // Server-side conflict check: Ensure updated dates don't overlap with other existing bookings
        const conflictCheck = await pool.request()
            .input('id', sql.Int, id) // Exclude the current booking itself from the conflict check
            .input('property', sql.NVarChar, property)
            .input('newArrival', sql.Date, arrivalDate)
            .input('newDeparture', sql.Date, departureDate)
            .query(`
                SELECT COUNT(*) AS ConflictCount
                FROM Bookings
                WHERE Property = @property
                AND Id <> @id 
                AND @newArrival < DepartureDate
                AND @newDeparture > ArrivalDate;
            `);

        if (conflictCheck.recordset[0].ConflictCount > 0) {
            context.res = { status: 409, body: { message: "Conflict: Updated dates overlap with an existing booking for this property." } };
            return;
        }
        
        // Update the existing booking record
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('guestName', sql.NVarChar, guestName)
            .input('property', sql.NVarChar, property)
            .input('arrivalDate', sql.Date, arrivalDate)
            .input('departureDate', sql.Date, departureDate)
            .input('contactInfo', sql.NVarChar, contactInfo || null)
            .input('notes', sql.NVarChar, notes || null)
            .query(`
                UPDATE Bookings
                SET GuestName = @guestName,
                    Property = @property,
                    ArrivalDate = @arrivalDate,
                    DepartureDate = @departureDate,
                    ContactInfo = @contactInfo,
                    Notes = @notes
                WHERE Id = @id;
            `);

        if (result.rowsAffected[0] === 0) {
            context.res = { status: 404, body: { message: "Booking not found or no changes made." } };
            return;
        }

        context.res = {
            status: 200,
            body: { success: true, message: "Booking updated successfully." }
        };
    } catch (err) {
        context.log.error('Error updating booking:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to update booking.", error: err.message }
        };
    }
};
