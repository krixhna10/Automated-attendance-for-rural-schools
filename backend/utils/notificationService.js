/**
 * Notification Service
 * Utility for sending emails and notifications
 */

const nodemailer = require('nodemailer');

// Create a transporter using ethereal email or real credentials
const createTransporter = () => {
    // If real credentials are provided in environment, use them
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: 'gmail', // or your preferred email service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Fallback for development: Use NodeMailer's built-in Ethereal helper
    // Note: Ethereal creates ephemeral test accounts. You can view the sent emails in the console link.
    console.warn('⚠️ No EMAIL_USER or EMAIL_PASS found in environment. Using test Ethereal account, emails will NOT be actually delivered but you can view them via a generated link in the console.');

    // Create a generic transporter (we will configure it per-request if using ethereal dynamically, 
    // but for simplicity, we mock a basic setup here if auth is missing)
    return null; // Handled dynamically in the send function for Ethereal
};

let transporterCache = createTransporter();

const getTransporter = async () => {
    if (transporterCache) return transporterCache;

    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    transporterCache = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    console.log(`✉️ Test Email Account Created: ${testAccount.user}`);
    return transporterCache;
};

/**
 * Send an absence notification email
 * @param {string} studentName The name of the student
 * @param {string} studentEmail The email of the student (or parent)
 * @param {Date} date The date of absence
 */
exports.sendAbsenceEmail = async (studentName, studentEmail, date) => {
    try {
        if (!studentEmail) {
            console.log(`Skipping email for ${studentName}: No email address on file.`);
            return false;
        }

        const transporter = await getTransporter();
        const formattedDate = new Date(date).toLocaleDateString();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Attendance System" <noreply@attendancesystem.com>',
            to: studentEmail,
            subject: `Absence Notification - ${formattedDate}`,
            text: `Dear ${studentName},\n\nYou have been marked absent for today (${formattedDate}).\n\nIf you have any questions or this is an error, please contact the administration.\n\nBest regards,\nSchool Administration`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d9534f;">Absence Notification</h2>
                    <p>Dear <strong>${studentName}</strong>,</p>
                    <p>You have been marked absent for today (<strong>${formattedDate}</strong>).</p>
                    <p>If you have any questions or believe this is an error, please contact the administration immediately.</p>
                    <br>
                    <p>Best regards,<br>School Administration</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Absence email sent to ${studentEmail}`);

        if (!process.env.EMAIL_USER) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
