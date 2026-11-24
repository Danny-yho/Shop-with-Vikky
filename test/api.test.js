process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const databaseUrl = process.env.DATABASE_URL || '';
const safeDatabase = /localhost|127\.0\.0\.1/.test(databaseUrl) || process.env.ALLOW_TEST_DB === '1';

test('public catalog, order pricing, CSRF, and admin authentication', {
  skip: safeDatabase ? false : 'Set DATABASE_URL to a local Postgres database, or ALLOW_TEST_DB=1, to run API tests'
}, async () => {
  const app = require('../server/app');
  const db = require('../server/db');
  await db.initDb();
  await db.query('TRUNCATE TABLE order_items, orders, products, categories, contacts, newsletter_subscribers, settings, users RESTART IDENTITY CASCADE');
  const category = await db.one('INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id', ['Test', 'test']);
  await db.query(`INSERT INTO products
    (category_id, name, slug, description, price, stock, active, featured, sizes, colors)
    VALUES ($1, $2, $3, $4, $5, $6, 1, 1, $7, $8)`,
  [category.id, 'Test bag', 'test-bag', '', 15000, 5, '["M","L"]', '["Purple"]']);
  await db.query("INSERT INTO settings (key, value) VALUES ('shipping_fee', '500')");
  await db.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
    ['Admin', 'admin@test.local', bcrypt.hashSync('SufficientTestPass!1', 4)]);

  try {
    const health = await request(app).get('/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.status, 'ok');

    const catalog = await request(app).get('/api/products');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.body.products[0].price, 15000);
    assert.deepEqual(catalog.body.products[0].sizes, ['M', 'L']);
    const filtered = await request(app).get('/api/products?category=Test&size=M&minPrice=10000&maxPrice=20000&sort=price-asc');
    assert.equal(filtered.body.pagination.total, 1);

    const newsletter = await request(app).post('/api/newsletter').send({ email: 'shopper@example.com' });
    assert.equal(newsletter.status, 201);

    const agent = request.agent(app);
    const csrf = await agent.get('/api/auth/csrf');
    assert.equal(csrf.status, 200);
    const token = csrf.body.csrfToken;
    const login = await agent.post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'SufficientTestPass!1' });
    assert.equal(login.status, 200);
    assert.match(login.headers['set-cookie'].join(';'), /shop_auth=.*HttpOnly/);

    const order = await agent.post('/api/orders')
      .set('X-CSRF-Token', token)
      .send({
        customer: {
          fullName: 'Test Shopper',
          email: 'shopper@example.com',
          phone: '+2348012345678',
          address: '12 Test Street, Lagos',
          state: 'Lagos'
        },
        paymentMethod: 'bank',
        items: [{ productId: 1, quantity: 2, size: 'M', color: 'Purple' }],
        total: 1,
        price: 1
      });
    assert.equal(order.status, 201);
    assert.equal(order.body.order.total, 30500);
    assert.equal(order.body.order.items[0].unitPrice, 15000);
    assert.equal(order.body.order.items[0].size, 'M');

    const invalidVariant = await agent.post('/api/orders')
      .set('X-CSRF-Token', token)
      .send({
        customer: { fullName: 'Test Shopper', email: 'shopper@example.com', phone: '+2348012345678', address: '12 Test Street' },
        items: [{ productId: 1, quantity: 1, size: 'XS', color: 'Purple' }]
      });
    assert.equal(invalidVariant.status, 400);

    const tracking = await request(app).get(`/api/orders/track/${order.body.order.orderNumber}`);
    assert.equal(tracking.status, 200);
    assert.equal(tracking.body.order.total, 30500);

    const adminProducts = await agent.get('/api/admin/products');
    assert.equal(adminProducts.status, 200);

    const managedProduct = {
      categoryId: category.id,
      name: 'Admin Managed Dress',
      slug: 'admin-managed-dress',
      description: 'A dress managed from the admin panel.',
      price: 24000,
      compareAtPrice: 28000,
      imageUrl: '/images/admin-managed-dress.jpg',
      sizes: ['S', 'M'],
      colors: ['Violet'],
      stock: 6,
      active: true,
      featured: true,
      newArrival: true,
      bestSeller: false
    };
    const created = await agent.post('/api/admin/products').set('X-CSRF-Token', token).send(managedProduct);
    assert.equal(created.status, 201);
    const productId = created.body.product.id;
    const publicCatalog = await request(app).get('/api/products?search=Admin%20Managed%20Dress');
    assert.equal(publicCatalog.body.pagination.total, 1);
    assert.equal(publicCatalog.body.products[0].newArrival, true);

    const hidden = await agent.put(`/api/admin/products/${productId}`)
      .set('X-CSRF-Token', token)
      .send({ ...managedProduct, active: false, newArrival: false, bestSeller: true });
    assert.equal(hidden.status, 200);
    const hiddenCatalog = await request(app).get('/api/products?search=Admin%20Managed%20Dress');
    assert.equal(hiddenCatalog.body.pagination.total, 0);

    const deleted = await agent.delete(`/api/admin/products/${productId}`).set('X-CSRF-Token', token);
    assert.equal(deleted.status, 204);

    const rateLimitedRequests = await Promise.all(
      Array.from({ length: 305 }, () => request(app).get('/api/products?limit=1'))
    );
    assert.ok(rateLimitedRequests.some(response => response.status === 429));
    assert.equal(rateLimitedRequests.find(response => response.status === 429).body.error,
      'Too many API requests. Please try again shortly.');
    const staticAsset = await request(app).get('/js/app.js');
    assert.equal(staticAsset.status, 200);
  } finally {
    await db.close();
  }
});
