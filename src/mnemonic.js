'use strict';
let mnemonic = require('./util/mnemonic');
let Random = require('./util/nacl_util').randomBytes;
import * as strkey from "./strkey";

let SEED_LENGTH = 32;
let wordlist = {
    eng: mnemonic.Words.ENGLISH, 
    ukr: mnemonic.Words.UKRAINIAN
};

/**
 * Decode phrase into seed
 * @param phrase {string}
 * @param {string} [lang] default eng for English
 * @returns {Buffer}
 */
export function getSeedFromMnemonic(phrase, lang){
    lang = lang || "eng";
    if (mnemonic.isValid(phrase, wordlist[lang]) === false)
        throw new Error("Invalid mnemonic phrase");
    let rawSeed = mnemonic.toSeed(phrase, wordlist[lang]);
    return strkey.encodeCheck('ed25519SecretSeed', rawSeed);
}

/**
 * Encode seed into phrase
 * @param seed {string}
 * @param {string} [lang] default eng for English
 * @returns {string}
 */
export function getMnemonicFromSeed(seed, lang) {
    lang = lang || "eng";
    let rawSeed = strkey.decodeCheck('ed25519SecretSeed', seed);
    let mnemo = new mnemonic(rawSeed, wordlist[lang]);
    return mnemo.phrase;
}

/**
 * Generate random seed & encode it into phrase
 * @param {string} [lang] default "eng" for English
 * @returns {string}
 */
export function getMnemonic(lang){
    lang = lang || "eng";
    let rawSeed = new Buffer(Random(SEED_LENGTH));
    let mnemo = new mnemonic(rawSeed, wordlist[lang]);
    return mnemo.phrase;
}