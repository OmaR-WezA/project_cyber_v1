const forge = require('node-forge');

/**
 * Generates an RSA key pair.
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
const generateKeyPair = () => {
    return new Promise((resolve, reject) => {
        forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, keypair) => {
            if (err) return reject(err);

            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

            resolve({
                publicKey: publicKeyPem,
                privateKey: privateKeyPem
            });
        });
    });
};

/**
 * Encrypts a message using a public key.
 * @param {string} text 
 * @param {string} publicKeyPem 
 * @returns {string} Base64 encoded ciphertext
 */
const encrypt = (text, publicKeyPem) => {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const buffer = forge.util.encodeUtf8(text);
    const encrypted = publicKey.encrypt(buffer, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
            md: forge.md.sha256.create()
        }
    });
    return forge.util.encode64(encrypted);
};

/**
 * Decrypts a message using a private key.
 * @param {string} encryptedBase64 
 * @param {string} privateKeyPem 
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedBase64, privateKeyPem) => {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encrypted = forge.util.decode64(encryptedBase64);
    const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
            md: forge.md.sha256.create()
        }
    });
    return forge.util.decodeUtf8(decrypted);
};

module.exports = {
    generateKeyPair,
    encrypt,
    decrypt
};
