"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

/**
 * Decode phrase into seed
 * @param phrase {string}
 * @param {string} [lang] default eng for English
 * @returns {Buffer}
 */
exports.getSeedFromMnemonic = getSeedFromMnemonic;

/**
 * Encode seed into phrase
 * @param seed {string}
 * @param {string} [lang] default eng for English
 * @returns {string}
 */
exports.getMnemonicFromSeed = getMnemonicFromSeed;

/**
 * Generate random seed & encode it into phrase
 * @param {string} [lang] default "eng" for English
 * @returns {string}
 */
exports.getMnemonic = getMnemonic;
Object.defineProperty(exports, "__esModule", {
    value: true
});
"use strict";
var mnemonic = require("./util/mnemonic");
var Random = require("./util/nacl_util").randomBytes;

var strkey = _interopRequireWildcard(require("./strkey"));

var SEED_LENGTH = 32;
var wordlist = {
    eng: mnemonic.Words.ENGLISH,
    ukr: mnemonic.Words.UKRAINIAN
};
function getSeedFromMnemonic(phrase, lang) {
    lang = lang || "eng";
    if (mnemonic.isValid(phrase, wordlist[lang]) === false) throw new Error("Invalid mnemonic phrase");
    var rawSeed = mnemonic.toSeed(phrase, wordlist[lang]);
    return strkey.encodeCheck("ed25519SecretSeed", rawSeed);
}

function getMnemonicFromSeed(seed, lang) {
    lang = lang || "eng";
    var rawSeed = strkey.decodeCheck("ed25519SecretSeed", seed);
    var mnemo = new mnemonic(rawSeed, wordlist[lang]);
    return mnemo.phrase;
}

function getMnemonic(lang) {
    lang = lang || "eng";
    var rawSeed = new Buffer(Random(SEED_LENGTH));
    var mnemo = new mnemonic(rawSeed, wordlist[lang]);
    return mnemo.phrase;
}