import { createClient } from '../config/cassandra.js';
import { types } from 'cassandra-driver';

const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'ql_khuyenmai';
const cassandra = createClient({ keyspace: KEYSPACE });
await cassandra.connect();

export const PromoRepo = {
  async getActivePromosByDay(dayStr) {
    const day = types.LocalDate.fromDate(new Date(dayStr));
    const q = "SELECT promo_id, name, start_date, end_date FROM promotions_active_by_day WHERE day = ?";
    const rs = await cassandra.execute(q, [day], { prepare: true });
    return rs.rows;
  },

  async getPromosByType(type) {
    const q = "SELECT start_date, promo_id, name, end_date FROM promotions_by_type WHERE type = ?";
    const rs = await cassandra.execute(q, [type], { prepare: true });
    return rs.rows;
  },

  async getProductsInPromo(promoId) {
    const q = "SELECT product_id, discount_percent, discount_amount, gift_product_id FROM products_by_promo WHERE promo_id = ?";
    const rs = await cassandra.execute(q, [promoId], { prepare: true });
    return rs.rows;
  },

  async getPromosForProduct(productId) {
    const q = "SELECT promo_id, type, discount_percent, discount_amount, start_date, end_date FROM promos_by_product WHERE product_id = ?";
    const rs = await cassandra.execute(q, [productId], { prepare: true });
    return rs.rows;
  }
};
