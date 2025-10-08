const client = require('../config/cassandra');

async function applyCode({ code, day, customer_id }) {
  const c = await client.execute(
    'SELECT code, promo_id, status, expire_date FROM promo_codes_by_code WHERE code=?',
    [code],
    { prepare: true }
  );
  const coupon = c.first();
  if (!coupon) return { ok: false, error: 'invalid_code' };
  if (coupon.status && coupon.status !== 'active') return { ok: false, error: 'code_inactive' };
  if (coupon.expire_date && day > coupon.expire_date.toISOString().slice(0,10))
    return { ok: false, error: 'code_expired' };

  const act = await client.execute(
    'SELECT promo_id, name, type, start_date, end_date FROM promotions_active_by_day WHERE day=?',
    [day],
    { prepare: true }
  );
  const promoRow = act.rows.find(r => r.promo_id === coupon.promo_id);
  if (!promoRow) return { ok: false, error: 'not_active_today' };

  return {
    ok: true,
    promo: {
      promo_id: promoRow.promo_id,
      name: promoRow.name,
      type: promoRow.type,
      start_date: promoRow.start_date,
      end_date: promoRow.end_date
    }
  };
}

module.exports = { applyCode };
