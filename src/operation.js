import {default as xdr} from "./generated/stellar-xdr_generated";
import {Keypair} from "./keypair";
import {UnsignedHyper, Hyper} from "js-xdr";
import {hash} from "./hashing";
import {StrKey} from "./strkey";
import {Asset} from "./asset";
import BigNumber from 'bignumber.js';
import {best_r} from "./util/continued_fraction";
import padEnd from 'lodash/padEnd';
import trimEnd  from 'lodash/trimEnd';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isFinite from 'lodash/isFinite';

const ONE = 10000000;
const MAX_INT64 = '9223372036854775807';

/**
 * When set using `{@link Operation.setOptions}` option, requires the issuing account to
 * give other accounts permission before they can hold the issuing account’s credit.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
export const AuthRequiredFlag = 1 << 0;
/**
 * When set using `{@link Operation.setOptions}` option, allows the issuing account to
 * revoke its credit held by other accounts.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
export const AuthRevocableFlag = 1 << 1;
/**
 * When set using `{@link Operation.setOptions}` option, then none of the authorization flags
 * can be set and the account can never be deleted.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
export const AuthImmutableFlag = 1 << 2;

export const BlockIncomingFlag = 1 << 3;
export const BlockOutgoingFlag = 1 << 4;

/**
 * `Operation` class represents [operations](https://www.stellar.org/developers/learn/concepts/operations.html) in Stellar network.
 * Use one of static methods to create operations:
 * * `{@link Operation.createAccount}`
 * * `{@link Operation.payment}`
 * * `{@link Operation.pathPayment}`
 * * `{@link Operation.manageOffer}`
 * * `{@link Operation.createPassiveOffer}`
 * * `{@link Operation.setOptions}`
 * * `{@link Operation.changeTrust}`
 * * `{@link Operation.allowTrust}`
 * * `{@link Operation.accountMerge}`
 * * `{@link Operation.inflation}`
 * * `{@link Operation.manageData}`
 *
 * @class Operation
 */
export class Operation {
  /**
   * Create and fund a non existent account.
   * @param {object} opts
   * @param {string} opts.destination - Destination account ID to create an account for.
   * @param {string} opts.startingBalance - Amount in XLM the account should be funded for. Must be greater
   *                                   than the [reserve balance amount](https://www.stellar.org/developers/learn/concepts/fees.html).
   * @param {string} opts.accountType - Account type to create an account with.
   * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
   * @returns {xdr.CreateAccountOp}
   */
  static createAccount(opts) {
    if (!StrKey.isValidEd25519PublicKey(opts.destination)) {
      throw new Error("destination is invalid");
    }
    if (!this.isValidAmount(opts.startingBalance, true)) {
      throw new TypeError(Operation.constructAmountRequirementsError('startingBalance'));
    }
    if (isUndefined(opts.accountType) || !this._isValidAccountType(opts.accountType)) {
      throw new Error("Must provide an accountType for a create user operation");
    }

    let attributes = {};
    attributes.destination     = Keypair.fromPublicKey(opts.destination).xdrAccountId();
    attributes.startingBalance = this._toXDRAmount(opts.startingBalance);
    attributes.body = new xdr.CreateAccountOpBody(this._accountTypeFromNumber(opts.accountType));

    let createAccount          = new xdr.CreateAccountOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.createAccount(createAccount);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Create an emission on a existent account.
   * @param {object} opts
   * @param {string} opts.destination - Destination account ID to create an account for.
   * @param {string} opts.amount - Amount in XLM the account should be funded for.
   * @returns {xdr.EmissionOp}
   */
  static emission(opts) {
    if (!StrKey.isValidEd25519PublicKey(opts.destination)) {
      throw new Error("destination is invalid");
    }
    if (!this.isValidAmount(opts.amount)) {
      throw new TypeError(Operation.constructAmountRequirementsError('amount'));
    }
    
    let attributes = {};
    attributes.destination     = Keypair.fromPublicKey(opts.destination).xdrAccountId();
    attributes.amount = this._toXDRAmount(opts.amount);
    
    let emission          = new xdr.EmissionOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.emission(emission);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Settle an existent account.
   * @param {object} opts
   * @param {string} opts.amount - Amount in XLM to destroy from the account.
   * @returns {xdr.EmissionOp}
   */
  static settlement(opts) {
    if (!this.isValidAmount(opts.amount)) {
      throw new TypeError(Operation.constructAmountRequirementsError('amount'));
    }
    
    let attributes = {};
    attributes.amount = this._toXDRAmount(opts.amount);
    
    let settlement          = new xdr.SettlementOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.settlement(settlement);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Create a payment operation.
   * @param {object} opts
   * @param {string} opts.destination - The destination account ID.
   * @param {string} opts.amount - The amount to send.
   * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
   * @returns {xdr.PaymentOp}
   */
  static payment(opts) {
    if (!StrKey.isValidEd25519PublicKey(opts.destination)) {
      throw new Error("destination is invalid");
    }
    if (!this.isValidAmount(opts.amount)) {
      throw new TypeError(Operation.constructAmountRequirementsError('amount'));
    }

    let attributes = {};
    attributes.destination  = Keypair.fromPublicKey(opts.destination).xdrAccountId();
    attributes.asset        = Asset.native().toXDRObject();
    attributes.amount       = this._toXDRAmount(opts.amount);
    let payment             = new xdr.PaymentOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.payment(payment);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Returns an XDR SetOptionsOp. A "set options" operations set or clear account flags,
   * set the account's inflation destination, and/or add new signers to the account.
   * The flags used in `opts.clearFlags` and `opts.setFlags` can be the following:
   *   - `{@link AuthRequiredFlag}`
   *   - `{@link AuthRevocableFlag}`
   *   - `{@link AuthImmutableFlag}`
   *
   * It's possible to set/clear multiple flags at once using logical or.
   * @param {object} opts
   * @param {string} [opts.inflationDest] - Set this account ID as the account's inflation destination.
   * @param {(number|string)} [opts.clearFlags] - Bitmap integer for which account flags to clear.
   * @param {(number|string)} [opts.setFlags] - Bitmap integer for which account flags to set.
   * @param {number|string} [opts.masterWeight] - The master key weight.
   * @param {number|string} [opts.lowThreshold] - The sum weight for the low threshold.
   * @param {number|string} [opts.medThreshold] - The sum weight for the medium threshold.
   * @param {number|string} [opts.highThreshold] - The sum weight for the high threshold.
   * @param {object} [opts.signer] - Add or remove a signer from the account. The signer is
   *                                 deleted if the weight is 0. Only one of `ed25519PublicKey`, `sha256Hash`, `preAuthTx` should be defined.
   * @param {string} [opts.signer.ed25519PublicKey] - The ed25519 public key of the signer.
   * @param {Buffer|string} [opts.signer.sha256Hash] - sha256 hash (Buffer or hex string) of preimage that will unlock funds. Preimage should be used as signature of future transaction.
   * @param {Buffer|string} [opts.signer.preAuthTx] - Hash (Buffer or hex string) of transaction that will unlock funds.
   * @param {number|string} [opts.signer.weight] - The weight of the new signer (0 to delete or 1-255)
   * @param {number} [opts.signer.signerType] - The type of the new signer
   * @param {string} [opts.homeDomain] - sets the home domain used for reverse federation lookup.
   * @param {string} [opts.source] - The source account (defaults to transaction source).
   * @returns {xdr.SetOptionsOp}
   * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
   */
  static setOptions(opts) {
    let attributes = {};

    if (opts.inflationDest) {
      if (!StrKey.isValidEd25519PublicKey(opts.inflationDest)) {
        throw new Error("inflationDest is invalid");
      }
      attributes.inflationDest = Keypair.fromPublicKey(opts.inflationDest).xdrAccountId();
    }

    let weightCheckFunction = (value, name) => {
      if (value >= 0 && value <= 255) {
        return true;
      } else {
        throw new Error(`${name} value must be between 0 and 255`);
      }
    };

    attributes.clearFlags = this._checkUnsignedIntValue("clearFlags", opts.clearFlags);
    attributes.setFlags = this._checkUnsignedIntValue("setFlags", opts.setFlags);
    attributes.masterWeight = this._checkUnsignedIntValue("masterWeight", opts.masterWeight, weightCheckFunction);
    attributes.lowThreshold = this._checkUnsignedIntValue("lowThreshold", opts.lowThreshold, weightCheckFunction);
    attributes.medThreshold = this._checkUnsignedIntValue("medThreshold", opts.medThreshold, weightCheckFunction);
    attributes.highThreshold = this._checkUnsignedIntValue("highThreshold", opts.highThreshold, weightCheckFunction);

    if (!isUndefined(opts.homeDomain) && !isString(opts.homeDomain)) {
      throw new TypeError('homeDomain argument must be of type String');
    }
    attributes.homeDomain = opts.homeDomain;

    if (opts.signer) {
      let weight = this._checkUnsignedIntValue("signer.weight", opts.signer.weight, weightCheckFunction);
      let key;
      let signerType = opts.signer.signerType;
      let setValues = 0;
      if (isUndefined(opts.signer.signerType) || !this._isValidSignerType(opts.signer.signerType)) {
        throw new Error("Must provide a valid signerType");
      }

      if (opts.signer.ed25519PublicKey) {
        if (!StrKey.isValidEd25519PublicKey(opts.signer.ed25519PublicKey)) {
          throw new Error("signer.ed25519PublicKey is invalid.");
        }
        let rawKey = StrKey.decodeEd25519PublicKey(opts.signer.ed25519PublicKey);
        key = new xdr.SignerKey.signerKeyTypeEd25519(rawKey);
        setValues++;
      }

      if (opts.signer.preAuthTx) {
        if (isString(opts.signer.preAuthTx)) {
          opts.signer.preAuthTx = Buffer.from(opts.signer.preAuthTx, "hex");
        }

        if (!(Buffer.isBuffer(opts.signer.preAuthTx) && opts.signer.preAuthTx.length == 32)) {
          throw new Error("signer.preAuthTx must be 32 bytes Buffer.");
        }
        key = new xdr.SignerKey.signerKeyTypePreAuthTx(opts.signer.preAuthTx);
        setValues++;
      }

      if (opts.signer.sha256Hash) {
        if (isString(opts.signer.sha256Hash)) {
          opts.signer.sha256Hash = Buffer.from(opts.signer.sha256Hash, "hex");
        }

        if (!(Buffer.isBuffer(opts.signer.sha256Hash) && opts.signer.sha256Hash.length == 32)) {
          throw new Error("signer.sha256Hash must be 32 bytes Buffer.");
        }
        key = new xdr.SignerKey.signerKeyTypeHashX(opts.signer.sha256Hash);
        setValues++;
      }

      if (setValues != 1) {
        throw new Error("Signer object must contain exactly one of signer.ed25519PublicKey, signer.sha256Hash, signer.preAuthTx.");
      }

      attributes.signer = new xdr.Signer({key, weight, signerType});
    }

    let setOptionsOp = new xdr.SetOptionsOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.setOption(setOptionsOp);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Transfers native balance to destination account.
   * @param {object} opts
   * @param {string} opts.destination - Destination to merge the source account into.
   * @param {string} [opts.source] - The source account (defaults to transaction source).
   * @returns {xdr.AccountMergeOp}
   */
  static accountMerge(opts) {
    let opAttributes = {};
    if (!StrKey.isValidEd25519PublicKey(opts.destination)) {
      throw new Error("destination is invalid");
    }
    opAttributes.body = xdr.OperationBody.accountMerge(
      Keypair.fromPublicKey(opts.destination).xdrAccountId()
      );
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * This operation adds data entry to the ledger.
   * @param {object} opts
   * @param {string} opts.name - The name of the data entry.
   * @param {string|Buffer} opts.value - The value of the data entry.
   * @param {string} [opts.source] - The optional source account.
   * @returns {xdr.ManageDataOp}
   */
  static manageData(opts) {
    let attributes = {};

    if (!(isString(opts.name) && opts.name.length <= 64)) {
      throw new Error("name must be a string, up to 64 characters");
    }
    attributes.dataName = opts.name;

    if (!isString(opts.value) && !Buffer.isBuffer(opts.value) && opts.value !== null) {
      throw new Error("value must be a string, Buffer or null");
    }

    if (isString(opts.value)) {
      attributes.dataValue = new Buffer(opts.value);
    } else {
      attributes.dataValue = opts.value;
    }

    if (attributes.dataValue !== null && attributes.dataValue.length > 64) {
      throw new Error("value cannot be longer that 64 bytes");
    }

    let manageDataOp = new xdr.ManageDataOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.manageDatum(manageDataOp);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Send an amount of coins from fee pool to an account.
   * @param {object} opts
   * @param {string} opts.destination - Destination account ID to send coins to.
   * @param {string} opts.amount - Amount in XLM the account should be funded for.
   * @returns {xdr.SpendFeeOp}
   */
  static spendFee(opts) {
    if (!StrKey.isValidEd25519PublicKey(opts.destination)) {
      throw new Error("destination is invalid");
    }
    if (!this.isValidAmount(opts.amount)) {
      throw new TypeError(Operation.constructAmountRequirementsError('amount'));
    }
    
    let attributes = {};
    attributes.destination     = Keypair.fromPublicKey(opts.destination).xdrAccountId();
    attributes.amount = this._toXDRAmount(opts.amount);
    
    let spendFeeOp          = new xdr.SpendFeeOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.spendFee(spendFeeOp);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }


  /**
   * Set the amount of fee per operation.
   * @param {object} opts
   * @param {string} opts.baseFee - Amount in XLM to set the fee.
   * @returns {xdr.SetFeeOp}
   */
  static setFee(opts) {
    
    let attributes = {};
    attributes.baseFee = opts.baseFee;
    
    let setFeeOp          = new xdr.SetFeeOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.setFee(setFeeOp);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  /**
   * Returns an XDR RestrictAccountOp. A "restrict account" operations set or clear 
   * account flags restricting or allowing it to send/accept transactions.
   * The flags used in `opts.clearFlags` and `opts.setFlags` can be the following:
   *   - `{@link BlockIncomingFlag}`
   *   - `{@link BlockOutgoingFlag}`
   *
   * It's possible to set/clear multiple flags at once using logical or.
   * @param {object} opts
   * @param {string} opts.account - Restrict this account.
   * @param {(number|string)} [opts.clearFlags] - Bitmap integer for which account flags to clear.
   * @param {(number|string)} [opts.setFlags] - Bitmap integer for which account flags to set.
   * @returns {xdr.RestrictAccountOp}
   * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
   */
  static restrictAccount(opts) {
    let attributes = {};

    attributes.clearFlags = this._checkUnsignedIntValue("clearFlags", opts.clearFlags);
    attributes.setFlags = this._checkUnsignedIntValue("setFlags", opts.setFlags);
    attributes.account  = Keypair.fromPublicKey(opts.account).xdrAccountId();

    let restrictAccountOp = new xdr.RestrictAccountOp(attributes);

    let opAttributes = {};
    opAttributes.body = xdr.OperationBody.restrictAccount(restrictAccountOp);
    this.setSourceAccount(opAttributes, opts);

    return new xdr.Operation(opAttributes);
  }

  static setSourceAccount(opAttributes, opts) {
    if (opts.source) {
      if (!StrKey.isValidEd25519PublicKey(opts.source)) {
        throw new Error("Source address is invalid");
      }
      opAttributes.sourceAccount = Keypair.fromPublicKey(opts.source).xdrAccountId();
    }
  }

  /**
   * Converts the XDR Operation object to the opts object used to create the XDR
   * operation.
   * @param {xdr.Operation} operation - An XDR Operation.
   * @return {Operation}
   */
  static fromXDRObject(operation) {
    function accountIdtoAddress(accountId) {
      return StrKey.encodeEd25519PublicKey(accountId.ed25519());
    }

    let result = {};
    if (operation.sourceAccount()) {
      result.source = accountIdtoAddress(operation.sourceAccount());
    }

    let attrs = operation.body().value();
    switch (operation.body().switch().name) {
      case "createAccount":
      result.type = "createAccount";
      result.destination = accountIdtoAddress(attrs.destination());
      result.startingBalance = this._fromXDRAmount(attrs.startingBalance());
      result.accountType = attrs.body().switch().value;
      break;
      case "emission":
      result.type = "emission";
      result.destination = accountIdtoAddress(attrs.destination());
      result.amount = this._fromXDRAmount(attrs.amount());
      break;
      case "settlement":
      result.type = "settlement";
      result.amount = this._fromXDRAmount(attrs.amount());
      break;
      case "payment":
      result.type = "payment";
      result.destination = accountIdtoAddress(attrs.destination());
      result.asset = Asset.fromOperation(attrs.asset());
      result.amount = this._fromXDRAmount(attrs.amount());
      break;
      case "setOption":
      result.type = "setOptions";
      if (attrs.inflationDest()) {
        result.inflationDest = accountIdtoAddress(attrs.inflationDest());
      }

      result.clearFlags = attrs.clearFlags();
      result.setFlags = attrs.setFlags();
      result.masterWeight = attrs.masterWeight();
      result.lowThreshold = attrs.lowThreshold();
      result.medThreshold = attrs.medThreshold();
      result.highThreshold = attrs.highThreshold();
      result.homeDomain = attrs.homeDomain();

      if (attrs.signer()) {
        let signer = {};
        let arm = attrs.signer().key().arm();
        if (arm == "ed25519") {
          signer.ed25519PublicKey = accountIdtoAddress(attrs.signer().key());
        } else if (arm == "preAuthTx") {
          signer.preAuthTx = attrs.signer().key().preAuthTx();
        } else if (arm == "hashX") {
          signer.sha256Hash = attrs.signer().key().hashX();
        }

        signer.weight = attrs.signer().weight();
        signer.signerType = attrs.signer().signerType();
        result.signer = signer;
      }
      break;
      case "accountMerge":
      result.type = "accountMerge";
      result.destination = accountIdtoAddress(attrs);
      break;
      case "manageDatum":
      result.type = "manageData";
      result.name = attrs.dataName();
      result.value = attrs.dataValue();
      break;
      case "setFee":
      result.type = "setFee";
      result.baseFee = attrs.baseFee();
      break;
      case "spendFee":
      result.type = "spendFee";
      result.destination = accountIdtoAddress(attrs.destination());
      result.amount = this._fromXDRAmount(attrs.amount());
      break;
      case "restrictAccount":
      result.type = "restrictAccount";
      result.account = accountIdtoAddress(attrs.account());
      result.clearFlags = attrs.clearFlags();
      result.setFlags = attrs.setFlags();
      break;
      
      default:
      throw new Error("Unknown operation");
    }
    return result;
  }

  static isValidAmount(value, allowZero = false) {
    if (!isString(value)) {
      return false;
    }

    let amount;
    try {
      amount = new BigNumber(value);
    } catch (e) {
      return false;
    }

    // == 0
    if (!allowZero && amount.isZero()) {
      return false;
    }

    // < 0
    if (amount.isNegative()) {
      return false;
    }

    // > Max value
    if (amount.times(ONE).greaterThan(new BigNumber(MAX_INT64).toString())) {
      return false;
    }

    // Decimal places (max 7)
    if (amount.decimalPlaces() > 7) {
      return false;
    }

    // Infinity
    if (!amount.isFinite()) {
      return false;
    }

    // NaN
    if (amount.isNaN()) {
      return false;
    }

    return true;
  }

  static _accountTypeFromNumber(rawAccountType) {
    if (!this._isValidAccountType(rawAccountType)) {
      throw new Error(`XDR Read Error: Unknown AccountType member for value ${rawAccountType}`);
    }

    return xdr.AccountType._byValue.get(rawAccountType);
  }

  static _isValidAccountType(rawAccountType) {
    return xdr.AccountType._byValue.has(rawAccountType);
  }

  static _signerTypeFromNumber(rawSignerType) {
    if (!this._isValidSignerType(rawSignerType)) {
      throw new Error(`XDR Read Error: Unknown SignerType member for value ${rawSignerType}`);
    }

    return xdr.SignerType._byValue.get(rawSignerType);
  }

  static _isValidSignerType(rawSignerType) {
    return xdr.SignerType._byValue.has(rawSignerType);
  }

  static constructAmountRequirementsError(arg) {
    return `${arg} argument must be of type String, represent a positive number and have at most 7 digits after the decimal`;
  }

  /**
   * Returns value converted to uint32 value or undefined.
   * If `value` is not `Number`, `String` or `Undefined` then throws an error.
   * Used in {@link Operation.setOptions}.
   * @private
   * @param {string} name Name of the property (used in error message only)
   * @param {*} value Value to check
   * @param {function(value, name)} isValidFunction Function to check other constraints (the argument will be a `Number`)
   * @returns {undefined|Number}
   * @private
   */
  static _checkUnsignedIntValue(name, value, isValidFunction = null) {
    if (isUndefined(value)) {
      return undefined;
    }

    if (isString(value)) {
      value = parseFloat(value);
    }

    if (!isNumber(value) || !isFinite(value) || value % 1 !== 0) {
      throw new Error(`${name} value is invalid`);
    }

    if (value < 0) {
      throw new Error(`${name} value must be unsigned`);
    }

    if (!isValidFunction ||
      (isValidFunction && isValidFunction(value, name))) {
      return value;
    }

    throw new Error(`${name} value is invalid`);
  }

  /**
   * @private
   */
  static _toXDRAmount(value) {
    let amount = new BigNumber(value).mul(ONE);
    return Hyper.fromString(amount.toString());
  }

  /**
   * @private
   */
  static _fromXDRAmount(value) {
    return new BigNumber(value).div(ONE).toString();
  }

  /**
   * @private
   */
  static _fromXDRPrice(price) {
    let n = new BigNumber(price.n());
    return n.div(new BigNumber(price.d())).toString();
  }

  /**
   * @private
   */
  static _toXDRPrice(price) {
    let xdrObject;
    if (price.n && price.d) {
      xdrObject = new xdr.Price(price);
    } else {
      price = new BigNumber(price);
      let approx = best_r(price);
      xdrObject = new xdr.Price({
        n: parseInt(approx[0]),
        d: parseInt(approx[1])
      });
    }

    if (xdrObject.n() < 0 || xdrObject.d() < 0) {
      throw new Error('price must be positive');
    }

    return xdrObject;
  }
}
