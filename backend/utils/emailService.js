// Email Service for Purchase Notifications
const nodemailer = require('nodemailer');
const path = require('path');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send free PDF to user email
const sendFreePdfEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"BullBear Trading" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Your Free PDF: 5-Step Crypto Quickstart Checklist`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: linear-gradient(135deg, #06b6d4 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
            .steps { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .step { display: flex; align-items: center; margin: 10px 0; }
            .step-num { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Your Free PDF is Here!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Thank you for signing up with BullBear Trading! Your free <strong>5-Step Crypto Quickstart Checklist</strong> is attached to this email.</p>
              
              <div class="highlight">
                <h3>🎁 Check Your Attachment!</h3>
                <p>The PDF is attached below. Save it for future reference!</p>
              </div>
              
              <div class="steps">
                <h3>What's Inside:</h3>
                <div class="step"><span class="step-num">1</span> Choose Your Exchange</div>
                <div class="step"><span class="step-num">2</span> Secure Your Wallet</div>
                <div class="step"><span class="step-num">3</span> Fund Your Account</div>
                <div class="step"><span class="step-num">4</span> Make Your First Trade</div>
                <div class="step"><span class="step-num">5</span> Manage & Grow</div>
              </div>
              
              <p>Ready to take your crypto journey further? Check out our premium courses:</p>
              <a href="${process.env.FRONTEND_URL || 'https://bullbeartrading.com'}" class="button">
                Explore Our Courses
              </a>
              
              <p>If you have any questions, feel free to reach out!</p>
            </div>
            <div class="footer">
              <p>© 2026 BullBear Trading. All rights reserved.</p>
              <p>Master the Markets</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: '5-Step-Crypto-Quickstart-Checklist.pdf',
          path: path.join(__dirname, '../../crypto-quickstart-checklist.pdf')
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('Free PDF email sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending PDF email:', error);
    return { success: false, error: error.message };
  }
};

// Send purchase confirmation email
const sendPurchaseConfirmation = async (userEmail, userName, courseName, orderId) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"BullBear Trading" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Purchase Confirmation - ${courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Purchase Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Thank you for your purchase! Your order has been confirmed.</p>
              
              <h3>Order Details:</h3>
              <ul>
                <li><strong>Course:</strong> ${courseName}</li>
                <li><strong>Order ID:</strong> ${orderId}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              
              <p>You can now access your course in your library:</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-library.html" class="button">
                Access My Library
              </a>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© 2026 Bull Bear Trading. All rights reserved.</p>
              <p>Contact: support@metahubvoice.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Purchase confirmation email sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"BullBear Trading" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reset Your BullBear Trading Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Reset Your Password</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'},</h2>
              <p>We received a request to reset your BullBear Trading password. Click the button below to set a new one:</p>

              <a href="${resetUrl}" class="button">Reset Password</a>

              <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
            </div>
            <div class="footer">
              <p>© 2026 BullBear Trading. All rights reserved.</p>
              <p>Master the Markets</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send admin notification
const sendAdminNotification = async (userName, userEmail, courseName, amount, orderId) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"BullBear Trading System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New Purchase Alert - ${courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert { background: #06b6d4; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 New Purchase Notification</h2>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Action Required:</strong> Verify payment and approve access
              </div>
              
              <h3>Purchase Details:</h3>
              <ul>
                <li><strong>Customer:</strong> ${userName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                <li><strong>Course:</strong> ${courseName}</li>
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Order ID:</strong> ${orderId}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              
              <p>Please verify the PayPal payment and approve access in the admin dashboard.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Admin notification sent');
    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPurchaseConfirmation,
  sendAdminNotification,
  sendFreePdfEmail,
  sendPasswordResetEmail
};
