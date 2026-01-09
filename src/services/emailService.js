const nodemailer = require('nodemailer');
const { config } = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service connection failed:', error.message);
  } else {
    console.log('✅ Email service is ready');
  }
});

/**
 * Send email helper
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.address}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * Welcome email for new users
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to DFX Limited! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to DFX Limited!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>Thank you for joining DFX Limited! We're excited to have you on board.</p>
          <p>With your new account, you can:</p>
          <ul>
            <li>🎓 Enroll in our professional IT training courses</li>
            <li>📱 Shop for the latest gadgets and electronics</li>
            <li>💼 Explore our IT Solutions services</li>
          </ul>
          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, subject, html);
};

/**
 * Order confirmation email
 */
const sendOrderConfirmation = async (order) => {
  const subject = `Order Confirmed - ${order.orderNumber}`;
  
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${(item.subtotal / 100).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; padding: 10px; text-align: left; }
        .total { font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi ${order.checkoutData.name},</h2>
          <p>Thank you for your order! We've received your order and it's being processed.</p>
          
          <div class="order-info">
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>

          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p class="total" style="text-align: right; margin-top: 20px;">
            Total: ₦${(order.totalAmount / 100).toLocaleString()}
          </p>

          <div class="order-info">
            <h3>Delivery Address</h3>
            <p>${order.checkoutData.name}<br>
            ${order.checkoutData.address}<br>
            Phone: ${order.checkoutData.phone}</p>
          </div>

          <p>We'll send you another email once your order has been shipped.</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(order.checkoutData.email, subject, html);
};

/**
 * Payment receipt email
 */
const sendPaymentReceipt = async (order, payment) => {
  const subject = `Payment Received - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }
        .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Successful! ✅</h1>
        </div>
        <div class="content">
          <h2>Hi ${order.checkoutData.name},</h2>
          <p>Great news! We've received your payment for order <strong>${order.orderNumber}</strong>.</p>
          
          <div class="receipt-box">
            <h3>Payment Receipt</h3>
            <p><strong>Reference:</strong> ${payment.reference}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p class="amount">Amount Paid: ₦${(payment.amount / 100).toLocaleString()}</p>
          </div>

          <p>Your order is now being prepared for shipping. We'll notify you once it's on its way!</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(order.checkoutData.email, subject, html);
};

/**
 * Admin notification for new order
 */
const sendAdminNotification = async (order) => {
  const subject = `🛒 New Order - ${order.orderNumber}`;
  
  const itemsHtml = order.items.map(item => `
    <li>${item.productName} x ${item.quantity} - ₦${(item.subtotal / 100).toLocaleString()}</li>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .total { font-size: 20px; font-weight: bold; color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Received! 🛒</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>

          <div class="info-box">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.checkoutData.name}</p>
            <p><strong>Email:</strong> ${order.checkoutData.email}</p>
            <p><strong>Phone:</strong> ${order.checkoutData.phone}</p>
            <p><strong>Address:</strong> ${order.checkoutData.address}</p>
          </div>

          <div class="info-box">
            <h3>Items Ordered</h3>
            <ul>${itemsHtml}</ul>
            <p class="total">Total: ₦${(order.totalAmount / 100).toLocaleString()}</p>
          </div>

          <p>Please process this order as soon as possible.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(config.admin.email, subject, html);
};

/**
 * Dispatch/Shipping notification
 */
const sendDispatchNotification = async (order) => {
  const subject = `Your Order is On Its Way! - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .tracking-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .icon { font-size: 48px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Been Shipped! 🚚</h1>
        </div>
        <div class="content">
          <h2>Hi ${order.checkoutData.name},</h2>
          <p>Great news! Your order <strong>${order.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          <div class="tracking-box">
            <p class="icon">📦</p>
            <h3>Delivery Address</h3>
            <p>${order.checkoutData.address}</p>
          </div>

          <p>Our delivery team will contact you at <strong>${order.checkoutData.phone}</strong> when they arrive.</p>
          <p>Thank you for shopping with DFX Limited!</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(order.checkoutData.email, subject, html);
};

/**
 * Course registration confirmation email
 */
const sendCourseRegistrationConfirmation = async (registration, course, user) => {
  const subject = `Course Registration - ${course.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .course-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
        .price { font-size: 24px; font-weight: bold; color: #7c3aed; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Course Registration 🎓</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>You have successfully registered for the following course:</p>
          
          <div class="course-box">
            <h3>${course.title}</h3>
            <p>${course.description ? course.description.substring(0, 200) + '...' : ''}</p>
            ${course.duration ? `<p><strong>Duration:</strong> ${course.duration}</p>` : ''}
            <p class="price">Price: ₦${(course.price / 100).toLocaleString()}</p>
          </div>

          <p><strong>Status:</strong> ${registration.status}</p>
          <p>Please complete your payment to gain access to course materials.</p>
          
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, subject, html);
};

/**
 * Course payment receipt email
 */
const sendCoursePaymentReceipt = async (registration, course, payment) => {
  const user = registration.userId;
  const subject = `Payment Confirmed - ${course.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }
        .amount { font-size: 24px; font-weight: bold; color: #10b981; }
        .access-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Successful! ✅</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>Great news! Your payment for <strong>${course.title}</strong> has been confirmed.</p>
          
          <div class="receipt-box">
            <h3>Payment Receipt</h3>
            <p><strong>Reference:</strong> ${payment.reference}</p>
            <p><strong>Course:</strong> ${course.title}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p class="amount">Amount Paid: ₦${(payment.amount / 100).toLocaleString()}</p>
          </div>

          <div class="access-box">
            <h3>🎉 You're All Set!</h3>
            <p>You now have full access to course materials.</p>
            <p>Log in to your account to view and download materials.</p>
          </div>

          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, subject, html);
};

/**
 * New material notification for enrolled students
 */
const sendNewMaterialNotification = async (material, course, students) => {
  const subject = `New Material Available - ${course.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .material-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Course Material 📚</h1>
        </div>
        <div class="content">
          <h2>Hello,</h2>
          <p>A new material has been uploaded for <strong>${course.title}</strong>.</p>
          
          <div class="material-box">
            <h3>📄 ${material.title}</h3>
            <p><strong>Week:</strong> ${material.weekNumber}</p>
            ${material.label ? `<p><strong>Topic:</strong> ${material.label}</p>` : ''}
            <p><strong>Uploaded:</strong> ${new Date(material.createdAt).toLocaleDateString()}</p>
          </div>

          <p>Log in to your account to download this material.</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to all enrolled students
  const emailPromises = students.map(student => 
    sendEmail(student.userId.email, subject, html)
  );

  try {
    await Promise.all(emailPromises);
    console.log(`📧 New material notification sent to ${students.length} students`);
    return true;
  } catch (error) {
    console.error('Failed to send material notifications:', error.message);
    return false;
  }
};

/**
 * Admin notification for new course registration
 */
const sendAdminCourseRegistrationAlert = async (registration, course, user) => {
  const subject = `🎓 New Course Registration - ${course.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .amount { font-size: 20px; font-weight: bold; color: #7c3aed; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Course Registration! 🎓</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <h3>Course Details</h3>
            <p><strong>Course:</strong> ${course.title}</p>
            <p><strong>Registration Date:</strong> ${new Date(registration.registeredAt).toLocaleString()}</p>
            <p><strong>Status:</strong> ${registration.status}</p>
            <p class="amount">Amount: ₦${(course.price / 100).toLocaleString()}</p>
          </div>

          <div class="info-box">
            <h3>Student Information</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
          </div>

          <p>A new student has registered and paid for this course.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(config.admin.email, subject, html);
};

/**
 * Contact inquiry notification for admin
 */
const sendContactInquiryNotification = async (contact) => {
  const subject = `📩 New Contact Inquiry - ${contact.serviceTypeDisplay || 'General'}`;
  
  const serviceTypeDisplay = {
    'WEB_APP': 'Web Application',
    'MOBILE_APP': 'Mobile Application',
    'ERP': 'ERP System',
    'CUSTOM_SOFTWARE': 'Custom Software',
    'ECOMMERCE': 'E-commerce',
    'OTHER': 'Other'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #059669; }
        .message-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e5e7eb; }
        .label { font-weight: bold; color: #374151; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Inquiry 📩</h1>
        </div>
        <div class="content">
          <p>A new inquiry has been submitted through the contact form.</p>
          
          <div class="info-box">
            <h3>Contact Details</h3>
            <p><span class="label">Name:</span> ${contact.name}</p>
            <p><span class="label">Email:</span> ${contact.email}</p>
            ${contact.phone ? `<p><span class="label">Phone:</span> ${contact.phone}</p>` : ''}
            ${contact.company ? `<p><span class="label">Company:</span> ${contact.company}</p>` : ''}
            ${contact.serviceType ? `<p><span class="label">Service Type:</span> ${serviceTypeDisplay[contact.serviceType] || contact.serviceType}</p>` : ''}
          </div>

          <div class="message-box">
            <h3>Message</h3>
            <p>${contact.message.replace(/\n/g, '<br>')}</p>
          </div>

          <p><span class="label">Submitted:</span> ${new Date(contact.createdAt).toLocaleString()}</p>
          
          <p style="margin-top: 20px;">Please respond to this inquiry as soon as possible.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(config.admin.email, subject, html);
};

/**
 * Password reset OTP email
 */
const sendPasswordResetOtp = async (user, otp) => {
  const subject = 'Password Reset OTP - DFX Limited';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #dc2626; }
        .otp-code { font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 8px; }
        .warning { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request 🔐</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          <p>We received a request to reset your password. Use the OTP below to proceed:</p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #6b7280;">Your OTP Code</p>
            <p class="otp-code">${otp}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Valid for 15 minutes</p>
          </div>

          <div class="warning">
            <p style="margin: 0;"><strong> Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>

          <p>Do not share this OTP with anyone. DFX staff will never ask for your OTP.</p>
          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, subject, html);
};

/**
 * Password reset success confirmation email
 */
const sendPasswordResetSuccess = async (user) => {
  const subject = 'Password Changed Successfully - DFX Limited';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #10b981; }
        .warning { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed! </h1>
        </div>
        <div class="content">
          <h2>Hi ${user.name},</h2>
          
          <div class="success-box">
            <p style="font-size: 48px; margin: 0;">🔒</p>
            <h3 style="margin: 10px 0;">Your password has been successfully changed</h3>
            <p style="margin: 0; color: #6b7280;">Changed on: ${new Date().toLocaleString()}</p>
          </div>

          <p>You can now log in with your new password.</p>

          <div class="warning">
            <p style="margin: 0;"><strong> Didn't make this change?</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't change your password, please contact us immediately at ${config.admin.email}</p>
          </div>

          <p>Best regards,<br>The DFX Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DFX Limited. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendAdminNotification,
  sendDispatchNotification,
  sendCourseRegistrationConfirmation,
  sendCoursePaymentReceipt,
  sendNewMaterialNotification,
  sendAdminCourseRegistrationAlert,
  sendContactInquiryNotification,
  sendPasswordResetOtp,
  sendPasswordResetSuccess,
};
