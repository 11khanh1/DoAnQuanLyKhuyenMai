const client = require('../config/cassandra');

async function listCart(customer_id) {
  const res = await client.execute(
    'SELECT * FROM cart_by_customer WHERE customer_id=?',
    [customer_id],
    { prepare: true }
  );
  return res.rows;
}

async function addToCart(customer_id, item) {
  const added_at = item.added_at || new Date().toISOString().slice(0,10);
  await client.execute(
    'INSERT INTO cart_by_customer (customer_id, added_at, item_id, product_id, qty) VALUES (?, ?, ?, ?, ?)',
    [customer_id, added_at, item.item_id, item.product_id, item.qty],
    { prepare: true }
  );
  return { customer_id, added_at, item_id: item.item_id };
}

async function updateCartItem(customer_id, added_at, item_id, qty) {
  await client.execute(
    'UPDATE cart_by_customer SET qty=? WHERE customer_id=? AND added_at=? AND item_id=?',
    [qty, customer_id, added_at, item_id],
    { prepare: true }
  );
  return true;
}

async function removeFromCart(customer_id, added_at, item_id) {
  await client.execute(
    'DELETE FROM cart_by_customer WHERE customer_id=? AND added_at=? AND item_id=?',
    [customer_id, added_at, item_id],
    { prepare: true }
  );
  return true;
}

module.exports = {
  listCart,
  addToCart,
  updateCartItem,
  removeFromCart
};
