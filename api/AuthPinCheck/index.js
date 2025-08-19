// api/AuthPinCheck/index.js
module.exports = async function (context, req) {
    context.log('AuthPinCheck function processed a request.');

    const { pin, roleType } = req.body || {};

    // IMPORTANT: These PINs MUST be set as Application Settings (Environment Variables)
    // in your Azure Function App in the Azure Portal for security.
    // Example: MASTER_PIN = "your_secret_master_pin"
    // Example: VIEWER_PIN = "your_secret_viewer_pin"
    const MASTER_PIN = process.env.MASTER_PIN; 
    const VIEWER_PIN = process.env.VIEWER_PIN; 

    let success = false;
    let message = 'Invalid PIN.';
    let assignedRole = null;

    if (!pin || !roleType) {
        context.res = {
            status: 400,
            body: { success: false, message: 'PIN and roleType are required.' }
        };
        return;
    }

    if (roleType === 'master' && pin === MASTER_PIN) {
        success = true;
        assignedRole = 'master';
        message = 'Master login successful.';
    } else if (roleType === 'viewer' && pin === VIEWER_PIN) {
        success = true;
        assignedRole = 'viewer';
        message = 'Viewer login successful.';
    }

    context.res = {
        status: success ? 200 : 401, // 200 for success, 401 for unauthorized
        body: { success, message, role: assignedRole }
    };
};
