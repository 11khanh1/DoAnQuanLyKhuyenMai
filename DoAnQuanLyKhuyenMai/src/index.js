// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { PromoRepo } from './repositories/promoRepo.js';
import { AdminRepo } from './repositories/adminRepo.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve UI tĩnh
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../public')));

// Root -> public/index.html (UI)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// -------- READ-ONLY API (giữ nguyên) --------
app.get('/health', (_, res) => res.json({ ok: true }));

// http://localhost:3000/promos/active?day=2025-12-22
app.get('/promos/active', async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) return res.status(400).json({ ok: false, msg: 'Missing day=YYYY-MM-DD' });
    const rows = await PromoRepo.getActivePromosByDay(day);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// http://localhost:3000/promos/type/Giảm%20giá%20%25
app.get('/promos/type/:type', async (req, res) => {
  try {
    const rows = await PromoRepo.getPromosByType(req.params.type);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// http://localhost:3000/promos/KM03/products
app.get('/promos/:promoId/products', async (req, res) => {
  try {
    const rows = await PromoRepo.getProductsInPromo(req.params.promoId);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// http://localhost:3000/products/SP003/promos
app.get('/products/:productId/promos', async (req, res) => {
  try {
    const rows = await PromoRepo.getPromosForProduct(req.params.productId);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// -------- ADMIN CRUD API --------
// Get promo by id
app.get('/admin/promos/:promoId', async (req, res) => {
  try {
    const row = await AdminRepo.getPromoById(req.params.promoId);
    if (!row) return res.status(404).json({ ok: false, msg: 'Not found' });
    res.json({ ok: true, data: row });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Create promo
app.post('/admin/promos', async (req, res) => {
  try {
    await AdminRepo.createPromo(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Update promo
app.put('/admin/promos/:promoId', async (req, res) => {
  try {
    await AdminRepo.updatePromo(req.params.promoId, req.body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Delete promo
app.delete('/admin/promos/:promoId', async (req, res) => {
  try {
    await AdminRepo.deletePromo(req.params.promoId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// List products in promo (admin)
app.get('/admin/promos/:promoId/products', async (req, res) => {
  try {
    const rows = await AdminRepo.listProductsInPromo(req.params.promoId);
    res.json({ ok: true, data: rows });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Add product to promo
app.post('/admin/promos/:promoId/products', async (req, res) => {
  try {
    const body = { ...req.body, promo_id: req.params.promoId };
    await AdminRepo.addProductToPromo(body);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Remove product from promo
app.delete('/admin/promos/:promoId/products/:productId', async (req, res) => {
  try {
    await AdminRepo.removeProductFromPromo(req.params.promoId, req.params.productId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Generate active days for promo (from start_date..end_date)
app.post('/admin/promos/:promoId/generate-active-days', async (req, res) => {
  try {
    await AdminRepo.generateActiveDaysForPromo(req.params.promoId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// Delete one active day
app.delete('/admin/promos/:promoId/active-days/:day', async (req, res) => {
  try {
    await AdminRepo.deleteActiveDay(req.params.promoId, req.params.day /* YYYY-MM-DD */);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 API server running at http://localhost:${port}`);
});
