// MongoDB connection test - forces Google DNS (bypasses local DNS issues)
const dns = require('dns');
// Force Google's public DNS resolver
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing DNS with Google DNS servers (8.8.8.8)...');
dns.resolveSrv('_mongodb._tcp.worldofblacklight.otgrt9w.mongodb.net', (err, addresses) => {
    if (err) {
        console.log('❌ SRV lookup still failed:', err.code, '-', err.message);
        console.log('\nThe cluster SRV record may not exist yet. Checking A record...');
        dns.resolve4('worldofblacklight.otgrt9w.mongodb.net', (err2, addrs) => {
            if (err2) console.log('❌ A record failed too:', err2.code, err2.message);
            else console.log('✅ Cluster A record found:', addrs, '— cluster exists!');
            process.exit(1);
        });
    } else {
        console.log('✅ SRV records resolved:', JSON.stringify(addresses));
        console.log('\nNow testing Mongoose connection...');
        mongoose.connect(process.env.MONGO_URI)
            .then(() => { console.log('✅ MongoDB Atlas CONNECTED!'); process.exit(0); })
            .catch(e => { console.log('❌ Mongoose failed:', e.message); process.exit(1); });
    }
});
