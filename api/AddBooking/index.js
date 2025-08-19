// api/AddBooking/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('AddBooking function processed a request.');
    // Destructure expected fields from the request body
    const { guestName, property, arrivalDate, departureDate, contactInfo, notes } = req.body;

    // Basic input validation
    if (!guestName || !property || !arrivalDate || !departureDate) {
        context.res = { status: 400, body: { message: "Missing required fields (guestName, property, arrivalDate, departureDate)." } };
        return;
    }

    let pool;
    try {
        pool = await getConnection();
        
        // Server-side conflict check: Ensure new booking dates don't overlap with existing ones for the same property
        const conflictCheck = await pool.request()
            .input('property', sql.NVarChar, property)
            .input('newArrival', sql.Date, arrivalDate)
            .input('newDeparture', sql.Date, departureDate)
            .query(`
                SELECT COUNT(*) AS ConflictCount
                FROM Bookings
                WHERE Property = @property
                AND @newArrival < DepartureDate
                AND @newDeparture > ArrivalDate;
            `);

        if (conflictCheck.recordset[0].ConflictCount > 0) {
            context.res = { status: 409, body: { message: "Conflict: Dates overlap with an existing booking for this property." } };
            return;
        }

        // Insert the new booking into the Bookings table
        const result = await pool.request()
            .input('guestName', sql.NVarChar, guestName)
            .input('property', sql.NVarChar, property)
            .input('arrivalDate', sql.Date, arrivalDate)
            .input('departureDate', sql.Date, departureDate)
            .input('contactInfo', sql.NVarChar, contactInfo || null) // Use null for empty strings
            .input('notes', sql.NVarChar, notes || null) // Use null for empty strings
            .query(`
                INSERT INTO Bookings (GuestName, Property, ArrivalDate, DepartureDate, ContactInfo, Notes)
                OUTPUT INSERTED.Id -- Return the ID of the newly inserted row
                VALUES (@guestName, @property, @arrivalDate, @departureDate, @contactInfo, @notes);
            `);

        context.res = {
            status: 201, // 201 Created
            body: { success: true, id: result.recordset[0].Id, message: "Booking added successfully." }
        };
    } catch (err) {
        context.log.error('Error adding booking:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to add booking.", error: err.message }
        };
    }
};
