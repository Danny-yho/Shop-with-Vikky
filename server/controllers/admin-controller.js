const db = require('../db');
const { publicIdFromUrl, uploadBuffer, destroyImage } = require('../utils/cloudinary');

function productList(rows) {
  return rows.map((product) => ({
    ...product,
    sizes: JSON.parse(product.sizes || '[]'),
    colors: JSON.parse(product.colors || '[]'),
    active: Boolean(product.active),
    featured: Boolean(product.featured),
    newArrival: Boolean(product.new_arrival),
    bestSeller: Boolean(product.best_seller)
  }));
}

async function listProducts(req, res) {
  const rows = await db.many(`SELECT p.*, c.name AS category FROM products p
    LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC`);
  res.json({ products: productList(rows) });
}

async function createProduct(req, res) {
  const imageUrl = req.body.imageUrl || '';
  const product = await db.one(`INSERT INTO products
    (category_id, name, slug, description, price, compare_at_price, image_url, image_public_id, sizes, colors,
     stock, active, featured, new_arrival, best_seller)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`, [
    req.body.categoryId,
    req.body.name,
    req.body.slug,
    req.body.description,
    req.body.price,
    req.body.compareAtPrice,
    imageUrl,
    publicIdFromUrl(imageUrl),
    JSON.stringify(req.body.sizes),
    JSON.stringify(req.body.colors),
    req.body.stock,
    Number(req.body.active),
    Number(req.body.featured),
    Number(req.body.newArrival),
    Number(req.body.bestSeller)
  ]);
  res.status(201).json({ product });
}

async function updateProduct(req, res) {
  const existing = await db.one('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const imageUrl = req.body.imageUrl === undefined ? existing.image_url : req.body.imageUrl;
  const fields = [
    req.body.categoryId === undefined ? existing.category_id : req.body.categoryId,
    req.body.name,
    req.body.slug,
    req.body.description,
    req.body.price,
    req.body.compareAtPrice === undefined ? existing.compare_at_price : req.body.compareAtPrice,
    imageUrl,
    publicIdFromUrl(imageUrl),
    JSON.stringify(req.body.sizes === undefined ? JSON.parse(existing.sizes || '[]') : req.body.sizes),
    JSON.stringify(req.body.colors === undefined ? JSON.parse(existing.colors || '[]') : req.body.colors),
    req.body.stock,
    Number(req.body.active === undefined ? Boolean(existing.active) : req.body.active),
    Number(req.body.featured === undefined ? Boolean(existing.featured) : req.body.featured),
    Number(req.body.newArrival === undefined ? Boolean(existing.new_arrival) : req.body.newArrival),
    Number(req.body.bestSeller === undefined ? Boolean(existing.best_seller) : req.body.bestSeller),
    existing.id
  ];
  const product = await db.one(`UPDATE products SET category_id=$1, name=$2, slug=$3, description=$4,
    price=$5, compare_at_price=$6, image_url=$7, image_public_id=$8, sizes=$9, colors=$10,
    stock=$11, active=$12, featured=$13, new_arrival=$14, best_seller=$15,
    updated_at=NOW() WHERE id=$16 RETURNING *`, fields);
  const previousPublicId = existing.image_public_id || publicIdFromUrl(existing.image_url);
  const nextPublicId = publicIdFromUrl(imageUrl);
  if (previousPublicId && previousPublicId !== nextPublicId) await destroyImage(previousPublicId);
  res.json({ product });
}

async function deleteProduct(req, res) {
  const existing = await db.one('SELECT id, image_url, image_public_id FROM products WHERE id=$1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  await db.query('DELETE FROM products WHERE id=$1', [existing.id]);
  await destroyImage(existing.image_public_id || publicIdFromUrl(existing.image_url));
  res.status(204).end();
}

async function listCategories(req, res) {
  res.json({ categories: await db.many('SELECT * FROM categories ORDER BY name') });
}

async function createCategory(req, res) {
  const category = await db.one(
    'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
    [req.body.name, req.body.slug, req.body.description]
  );
  res.status(201).json({ category });
}

async function updateCategory(req, res) {
  const category = await db.one(
    'UPDATE categories SET name=$1, slug=$2, description=$3 WHERE id=$4 RETURNING *',
    [req.body.name, req.body.slug, req.body.description, req.params.id]
  );
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category });
}

async function deleteCategory(req, res) {
  const result = await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Category not found' });
  res.status(204).end();
}

async function listOrders(req, res) {
  const orders = await db.many(`SELECT id, tracking_code AS "trackingCode", customer_name AS "customerName", email, phone, address, status, payment_status AS "paymentStatus", payment_reference AS "paymentReference", total, currency, created_at AS "createdAt" FROM orders ORDER BY created_at DESC LIMIT 200`);
  res.json({ orders });
}

async function updateOrder(req, res) {
  const order = await db.one('SELECT id, status, inventory_restored FROM orders WHERE id=$1', [req.params.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
    return res.status(409).json({ error: 'Cancelled orders cannot be reopened' });
  }
  await db.withTransaction(async (tx) => {
    if (req.body.status === 'cancelled' && !order.inventory_restored) {
      await tx.query(`UPDATE products SET stock=products.stock+oi.quantity, updated_at=NOW()
        FROM order_items oi WHERE products.id=oi.product_id AND oi.order_id=$1`, [order.id]);
      await tx.query('UPDATE orders SET inventory_restored=1 WHERE id=$1', [order.id]);
    }
    await tx.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', [req.body.status, order.id]);
  });
  const updated = await db.one('SELECT id, tracking_code AS "trackingCode", status, payment_status AS "paymentStatus" FROM orders WHERE id=$1', [order.id]);
  res.json({ order: updated });
}

async function listSettings(req, res) {
  res.json({ settings: await db.many('SELECT key, value FROM settings ORDER BY key') });
}

async function updateSettings(req, res) {
  await db.withTransaction(async (tx) => {
    for (const [key, value] of Object.entries(req.body)) {
      await tx.query(`INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`, [key, String(value)]);
    }
  });
  res.json({ settings: await db.many('SELECT key, value FROM settings ORDER BY key') });
}

async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  const result = await uploadBuffer(req.file.buffer);
  res.status(201).json({ url: result.secure_url, publicId: result.public_id });
}

async function listMessages(req, res) {
  res.json({
    contacts: await db.many('SELECT id, name, email, subject, message, created_at AS "createdAt" FROM contacts ORDER BY created_at DESC'),
    subscribers: await db.many('SELECT id, email, created_at AS "createdAt" FROM newsletter_subscribers ORDER BY created_at DESC')
  });
}

module.exports = {
  listProducts, createProduct, updateProduct, deleteProduct, listCategories, createCategory,
  updateCategory, deleteCategory, listOrders, updateOrder, listSettings, updateSettings, uploadImage, listMessages
};
