const router = require('express').Router();
const client = require('../config/cassandra');  // <— QUAN TRỌNG: đúng đường dẫn

// Lấy tất cả sản phẩm (Cassandra 3.x: LIMIT phải là literal)
router.get('/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '500', 10) || 500, 1000);
    const q = `
      SELECT product_id, name, category, price, image_url, status
      FROM products_by_id
      LIMIT ${limit}
    `;
    const rs = await client.execute(q); // không prepare cho LIMIT literal
    res.json({ ok: true, data: rs.rows });
  } catch (e) {
    console.error('GET /products error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Khuyến mãi theo ngày
router.get('/promotions/active', async (req, res) => {
  try {
    const day = req.query.day || new Date().toISOString().slice(0,10);
    const rs = await client.execute(
      `SELECT promo_id, name, type, start_date, end_date
       FROM promotions_active_by_day
       WHERE day=?`,
      [day], { prepare: true }
    );
    res.json({ ok: true, data: rs.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Sản phẩm theo promo
router.get('/promotions/:promoId/products', async (req, res) => {
  try {
    const rs = await client.execute(
      `SELECT product_id, discount_percent, discount_amount, gift_product_id
       FROM products_by_promo
       WHERE promo_id=?`,
      [req.params.promoId], { prepare: true }
    );
    res.json({ ok: true, data: rs.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Chi tiết 1 sản phẩm
router.get('/products/:id', async (req, res) => {
  try {
    const rs = await client.execute(
      `SELECT product_id, name, category, price, image_url, status
       FROM products_by_id
       WHERE product_id=?`,
      [req.params.id], { prepare: true }
    );
    res.json({ ok: true, data: rs.first() || null });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Giỏ hàng (GET/POST/PATCH/DELETE)
router.get('/cart', async (req, res) => {
  try {
    const { customer_id } = req.query;
    const rs = await client.execute(
      `SELECT customer_id, added_at, item_id, product_id, qty
       FROM cart_by_customer
       WHERE customer_id=?`,
      [customer_id], { prepare: true }
    );
    res.json({ ok: true, data: rs.rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/cart', async (req, res) => {
  try {
    const { customer_id, item_id, product_id, qty } = req.body;
    const added_at = new Date().toISOString().slice(0,10);
    await client.execute(
      `INSERT INTO cart_by_customer (customer_id, added_at, item_id, product_id, qty)
       VALUES (?, ?, ?, ?, ?)`,
      [customer_id, added_at, item_id, product_id, qty], { prepare: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.patch('/cart', async (req, res) => {
  try {
    const { customer_id, added_at, item_id, qty } = req.body;
    await client.execute(
      `UPDATE cart_by_customer SET qty=? WHERE customer_id=? AND added_at=? AND item_id=?`,
      [qty, customer_id, added_at, item_id], { prepare: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.delete('/cart', async (req, res) => {
  try {
    const { customer_id, added_at, item_id } = req.body;
    await client.execute(
      `DELETE FROM cart_by_customer WHERE customer_id=? AND added_at=? AND item_id=?`,
      [customer_id, added_at, item_id], { prepare: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;  // <— nhớ export router
