// crypto.js — AES-256-GCM encryption module (Symmetric encryption being applied with AES-256-GCM)
// Owned by Ayush
// In this file, I am making use of crypto.subtle which is the browser's built-in cryptography API
/* All built-in functions used in this file are derived from WEB Crypto API, which is used by every modern browser
   I have derived most of the codes used here from the following source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API */


// Key is derived once via PBKDF2 (Password-Based Key Derivation Function) and cached. Never stored, but re-derived on every page load.
// BTW, this is using a hardcoded passphrase and salt, so it follows the steps of PBKDF2, but just hardcoded for simplicity
var _appKey = null;

function getAppKey() {
    if (_appKey) return Promise.resolve(_appKey);

    var textEncoder = new TextEncoder();
    var encryptionPassphrase = textEncoder.encode("SeattleGraceMediPortal2025");
    var pbkdf2Salt = textEncoder.encode("SGH-CST2590-SALT");

    return crypto.subtle.importKey("raw",encryptionPassphrase,"PBKDF2",false,["deriveKey"]).then(function(keyMaterial) {
        //https://developer.mozilla.org/docs/Web/API/SubtleCrypto/deriveKey
        return crypto.subtle.deriveKey(
            {name:"PBKDF2",salt:pbkdf2Salt,iterations:100000,hash:"SHA-256"},
            keyMaterial, { name:"AES-GCM", length: 256 },false,["encrypt", "decrypt"]
        );

    }).then(function(key) {
        _appKey = key;
        return key;
    });
}

// Encrypts a plaintext string.
// Returns a intialization Vector(hereby referred to as iv) and the ciphertext
// Called before storing passwords, NHS numbers, or medical notes in IndexedDB.
function encryptField(plaintext) {
    return getAppKey().then(function(key) {
        var initializationVector = crypto.getRandomValues(new Uint8Array(12));
        var plaintextEncoded = new TextEncoder().encode(String(plaintext));

        return crypto.subtle.encrypt({ name: "AES-GCM", iv: initializationVector }, key, plaintextEncoded)
            .then(function(encryptedBuffer) {
                return {
                    iv: btoa(String.fromCharCode.apply(null, initializationVector)),
                    ciphertext: btoa(String.fromCharCode.apply(null, new Uint8Array(encryptedBuffer)))
                };
            });
    });
}

// Decrypts an encrypted field object
// Returns the original plaintext string.
// Only call this if the role has permission to see the field.
function decryptField(encrypted) {
    return getAppKey().then(function(key) {
        var initializationVector = Uint8Array.from(atob(encrypted.iv),
        function(charCode) { return charCode.charCodeAt(0); });
        var ciphertextBytes = Uint8Array.from(atob(encrypted.ciphertext), 
        function(charCode) { return charCode.charCodeAt(0); });

        return crypto.subtle.decrypt({ name: "AES-GCM", iv: initializationVector }, key, ciphertextBytes)
            .then(function(decryptedBuffer) {
                return new TextDecoder().decode(decryptedBuffer);
            });
    });
}
