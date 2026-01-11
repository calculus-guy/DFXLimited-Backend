/**
 * Simple email test script
 * Run: node src/scripts/testEmail.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // Brevo uses STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const testEmail = async () => {
  console.log('📧 Testing email configuration...');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log('');

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    const info = await transporter.sendMail({
      from: `"DFX Limited" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: 'sakariyauabdullateef993@gmail.com',
      subject: 'DFX Email Test ✅',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px;">
          <h2 style="color: #2563eb;">Email Test Successful! 🎉</h2>
          <p>This is a test email from DFX Limited backend.</p>
          <p>If you received this, your email configuration is working correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent from: ${process.env.EMAIL_FROM_ADDRESS}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log('\n📬 Check sakariyauabdullateef993@gmail.com inbox');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Check your SMTP_USER and SMTP_PASS');
    }
    if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check SMTP_HOST and SMTP_PORT');
    }
  }

  process.exit(0);
};

testEmail();
