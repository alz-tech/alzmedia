const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hashPassword   = (p)    => bcrypt.hash(p, 12);
const comparePassword = (p,h) => bcrypt.compare(p, h);

// One-way hash for IPs and user agents (no PII stored in plain text)
const hashIp = (ip) =>
  crypto.createHmac('sha256', process.env.IP_HASH_SECRET || 'alzmedia-ip-salt')
        .update(ip).digest('hex');

module.exports = { hashPassword, comparePassword, hashIp };
