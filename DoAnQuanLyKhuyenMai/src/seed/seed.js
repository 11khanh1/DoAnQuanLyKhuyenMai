// // src/seed/seed.js (ESM)
// import { createClient } from '../config/cassandra.js';

// const KEYSPACE = process.env.CASSANDRA_KEYSPACE || 'ql_khuyenmai';

// async function run() {
//   // B1) tạo keyspace bằng client không keyspace
//   const sys = createClient();
//   await sys.connect();
//   await sys.execute(
//     "CREATE KEYSPACE IF NOT EXISTS ql_khuyenmai WITH replication = {'class':'SimpleStrategy','replication_factor':1}"
//   );
//   await sys.shutdown();

//   // B2) mở client với keyspace rồi tạo bảng/insert
//   const db = createClient({ keyspace: KEYSPACE });
//   await db.connect();

//   const cql = [
//     "CREATE TABLE IF NOT EXISTS promotions_by_id (promo_id text PRIMARY KEY, name text, type text, start_date date, end_date date, description text, stackable boolean, min_order_amount decimal, limit_per_customer int, global_quota int, channels set<text>)",
//     "CREATE TABLE IF NOT EXISTS promotions_active_by_day (day date, promo_id text, start_date date, end_date date, type text, name text, PRIMARY KEY (day, promo_id)) WITH CLUSTERING ORDER BY (promo_id ASC)",
//     "CREATE TABLE IF NOT EXISTS promotions_by_type (type text, start_date date, promo_id text, name text, end_date date, PRIMARY KEY (type, start_date, promo_id)) WITH CLUSTERING ORDER BY (start_date DESC, promo_id ASC)",
//     "CREATE TABLE IF NOT EXISTS products_by_promo (promo_id text, product_id text, discount_percent int, discount_amount int, gift_product_id text, PRIMARY KEY (promo_id, product_id))",
//     "CREATE TABLE IF NOT EXISTS promos_by_product (product_id text, promo_id text, type text, discount_percent int, discount_amount int, gift_product_id text, start_date date, end_date date, PRIMARY KEY (product_id, promo_id))",

//     "INSERT INTO promotions_by_id (promo_id,name,type,start_date,end_date,description,stackable,min_order_amount,limit_per_customer,global_quota,channels) VALUES ('KM01','Giảm 20% dịp 2/9','Giảm giá %','2025-09-01','2025-09-03','Áp dụng toàn bộ sản phẩm đồ uống',true,0,5,null,{'online','store'})",
//     "INSERT INTO promotions_by_id (promo_id,name,type,start_date,end_date,description,stackable,min_order_amount,limit_per_customer,global_quota,channels) VALUES ('KM02','Mua 1 tặng 1 Trà sữa','Tặng quà','2025-12-20','2025-12-25','Áp dụng cho sản phẩm Trà sữa size L',false,0,2,1000,{'online'})",
//     "INSERT INTO promotions_by_id (promo_id,name,type,start_date,end_date,description,stackable,min_order_amount,limit_per_customer,global_quota,channels) VALUES ('KM03','Giảm 50K cho đơn >300K','Giảm giá tiền','2025-11-01','2025-11-30','Áp dụng cho tất cả đơn hàng online',true,300000,3,null,{'online'})",

//     "INSERT INTO promotions_active_by_day (day,promo_id,start_date,end_date,type,name) VALUES ('2025-09-01','KM01','2025-09-01','2025-09-03','Giảm giá %','Giảm 20% dịp 2/9')",
//     "INSERT INTO promotions_active_by_day (day,promo_id,start_date,end_date,type,name) VALUES ('2025-09-02','KM01','2025-09-01','2025-09-03','Giảm giá %','Giảm 20% dịp 2/9')",
//     "INSERT INTO promotions_active_by_day (day,promo_id,start_date,end_date,type,name) VALUES ('2025-09-03','KM01','2025-09-01','2025-09-03','Giảm giá %','Giảm 20% dịp 2/9')",

//     "INSERT INTO promotions_by_type (type,start_date,promo_id,name,end_date) VALUES ('Giảm giá %','2025-09-01','KM01','Giảm 20% dịp 2/9','2025-09-03')",
//     "INSERT INTO promotions_by_type (type,start_date,promo_id,name,end_date) VALUES ('Tặng quà','2025-12-20','KM02','Mua 1 tặng 1 Trà sữa','2025-12-25')",
//     "INSERT INTO promotions_by_type (type,start_date,promo_id,name,end_date) VALUES ('Giảm giá tiền','2025-11-01','KM03','Giảm 50K cho đơn >300K','2025-11-30')",

//     "INSERT INTO products_by_promo (promo_id,product_id,discount_percent) VALUES ('KM01','SP001',20)",
//     "INSERT INTO products_by_promo (promo_id,product_id,discount_percent) VALUES ('KM01','SP002',20)",
//     "INSERT INTO products_by_promo (promo_id,product_id,discount_percent,discount_amount,gift_product_id) VALUES ('KM03','SP003',0,50000,null)",

//     "INSERT INTO promos_by_product (product_id,promo_id,type,discount_percent,discount_amount,start_date,end_date) VALUES ('SP001','KM01','Giảm giá %',20,null,'2025-09-01','2025-09-03')",
//     "INSERT INTO promos_by_product (product_id,promo_id,type,discount_percent,discount_amount,start_date,end_date) VALUES ('SP002','KM01','Giảm giá %',20,null,'2025-09-01','2025-09-03')",
//     "INSERT INTO promos_by_product (product_id,promo_id,type,discount_percent,discount_amount,start_date,end_date) VALUES ('SP003','KM03','Giảm giá tiền',0,50000,'2025-11-01','2025-11-30')"
//   ];

//   for (const stmt of cql) {
//     await db.execute(stmt);
//     console.log('OK:', stmt.slice(0, 80), '...');
//   }

//   console.log('Seed done.');
//   await db.shutdown();
// }

// run().catch(async (e) => {
//   console.error(e);
//   process.exit(1);
// });
