// // src/lib/utils/mailer.ts - Modified version

// import nodemailer from 'nodemailer';

// // Log environment variables for debugging (remove in production)
// console.log("Email config check:", {
//   userExists: !!process.env.GMAIL_USER,
//   passExists: !!process.env.GMAIL_PASS
// });

// // Create a more explicit transporter configuration
// export const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false // For development purposes only - remove in production
//   }
// });

// // Verify the connection configuration
// transporter.verify(function(error, success) {
//   if (error) {
//     console.log("SMTP verification failed:", error);
//   } else {
//     console.log("SMTP server is ready to take our messages");
//   }
// });


// src/lib/utils/mailer.ts - TEMPORARY for debugging only
import nodemailer from 'nodemailer';

console.log("Email config check with hardcoded values for testing");

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    // TEMPORARY! Remove before committing to production
    user: "donorlink67@gmail.com",  // Replace with your actual value
    pass: "fhnbvdafchxhpzuw",       // Replace with your actual value
  }
});