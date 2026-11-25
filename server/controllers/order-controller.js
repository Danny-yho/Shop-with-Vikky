const crypto = require('crypto');
const db = require('../db');
const { sendOrderConfirmation } = require('../utils/email');

async function settingAmount(tx, key, fallback) {
  const row = await tx.one('SELECT value FROM settings WHERE key=$1', [key]);
  const value = Number(row?.value);
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

async function createOrder(input) {
  return db.withTransaction(async (tx) => {
    const lines = [];
    for (const item of input.items) {
      const product = await tx.one('SELECT id, name, price, stock, sizes, colors FROM products WHERE id=$1 AND active=1', [item.productId]);
      if (!product) throw Object.assign(new Error(`Product ${item.productId} is unavailable`), { status: 400 });
      const sizes = JSON.parse(product.sizes || '[]');
      const colors = JSON.parse(product.colors || '[]');
      if ((sizes.length && !sizes.includes(item.size)) || (colors.length && !colors.includes(item.color))) {
        throw Object.assign(new Error(`Choose an available size and color for ${product.name}`), { status: 400 });
      }
      lines.push({ ...product, quantity: item.quantity, size: item.size || '', color: item.color || '', lineTotal: product.price * item.quantity });
    }
    const requestedByProduct = new Map();
    lines.forEach((item) => requestedByProduct.set(item.id, (requestedByProduct.get(item.id) || 0) + item.quantity));
    for (const [productId, quantity] of requestedByProduct) {
      const product = await tx.one('SELECT id, name, stock FROM products WHERE id=$1 AND active=1', [productId]);
      if (product.stock < quantity) throw Object.assign(new Error(`${product.name} does not have enough stock`), { status: 409 });
    }
    const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
    const threshold = await settingAmount(tx, 'free_delivery_threshold', 50000);
    const stateKey = `delivery_fee_${String(input.state || '').toLowerCase().replace(/[^a-z]/g, '')}`;
    const shipping = subtotal >= threshold ? 0 : await settingAmount(tx, stateKey,
      await settingAmount(tx, 'delivery_fee_default', await settingAmount(tx, 'shipping_fee', 5500)));
    const total = subtotal + shipping;
    if (!Number.isSafeInteger(total)) throw Object.assign(new Error('Order total is invalid'), { status: 400 });
    const trackingCode = crypto.randomBytes(9).toString('hex').toUpperCase();
    const order = await tx.one(`INSERT INTO orders
      (tracking_code, customer_name, email, phone, address, total, currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [
      trackingCode, input.name, input.email, input.phone, input.address, total, 'NGN'
    ]);
    for (const item of lines) {
      await tx.query(`INSERT INTO order_items
        (order_id, product_id, product_name, unit_price, quantity, line_total, selected_size, selected_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
        order.id, item.id, item.name, item.price, item.quantity, item.lineTotal, item.size, item.color
      ]);
      await tx.query('UPDATE products SET stock=stock-$1, updated_at=NOW() WHERE id=$2', [item.quantity, item.id]);
    }
    return {
      orderId: order.id, trackingCode, subtotal, deliveryFee: shipping, total, currency: 'NGN',
      items: lines.map((item) => ({
        productId: item.id, name: item.name, unitPrice: item.price, quantity: item.quantity,
        size: item.size, color: item.color, lineTotal: item.lineTotal
      }))
    };
  });
}

async function submitOrder(req, res) {
  const input = {
    name: req.body.customer.fullName,
    email: req.body.customer.email,
    phone: req.body.customer.phone,
    address: `${req.body.customer.address}${req.body.customer.state ? `, ${req.body.customer.state}` : ''}${req.body.customer.notes ? ` | Note: ${req.body.customer.notes}` : ''}`,
    state: req.body.customer.state,
    items: req.body.items
  };
  const order = await createOrder(input);
  sendOrderConfirmation(order, input.email).catch(() => {});
  res.status(201).json({
    order: {
      orderNumber: order.trackingCode, subtotal: order.subtotal, deliveryFee: order.deliveryFee,
      total: order.total, currency: order.currency, items: order.items
    }
  });
}

async function trackOrder(req, res) {
  const order = await db.one(`SELECT tracking_code AS "trackingCode", status, payment_status AS "paymentStatus",
    total, currency, created_at AS "createdAt" FROM orders WHERE tracking_code=$1`, [req.params.trackingCode]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = await db.many(`SELECT product_name AS name, unit_price AS "unitPrice", quantity, line_total AS "lineTotal",
      selected_size AS size, selected_color AS color
    FROM order_items WHERE order_id=(SELECT id FROM orders WHERE tracking_code=$1)`, [req.params.trackingCode]);
  res.json({ order: { ...order, items } });
}

module.exports = { submitOrder, trackOrder };
