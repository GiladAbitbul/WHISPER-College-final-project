import forge from 'node-forge';


/**
 * Generates RSA key pair asynchronously using Forge library.
 *
 * @param {number} bits - The length of the RSA key in bits.
 * @returns {Promise<{ publicKey: string, privateKey: string }>} - Promise that resolves with an object containing publicKey and privateKey in PEM format.
 * @throws {Error} - Throws an error if key pair generation fails.
 */
export const generateKeys = (bits = 1024) => {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits, workers: 2 }, (err, keypair) => {
      if (err) {
        reject(err);
      } else {
        const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
        const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
        resolve({ publicKey, privateKey });
      }
    });
  });
};

// /**
//  * Encrypts a message using AES-CBC with a randomly generated key,
//  * then encrypts the AES key with RSA-OAEP using the provided public key.
//  *
//  * @param {string} message - The message to be encrypted.
//  * @param {string} publicKeyPem - The RSA public key in PEM format.
//  * @returns {Object} - An object containing the encrypted key, encrypted message, and initialization vector (IV).
//  * @throws {Error} - Throws an error if encryption fails.
//  */
// export const encryptMessage = (message, publicKeyPem) => {
//   // Generate a random AES key
//   const aesKey = forge.random.getBytesSync(16);

//   // Encrypt the message with AES
//   const cipher = forge.cipher.createCipher('AES-CBC', aesKey);
//   cipher.start({ iv: aesKey });
//   cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(message)));
//   cipher.finish();
//   const encryptedMessage = cipher.output.getBytes();

//   // Encrypt the AES key with RSA
//   const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
//   const encryptedKey = publicKey.encrypt(aesKey, 'RSA-OAEP');

//   // Return the encrypted key, encrypted message, and IV
//   return {
//     key: forge.util.encode64(encryptedKey),
//     message: forge.util.encode64(encryptedMessage),
//     iv: forge.util.encode64(aesKey),
//   };
// };



/**
 * Encrypts a message using RSA. If the message is too long, it splits it into blocks using '::'.
 *
 * @param {string} message - The message to be encrypted.
 * @param {string} publicKeyPem - The RSA public key in PEM format.
 * @returns {string} - The encrypted message, possibly split into blocks.
 * @throws {Error} - Throws an error if encryption fails.
 */
export const encryptMessage = (message, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const blockSize = 245; // The maximum size of data that can be encrypted with RSA (key size - padding overhead)
  let encryptedMessage = '';
  
  for (let i = 0; i < message.length; i += blockSize) {
    const block = message.substring(i, i + blockSize);
    const encryptedBlock = publicKey.encrypt(forge.util.encodeUtf8(block), 'RSA-OAEP');
    encryptedMessage += forge.util.encode64(encryptedBlock) + '::';
  }

  // Remove the trailing '::'
  return encryptedMessage.slice(0, -2);
};


// /**
//  * Decrypts a message encrypted with AES-CBC and the AES key encrypted with RSA-OAEP.
//  *
//  * @param {Object} encrypted - An object containing the encrypted key, encrypted message, and initialization vector (IV).
//  * @param {string} privateKeyPem - The RSA private key in PEM format.
//  * @returns {string} - The decrypted plaintext message.
//  * @throws {Error} - Throws an error if decryption fails.
//  */
// export const decryptMessage = (encrypted, privateKeyPem) => {
//   const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

//   // Decode the base64 encoded values
//   const encryptedKey = forge.util.decode64(encrypted.key);
//   const encryptedMessage = forge.util.decode64(encrypted.message);
//   const iv = forge.util.decode64(encrypted.iv);

//   // Decrypt the AES key with RSA
//   const aesKey = privateKey.decrypt(encryptedKey, 'RSA-OAEP');

//   // Decrypt the message with AES
//   const decipher = forge.cipher.createDecipher('AES-CBC', aesKey);
//   decipher.start({ iv: iv });
//   decipher.update(forge.util.createBuffer(encryptedMessage));
//   const result = decipher.finish();

//   if (result) {
//     return forge.util.decodeUtf8(decipher.output.getBytes());
//   } else {
//     throw new Error('Decryption failed');
//   }
// };


/**
 * Decrypts a message encrypted with RSA, which may be split into blocks.
 *
 * @param {string} encryptedMessage - The encrypted message, possibly split into blocks.
 * @param {string} privateKeyPem - The RSA private key in PEM format.
 * @returns {string} - The decrypted plaintext message.
 * @throws {Error} - Throws an error if decryption fails.
 */
export const decryptMessage = (encryptedMessage, privateKeyPem) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

  if (typeof encryptedMessage !== 'string') {
    return "Decryption failed";
  }

  const encryptedBlocks = encryptedMessage.split('::');
  let decryptedMessage = '';

  encryptedBlocks.forEach(block => {
    if (block) {
      const decodedBlock = forge.util.decode64(block);
      const decryptedBlock = privateKey.decrypt(decodedBlock, 'RSA-OAEP');
      decryptedMessage += forge.util.decodeUtf8(decryptedBlock);
    }
  });

  return decryptedMessage;
};