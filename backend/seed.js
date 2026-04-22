const User = require('./models/user.model');
const Message = require('./models/message.model');
const sequelize = require('./config/db.config');
const bcrypt = require('bcrypt');
const forge = require('node-forge');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced (all tables dropped and recreated)');

        // Create RSA Keys for Alice and Bob
        const keyPairAlice = forge.pki.rsa.generateKeyPair(2048);
        const publicKeyAlice = forge.pki.publicKeyToPem(keyPairAlice.publicKey);
        const privateKeyAlice = forge.pki.privateKeyToPem(keyPairAlice.privateKey);

        const keyPairBob = forge.pki.rsa.generateKeyPair(2048);
        const publicKeyBob = forge.pki.publicKeyToPem(keyPairBob.publicKey);
        const privateKeyBob = forge.pki.privateKeyToPem(keyPairBob.privateKey);

        const alicePass = await bcrypt.hash('alice123', 10);
        const bobPass = await bcrypt.hash('bob123', 10);

        const alice = await User.create({
            username: 'Alice',
            password_hash: alicePass,
            public_key: publicKeyAlice,
            private_key: privateKeyAlice
        });

        const bob = await User.create({
            username: 'Bob',
            password_hash: bobPass,
            public_key: publicKeyBob,
            private_key: privateKeyBob
        });

        console.log('Test users created:');
        console.log('1. Alice (Password: alice123)');
        console.log('2. Bob (Password: bob123)');

        // Optional: Create an initial message from Alice to Bob
        // For the seed, we'll just encrypt a hello message
        const buffer = forge.util.encodeUtf8('Hello Bob! This is our first secure chat.');
        const encrypted = keyPairBob.publicKey.encrypt(buffer, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const ciphertext = forge.util.encode64(encrypted);

        await Message.create({
            sender_id: alice.id,
            receiver_id: bob.id,
            ciphertext: ciphertext
        });

        console.log('Initial secure message seeded.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
