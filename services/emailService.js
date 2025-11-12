// services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Use createTransport (singular) instead of createTransporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify transporter configuration
    this.verifyTransporter();
  }

  async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log('✅ Email transporter is ready to send messages');
    } catch (error) {
      console.error('❌ Email transporter configuration error:', error);
    }
  }

  async sendRegistrationEmail(user, payment) {
    const mailOptions = {
      from: `"Registration System" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: 'Welcome - Registration Successful',
      html: this.getRegistrationEmailTemplate(user, payment)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Registration email sent to:', user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send registration email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmationEmail(user, payment) {
    const mailOptions = {
      from: `"Registration System" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: 'Payment Confirmation - Registration Complete',
      html: this.getPaymentConfirmationTemplate(user, payment)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Payment confirmation email sent to:', user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send payment confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentFailedEmail(user, payment) {
    const mailOptions = {
      from: `"Registration System" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: 'Payment Failed - Registration Incomplete',
      html: this.getPaymentFailedTemplate(user, payment)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Payment failed email sent to:', user.email);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send payment failed email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTestEmail(toEmail) {
    const mailOptions = {
      from: `"Test System" <${process.env.FROM_EMAIL}>`,
      to: toEmail,
      subject: 'Test Email from Registration System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from your User Registration System.</p>
          <p>If you're receiving this, email configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Test email sent to:', toEmail);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return { success: false, error: error.message };
    }
  }

  getRegistrationEmailTemplate(user, payment) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
          .details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Service! 🎉</h1>
            <p>Your registration was successful</p>
          </div>
          <div class="content">
            <p>Dear <strong>${user.firstName}${user.lastName}</strong>,</p>
            <p>Thank you for registering with us! Your account has been created successfully.</p>
            
            <div class="details">
              <h3>Registration Details:</h3>
              <p><strong>Name:</strong> ${user.firstName}${user.lastName}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Phone:</strong> ${user.phoneNumber}</p>
              <p><strong>Reference ID:</strong> ${payment.payment_reference}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>To complete your registration and activate your account, please proceed with the payment.</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br><strong>The Registration Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentConfirmationTemplate(user, payment) {
    const amount = (payment.amount / 100).toFixed(2);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .success-icon {
            font-size: 48px;
            margin: 20px 0;
          }
          .details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Confirmed!</h1>
            <p>Your registration is now complete</p>
          </div>
          <div class="content">
            <p>Dear <strong>${user.firstName}${user.lastName}</strong>,</p>
            <p>Great news! Your payment has been confirmed and your account is now fully activated.</p>
            
            <div class="details">
              <h3>Payment Details:</h3>
              <p><strong>Amount Paid:</strong> <span class="amount">$${amount}</span></p>
              <p><strong>Payment Reference:</strong> ${payment.payment_reference}</p>
              <p><strong>Transaction ID:</strong> ${payment.smepayTransactionId || 'N/A'}</p>
              <p><strong>Payment Date:</strong> ${new Date(payment.completedAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Completed</span></p>
            </div>

            <p>You now have full access to all features of our service. Welcome aboard!</p>
            
            <p>Thank you for choosing us. We're excited to have you as a member!</p>
            
            <p>Best regards,<br><strong>The Registration Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentFailedTemplate(user, payment) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .content { 
            padding: 30px; 
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .warning-icon {
            font-size: 48px;
            margin: 20px 0;
          }
          .details {
            background: #ffebee;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #f44336;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #f44336;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Payment Failed</h1>
            <p>Your registration is incomplete</p>
          </div>
          <div class="content">
            <p>Dear <strong>${user.firstName}${user.lastName}</strong>,</p>
            <p>We were unable to process your payment. Your registration remains incomplete.</p>
            
            <div class="details">
              <h3>Payment Details:</h3>
              <p><strong>Reference:</strong> ${payment.payment_reference}</p>
              <p><strong>Failure Reason:</strong> ${payment.failureReason || 'Payment processing failed'}</p>
              <p><strong>Attempt Date:</strong> ${new Date(payment.initiatedAt).toLocaleDateString()}</p>
            </div>

            <p><strong>What to do next:</strong></p>
            <ul>
              <li>Check your payment method details</li>
              <li>Ensure sufficient funds are available</li>
              <li>Try the payment again</li>
              <li>Contact your bank if needed</li>
            </ul>

            <p>If you continue to experience issues, please contact our support team for assistance.</p>
            
            <p>Best regards,<br><strong>The Registration Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create and export instance
const emailService = new EmailService();
module.exports = emailService;