/**
 * Email Service - Placeholder for MVP
 * TODO: Integrate with actual email provider (SendGrid, Mailgun, etc.)
 */

const { config } = require('../config');

const sendOrderConfirmation = async (order) => {
  console.log('📧 [EMAIL] Order Confirmation');
  console.log(`   To: ${order.checkoutData.email}`);
  console.log(`   Order Number: ${order.orderNumber}`);
  console.log(`   Total: ₦${(order.totalAmount / 100).toLocaleString()}`);
  console.log(`   Items: ${order.items.length} item(s)`);
  
  // TODO: Implement actual email sending
  return true;
};

const sendPaymentReceipt = async (order, payment) => {
  console.log('📧 [EMAIL] Payment Receipt');
  console.log(`   To: ${order.checkoutData.email}`);
  console.log(`   Order Number: ${order.orderNumber}`);
  console.log(`   Payment Ref: ${payment.reference}`);
  console.log(`   Amount Paid: ₦${(payment.amount / 100).toLocaleString()}`);
  
  // TODO: Implement actual email sending
  return true;
};

const sendAdminNotification = async (order) => {
  console.log('📧 [EMAIL] Admin Notification - New Order');
  console.log(`   To: ${config.admin.email}`);
  console.log(`   Order Number: ${order.orderNumber}`);
  console.log(`   Customer: ${order.checkoutData.name}`);
  console.log(`   Total: ₦${(order.totalAmount / 100).toLocaleString()}`);
  
  // TODO: Implement actual email sending
  return true;
};

const sendDispatchNotification = async (order) => {
  console.log('📧 [EMAIL] Dispatch Notification');
  console.log(`   To: ${order.checkoutData.email}`);
  console.log(`   Order Number: ${order.orderNumber}`);
  console.log(`   Status: Your order has been shipped!`);
  
  // TODO: Implement actual email sending
  return true;
};

module.exports = {
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendAdminNotification,
  sendDispatchNotification,
};
