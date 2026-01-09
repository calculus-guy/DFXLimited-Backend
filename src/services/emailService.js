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

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendAdminNotification,
  sendDispatchNotification,
};
