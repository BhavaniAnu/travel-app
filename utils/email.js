const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter (service that actually sends an email)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: { 
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Bhavani N <hello@bhav.com>', // EMAIL coming from 
        to: options.email, // recipient email
        subject: options.subject,
        text: options.message,
    }

    // 3) Actually send the email
    await transporter.sendMail(mailOptions); // sendMail - sends an email using the preselected transport object
};

module.exports = sendEmail;