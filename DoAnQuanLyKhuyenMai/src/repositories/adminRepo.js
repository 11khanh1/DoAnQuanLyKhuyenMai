// src/repositories/adminRepo.js (ESM)
import { createClient } from '../config/cassandra.js';
import { types } from 'cassandra-driver';

const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'ql_khuyenmai';
const db = createClient({ keyspace: KEYSPACE });
await db.connect();

// Helpers
function toLocalDate(str) {
  if (!str) return null;
  return types.LocalDate.fromDate(new Date(str));
}

export const AdminRepo = {
  // ---- promotions_by_id ----
  async getPromoById(promoId) {
    const q = 'SELECT * FROM promotions_by_id WHERE promo_id = ?';
    const rs = await db.execute(q, [promoId], { prepare: true });
    return rs.rows[0] || null;
  },

  async createPromo(payload) {
    const {
        promo_id, name, type, start_date, end_date, description,
        stackable = false, min_order_amount = 0, limit_per_customer = 0,
        global_quota = null, channels = ['online']
    } = payload;

    const q = `INSERT INTO promotions_by_id
        (promo_id,name,type,start_date,end_date,description,stackable,min_order_amount,limit_per_customer,global_quota,channels)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        promo_id,
        name,
        type,
        toLocalDate(start_date),
        toLocalDate(end_date),
        description,
        !!stackable,
        types.BigDecimal.fromNumber(+min_order_amount || 0),
        parseInt(limit_per_customer || 0, 10),
        (global_quota === null || global_quota === '' ? null : parseInt(global_quota, 10)),
        Array.isArray(channels) ? channels : String(channels || '').split(',').map(s => s.trim()).filter(Boolean)
    ];
    await db.execute(q, params, { prepare: true });
    return { ok: true };
    },

    async updatePromo(promo_id, payload) {
    const {
        name, type, start_date, end_date, description,
        stackable, min_order_amount, limit_per_customer,
        global_quota, channels
    } = payload;

    const q = `UPDATE promotions_by_id SET
        name=?, type=?, start_date=?, end_date=?, description=?, stackable=?,
        min_order_amount=?, limit_per_customer=?, global_quota=?, channels=?
        WHERE promo_id=?`;

    const params = [
        name,
        type,
        toLocalDate(start_date),
        toLocalDate(end_date),
        description,
        !!stackable,
        types.BigDecimal.fromNumber(+min_order_amount || 0),
        parseInt(limit_per_customer || 0, 10),
        (global_quota === null || global_quota === '' ? null : parseInt(global_quota, 10)),
        Array.isArray(channels) ? channels : String(channels || '').split(',').map(s => s.trim()).filter(Boolean),
        promo_id
    ];
    await db.execute(q, params, { prepare: true });
    return { ok: true };
    },

  async deletePromo(promo_id) {
    // Xoá liên quan ở bảng products_by_promo và promos_by_product: cần biết các product_id
    const qProd = 'SELECT product_id FROM products_by_promo WHERE promo_id = ?';
    const rs = await db.execute(qProd, [promo_id], { prepare: true });
    for (const row of rs.rows) {
      const product_id = row.product_id;
      await db.execute('DELETE FROM products_by_promo WHERE promo_id=? AND product_id=?',
        [promo_id, product_id], { prepare: true });
      await db.execute('DELETE FROM promos_by_product WHERE product_id=? AND promo_id=?',
        [product_id, promo_id], { prepare: true });
    }
    // Xoá bản thân promo
    await db.execute('DELETE FROM promotions_by_id WHERE promo_id=?', [promo_id], { prepare: true });
    return { ok: true };
  },

  // ---- products_by_promo & promos_by_product ----
  async listProductsInPromo(promo_id) {
    const q = `SELECT product_id,discount_percent,discount_amount,gift_product_id
               FROM products_by_promo WHERE promo_id=?`;
    const rs = await db.execute(q, [promo_id], { prepare: true });
    return rs.rows;
  },

  async addProductToPromo({ promo_id, product_id, discount_percent = 0, discount_amount = 0, gift_product_id = null }) {
    // Ghi chiều promo->product
    const q1 = `INSERT INTO products_by_promo
      (promo_id,product_id,discount_percent,discount_amount,gift_product_id)
      VALUES (?,?,?,?,?)`;
    await db.execute(q1, [promo_id, product_id, parseInt(discount_percent||0,10), parseInt(discount_amount||0,10), gift_product_id], { prepare: true });

    // Ghi chiều product->promo cần type/start/end từ promotions_by_id
    const promo = await this.getPromoById(promo_id);
    if (!promo) throw new Error('Promo not found');

    const q2 = `INSERT INTO promos_by_product
      (product_id,promo_id,type,discount_percent,discount_amount,gift_product_id,start_date,end_date)
      VALUES (?,?,?,?,?,?,?,?)`;
    await db.execute(q2, [
      product_id, promo_id, promo.type,
      parseInt(discount_percent||0,10), parseInt(discount_amount||0,10), gift_product_id,
      promo.start_date, promo.end_date
    ], { prepare: true });

    return { ok: true };
  },

  async removeProductFromPromo(promo_id, product_id) {
    await db.execute('DELETE FROM products_by_promo WHERE promo_id=? AND product_id=?',
      [promo_id, product_id], { prepare: true });
    await db.execute('DELETE FROM promos_by_product WHERE product_id=? AND promo_id=?',
      [product_id, promo_id], { prepare: true });
    return { ok: true };
  },

  // ---- promotions_active_by_day ----
  async generateActiveDaysForPromo(promo_id) {
    const promo = await this.getPromoById(promo_id);
    if (!promo) throw new Error('Promo not found');
    if (!promo.start_date || !promo.end_date) throw new Error('Promo missing start/end date');

    // Loop từng ngày trong khoảng [start_date..end_date]
    const start = promo.start_date.toString(); // YYYY-MM-DD
    const end = promo.end_date.toString();

    const startDate = new Date(start);
    const endDate = new Date(end);

    const q = `INSERT INTO promotions_active_by_day
      (day,promo_id,start_date,end_date,type,name)
      VALUES (?,?,?,?,?,?)`;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = types.LocalDate.fromDate(new Date(d));
      await db.execute(q, [day, promo_id, promo.start_date, promo.end_date, promo.type, promo.name], { prepare: true });
    }
    return { ok: true };
  },

  async deleteActiveDay(promo_id, dayStr) {
    const day = toLocalDate(dayStr);
    await db.execute('DELETE FROM promotions_active_by_day WHERE day=? AND promo_id=?', [day, promo_id], { prepare: true });
    return { ok: true };
  }
};
