const cassandra = require('cassandra-driver');
require('dotenv').config();

const client = new cassandra.Client({
  contactPoints: (process.env.CASS_CONTACT_POINTS || '127.0.0.1')
    .split(',')
    .map(s => s.trim()),
  localDataCenter: process.env.CASS_DATACENTER || 'datacenter1',
  keyspace: process.env.CASS_KEYSPACE || 'ql_khuyenmai',
  // credentials: { username: process.env.CASS_USER, password: process.env.CASS_PASS }, // nếu có
});

client.healthcheck = async () => {
  const rs = await client.execute('SELECT release_version FROM system.local');
  return rs.rows[0]?.release_version || 'unknown';
};

module.exports = client;
