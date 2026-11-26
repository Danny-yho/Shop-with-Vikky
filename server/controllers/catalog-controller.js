const db = require('../db');

function parseList(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function publicProduct(product) {
  return {
    ...product,
    images: product.imageUrl ? [product.imageUrl] : [],
    sizes: parseList(product.sizes),
    colors: parseList(product.colors),
    featured: Boolean(product.featured),
    newArrival: Boolean(product.newArrival),
    bestSeller: Boolean(product.bestSeller)
  };
}

async function listProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
  const conditions = ['p.active = 1'];
  const params = [];
  if (req.query.category) {
    params.push(req.query.category, req.query.category);
    conditions.push(`(c.slug = $${params.length - 1} OR LOWER(c.name) = LOWER($${params.length}))`);
  }
  if (req.query.search) {
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    conditions.push(`(p.name ILIKE $${params.length - 1} OR p.description ILIKE $${params.length})`);
  }
  const minPrice = Number(req.query.minPrice);
  if (req.query.minPrice !== undefined && Number.isFinite(minPrice) && minPrice >= 0) {
    params.push(minPrice);
    conditions.push(`p.price >= $${params.length}`);
  }
  const maxPrice = Number(req.query.maxPrice);
  if (req.query.maxPrice !== undefined && Number.isFinite(maxPrice) && maxPrice >= 0) {
    params.push(maxPrice);
    conditions.push(`p.price <= $${params.length}`);
  }
  if (req.query.size) {
    params.push(String(req.query.size).slice(0, 20));
    conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(CASE WHEN left(p.sizes, 1) = '[' THEN p.sizes::jsonb ELSE '[]'::jsonb END) AS matching_size(value) WHERE matching_size.value = $${params.length})`);
  }
  const where = conditions.join(' AND ');
  const sortBy = {
    newest: 'p.created_at DESC',
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC'
  }[req.query.sort] || 'p.featured DESC, p.created_at DESC';
  const totalRow = await db.one(`SELECT COUNT(*)::int AS count FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where}`, params);
  const products = await db.many(`SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price AS "compareAtPrice",
    p.image_url AS "imageUrl", p.sizes, p.colors, p.stock, p.featured, p.new_arrival AS "newArrival",
    p.best_seller AS "bestSeller", c.name AS category, c.slug AS "categorySlug"
    FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where}
    ORDER BY ${sortBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, (page - 1) * limit]);
  const total = totalRow.count;
  res.json({ products: products.map(publicProduct), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getProduct(req, res) {
  const product = await db.one(`SELECT p.id, p.name, p.slug, p.description, p.price,
    p.compare_at_price AS "compareAtPrice", p.image_url AS "imageUrl", p.sizes, p.colors,
    p.stock, p.featured, p.new_arrival AS "newArrival", p.best_seller AS "bestSeller",
    c.name AS category, c.slug AS "categorySlug" FROM products p LEFT JOIN categories c ON c.id=p.category_id
    WHERE p.active=1 AND (p.slug=$1 OR CAST(p.id AS TEXT)=$2)`, [req.params.slug, req.params.slug]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: publicProduct(product) });
}

async function listCategories(req, res) {
  const categories = await db.many(`SELECT c.id, c.name, c.slug, c.description, c.image_url AS "imageUrl", COUNT(p.id)::int AS "productCount"
    FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.active=1
    GROUP BY c.id ORDER BY c.name`);
  res.json({ categories });
}

async function publicSettings(req, res) {
  const allowed = [
    'store_name', 'currency', 'contact_email', 'shipping_fee', 'delivery_fee_default',
    'delivery_fee_lagos', 'free_delivery_threshold', 'announcement'
  ];
  const settings = await db.many(
    `SELECT key, value FROM settings WHERE key IN (${allowed.map((_, index) => `$${index + 1}`).join(',')})`,
    allowed
  );
  res.json({
    settings: {
      ...Object.fromEntries(settings.map(({ key, value }) => [key, value]))
    }
  });
}

module.exports = { listProducts, getProduct, listCategories, publicSettings };
