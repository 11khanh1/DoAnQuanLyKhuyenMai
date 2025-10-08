const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check (để test nhanh kết nối Cassandra)
const client = require('./config/cassandra');
app.get('/health', async (req, res) => {
  try {
    const ver = await client.healthcheck();
    res.json({ ok: true, cassandra: ver });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api/customer', require('./routes/customer'));
app.use('/shop', express.static('src/ui/customer'));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log('Server listening on', port));
