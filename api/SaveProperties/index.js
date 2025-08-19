// api/SaveProperties/index.js
const { getConnection, sql } = require('../shared/db');

module.exports = async function (context, req) {
    context.log('SaveProperties function processed a request.');
    const newProperties = req.body.properties; // Expects an array of property names

    if (!Array.isArray(newProperties)) {
        context.res = { status: 400, body: { message: "Invalid input. 'properties' must be an array of strings." } };
        return;
    }

    let pool;
    try {
        pool = await getConnection();
        const transaction = new sql.Transaction(pool); // Use a transaction for atomicity
        await transaction.begin();

        try {
            // Get existing properties from the database
            const existingPropertiesResult = await transaction.request().query('SELECT Name FROM Properties');
            const existingProperties = new Set(existingPropertiesResult.recordset.map(row => row.Name));

            // Determine which properties need to be added or removed
            const propertiesToAdd = newProperties.filter(p => !existingProperties.has(p));
            const propertiesToRemove = Array.from(existingProperties).filter(p => !newProperties.includes(p));

            // Delete properties that are no longer in the new list
            if (propertiesToRemove.length > 0) {
                // SQL Server requires parameters for IN clause
                const deletePropertiesRequest = transaction.request();
                const propertyPlaceholders = propertiesToRemove.map((p, i) => `@name${i}`).join(',');
                propertiesToRemove.forEach((p, i) => deletePropertiesRequest.input(`name${i}`, sql.NVarChar, p));
                
                // Due to ON DELETE CASCADE on the FK, deleting properties will automatically delete related bookings.
                await deletePropertiesRequest.query(`DELETE FROM Properties WHERE Name IN (${propertyPlaceholders})`);
            }

            // Add new properties
            for (const propName of propertiesToAdd) {
                await transaction.request()
                    .input('name', sql.NVarChar, propName)
                    .query('INSERT INTO Properties (Name) VALUES (@name)');
            }

            await transaction.commit(); // Commit the transaction if all operations succeed
            context.res = { status: 200, body: { success: true, message: "Properties saved successfully." } };

        } catch (innerErr) {
            await transaction.rollback(); // Rollback if any operation fails
            throw innerErr; // Re-throw to be caught by outer try-catch
        }

    } catch (err) {
        context.log.error('Error saving properties:', err);
        context.res = {
            status: 500,
            body: { message: "Failed to save properties.", error: err.message }
        };
    }
};
