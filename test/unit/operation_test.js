import BigNumber from 'bignumber.js';
import crypto from 'crypto';
import isString from 'lodash/isString';

describe('Operation', function() {

    describe(".createAccount()", function () {
        it("creates a createAccountOp", function () {
            var destination = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";
            var startingBalance = '1000';
            var accountType = StellarBase.xdr.AccountType.accountAnonymousUser().value;
            let op = StellarBase.Operation.createAccount({destination, startingBalance, accountType});
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("createAccount");
            expect(obj.destination).to.be.equal(destination);
            expect(obj.accountType).to.be.equal(accountType);
            expect(operation.body().value().startingBalance().toString()).to.be.equal('10000000000');
            expect(obj.startingBalance).to.be.equal(startingBalance);
        });

        it("fails to create createAccount operation with an invalid destination address", function () {
            let opts = {
                destination: 'GCEZW',
                startingBalance: '20',
                accountType: StellarBase.xdr.AccountType.accountAnonymousUser().value,
                source: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
            };
            expect(() => StellarBase.Operation.createAccount(opts)).to.throw(/destination is invalid/)
        });

        it("fails to create createAccount operation with an invalid startingBalance", function () {
            let opts = {
                destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
                startingBalance: 20,
                accountType: StellarBase.xdr.AccountType.accountAnonymousUser().value,
                source: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ'
            };
            expect(() => StellarBase.Operation.createAccount(opts)).to.throw(/startingBalance argument must be of type String, represent a positive number and have at most 7 digits after the decimal/)
        });

        it("fails to create createAccount operation with an invalid source address", function () {
            let opts = {
                destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
                startingBalance: '20',
                accountType: StellarBase.xdr.AccountType.accountAnonymousUser().value,
                source: 'GCEZ'
            };
            expect(() => StellarBase.Operation.createAccount(opts)).to.throw(/Source address is invalid/)
        });
    });

    describe(".emission()", function () {
        it("creates a emissionOp", function () {
            var destination = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";
            var amount = "1000";
            let op = StellarBase.Operation.emission({destination, amount});
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("emission");
            expect(obj.destination).to.be.equal(destination);
            expect(obj.amount).to.be.equal(amount);
        });

        it("fails to create emission with an invalid destination address", function () {
            let opts = {
                destination: 'GCEZW',
                amount: '20',
            };
            expect(() => StellarBase.Operation.createAccount(opts)).to.throw(/destination is invalid/)
        });
    });

    describe(".settlement()", function () {
        it("creates a settlementOp", function () {
            var amount = "1000";
            let op = StellarBase.Operation.settlement({amount});
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("settlement");
            expect(obj.amount).to.be.equal(amount);
        });


        it("fails to create settlement with an invalid amount", function () {
            let opts = {
                amount: 'invalid_amount',
            };
            expect(() => StellarBase.Operation.settlement(opts)).to.throw(/represent a positive number/)
        });

        it("fails to create settlement with a negative amount", function () {
            let opts = {
                destination: 'GCEZW',
                amount: '-20',
            };
            expect(() => StellarBase.Operation.settlement(opts)).to.throw(/represent a positive number/)
        });

    });

    describe(".payment()", function () {
        it("creates a paymentOp", function () {
            var destination = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ";
            var amount = "1000";
            let op = StellarBase.Operation.payment({destination, amount});
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("payment");
            expect(obj.destination).to.be.equal(destination);
            expect(operation.body().value().amount().toString()).to.be.equal('10000000000');
            expect(obj.amount).to.be.equal(amount);
        });

        it("fails to create payment operation with an invalid destination address", function () {
            let opts = {
                destination: 'GCEZW',
                amount: '20'
            };
            expect(() => StellarBase.Operation.payment(opts)).to.throw(/destination is invalid/)
        });

        it("fails to create payment operation with an invalid amount", function () {
            let opts = {
                destination: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ',
                amount: 20
            };
            expect(() => StellarBase.Operation.payment(opts)).to.throw(/amount argument must be of type String/)
        });
    });



    describe(".setOptions()", function () {
        it("auth flags are set correctly", function () {
            expect(StellarBase.AuthRequiredFlag).to.be.equal(1);
            expect(StellarBase.AuthRevocableFlag).to.be.equal(2);
            expect(StellarBase.AuthImmutableFlag).to.be.equal(4);
        });

        it("creates a setOptionsOp", function () {
            var opts = {};
            opts.inflationDest = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
            opts.clearFlags = StellarBase.AuthRevocableFlag | StellarBase.AuthImmutableFlag;
            opts.setFlags = StellarBase.AuthRequiredFlag;
            opts.masterWeight = 0;
            opts.lowThreshold = 1;
            opts.medThreshold = 2;
            opts.highThreshold = 3;

            opts.signer = {
                ed25519PublicKey: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
                signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                weight: 1
            };
            opts.homeDomain = "www.example.com";
            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expect(obj.type).to.be.equal("setOptions");
            expect(obj.inflationDest).to.be.equal(opts.inflationDest);
            expect(obj.clearFlags).to.be.equal(6);
            expect(obj.setFlags).to.be.equal(1);
            expect(obj.masterWeight).to.be.equal(opts.masterWeight);
            expect(obj.lowThreshold).to.be.equal(opts.lowThreshold);
            expect(obj.medThreshold).to.be.equal(opts.medThreshold);
            expect(obj.highThreshold).to.be.equal(opts.highThreshold);

            expect(obj.signer.ed25519PublicKey).to.be.equal(opts.signer.ed25519PublicKey);
            expect(obj.signer.weight).to.be.equal(opts.signer.weight);
            expect(obj.signer.signerType).to.be.equal(opts.signer.signerType);
            expect(obj.homeDomain).to.be.equal(opts.homeDomain);
        });

        it("creates a setOptionsOp with preAuthTx signer", function () {
            var opts = {};

            var hash = crypto.createHash('sha256').update("Tx hash").digest();

            opts.signer = {
                preAuthTx: hash,
                signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                weight: 10
            };
            
            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expectBuffersToBeEqual(obj.signer.preAuthTx, hash);
            expect(obj.signer.weight).to.be.equal(opts.signer.weight);
            expect(obj.signer.signerType).to.be.equal(opts.signer.signerType);
        });

        it("creates a setOptionsOp with preAuthTx signer from a hex string", function () {
            var opts = {};

            var hash = crypto.createHash('sha256').update("Tx hash").digest('hex');
            expect(isString(hash)).to.be.true;


            opts.signer = {
                preAuthTx: hash,
                signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                weight: 10
            };

            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expectBuffersToBeEqual(obj.signer.preAuthTx, hash);
            expect(obj.signer.weight).to.be.equal(opts.signer.weight);
            expect(obj.signer.signerType).to.be.equal(opts.signer.signerType);
        });

        it("creates a setOptionsOp with hash signer", function () {
            var opts = {};

            var hash = crypto.createHash('sha256').update("Hash Preimage").digest();

            opts.signer = {
                sha256Hash: hash,
                signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                weight: 10
            };
            
            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expectBuffersToBeEqual(obj.signer.sha256Hash, hash);
            expect(obj.signer.weight).to.be.equal(opts.signer.weight);
            expect(obj.signer.signerType).to.be.equal(opts.signer.signerType);
        });

        it("creates a setOptionsOp with hash signer from a hex string", function () {
            var opts = {};

            var hash = crypto.createHash('sha256').update("Hash Preimage").digest('hex');
            expect(isString(hash)).to.be.true

            opts.signer = {
                sha256Hash: hash,
                signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                weight: 10
            };

            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expectBuffersToBeEqual(obj.signer.sha256Hash, hash);
            expect(obj.signer.weight).to.be.equal(opts.signer.weight);
            expect(obj.signer.signerType).to.be.equal(opts.signer.signerType);
        });

        it("string setFlags", function() {
            let opts = {
                setFlags: '4'
            };
            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expect(obj.type).to.be.equal("setOptions");
            expect(obj.setFlags).to.be.equal(4);
        });

        it("fails to create setOptions operation with an invalid setFlags", function () {
            let opts = {
                setFlags: {}
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw();
        });

        it("string clearFlags", function() {
            let opts = {
                clearFlags: '4'
            };
            let op = StellarBase.Operation.setOptions(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);

            expect(obj.type).to.be.equal("setOptions");
            expect(obj.clearFlags).to.be.equal(4);
        });

        it("fails to create setOptions operation with an invalid clearFlags", function () {
            let opts = {
                clearFlags: {}
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw();
        });

        it("fails to create setOptions operation with an invalid inflationDest address", function () {
            let opts = {
                inflationDest: 'GCEZW'
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/inflationDest is invalid/)
        });

        it("fails to create setOptions operation with an invalid signer address", function () {
            let opts = {
                signer: {
                    ed25519PublicKey: "GDGU5OAPHNPU5UCL",
                    signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                    weight: 1
                }
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/signer.ed25519PublicKey is invalid/)
        });

        it("fails to create setOptions operation with multiple signer values", function () {
            let opts = {
                signer: {
                    ed25519PublicKey: "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7",
                    sha256Hash: new Buffer(32),
                    signerType: StellarBase.xdr.SignerType.signerGeneral().value,
                    weight: 1
                }
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/Signer object must contain exactly one/)
        });

        it("fails to create setOptions operation with an invalid masterWeight", function() {
            let opts = {
                masterWeight: 400
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/masterWeight value must be between 0 and 255/)
        });

        it("fails to create setOptions operation with an invalid lowThreshold", function() {
            let opts = {
                lowThreshold: 400
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/lowThreshold value must be between 0 and 255/)
        });

        it("fails to create setOptions operation with an invalid medThreshold", function() {
            let opts = {
                medThreshold: 400
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/medThreshold value must be between 0 and 255/)
        });

        it("fails to create setOptions operation with an invalid highThreshold", function() {
            let opts = {
                highThreshold: 400
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/highThreshold value must be between 0 and 255/)
        });

        it("fails to create setOptions operation with an invalid homeDomain", function() {
            let opts = {
                homeDomain: 67238
            };
            expect(() => StellarBase.Operation.setOptions(opts)).to.throw(/homeDomain argument must be of type String/)
        });
    });

    describe(".accountMerge", function () {
        it("creates a accountMergeOp", function () {
            var opts = {};
            opts.destination = "GDGU5OAPHNPU5UCLE5RDJHG7PXZFQYWKCFOEXSXNMR6KRQRI5T6XXCD7";
            let op = StellarBase.Operation.accountMerge(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("accountMerge");
            expect(obj.destination).to.be.equal(opts.destination);
        });

        it("fails to create accountMerge operation with an invalid destination address", function () {
            let opts = {
                destination: 'GCEZW'
            };
            expect(() => StellarBase.Operation.accountMerge(opts)).to.throw(/destination is invalid/)
        });
    });

    // describe(".inflation", function () {
    //     it("creates a inflationOp", function () {
    //         let op = StellarBase.Operation.inflation();
    //         var xdr = op.toXDR("hex");
    //         var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
    //         var obj = StellarBase.Operation.fromXDRObject(operation);
    //         expect(obj.type).to.be.equal("inflation");
    //     });
    // });

    describe(".manageData", function () {
        it("creates a manageDataOp with string value", function () {
            var opts = {
                name: "name",
                value: "value"
            };
            let op = StellarBase.Operation.manageData(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("manageData");
            expect(obj.name).to.be.equal(opts.name);
            expect(obj.value.toString('hex')).to.be.equal(new Buffer(opts.value).toString('hex'));
        });

        it("creates a manageDataOp with Buffer value", function () {
            var opts = {
                name: "name",
                value: new Buffer("value")
            };
            let op = StellarBase.Operation.manageData(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("manageData");
            expect(obj.name).to.be.equal(opts.name);
            expect(obj.value.toString('hex')).to.be.equal(opts.value.toString('hex'));
        });

        it("creates a manageDataOp with null dataValue", function () {
            var opts = {
                name: "name",
                value: null
            };
            let op = StellarBase.Operation.manageData(opts);
            var xdr = op.toXDR("hex");
            var operation = StellarBase.xdr.Operation.fromXDR(new Buffer(xdr, "hex"));
            var obj = StellarBase.Operation.fromXDRObject(operation);
            expect(obj.type).to.be.equal("manageData");
            expect(obj.name).to.be.equal(opts.name);
            expect(obj.value).to.be.undefined;
        });

        describe("fails to create manageData operation", function () {
            it("name is not a string", function () {
                expect(() => StellarBase.Operation.manageData({name: 123})).to.throw()
            });

            it("name is too long", function () {
                expect(() => StellarBase.Operation.manageData({name: "a".repeat(65)})).to.throw()
            });

            it("value is too long", function () {
                expect(() => StellarBase.Operation.manageData({name: "a", value: new Buffer(65)})).to.throw()
            });
        });
    });

    describe("._checkUnsignedIntValue()", function () {
        it("returns true for valid values", function () {
            let values = [
                {value: 0, expected: 0},
                {value: 10, expected: 10},
                {value: "0", expected: 0},
                {value: "10", expected: 10},
                {value: undefined, expected: undefined}
            ];

            for (var i in values) {
                let {value, expected} = values[i];
                expect(StellarBase.Operation._checkUnsignedIntValue(value, value)).to.be.equal(expected);
            }
        });

        it("throws error for invalid values", function () {
            let values = [
                {},
                [],
                "", // empty string
                "test", // string not representing a number
                "0.5",
                "-10",
                "-10.5",
                "Infinity",
                Infinity,
                "Nan",
                NaN
            ];

            for (var i in values) {
                let value = values[i];
                expect(() => StellarBase.Operation._checkUnsignedIntValue(value, value)).to.throw();
            }
        });

        it("return correct values when isValidFunction is set", function () {
            expect(
                StellarBase.Operation._checkUnsignedIntValue("test", undefined, value => value < 10)
            ).to.equal(undefined);

            expect(
                StellarBase.Operation._checkUnsignedIntValue("test", 8, value => value < 10)
            ).to.equal(8);
            expect(
                StellarBase.Operation._checkUnsignedIntValue("test", "8", value => value < 10)
            ).to.equal(8);

            expect(() => {
                StellarBase.Operation._checkUnsignedIntValue("test", 12, value => value < 10);
            }).to.throw();
            expect(() => {
                StellarBase.Operation._checkUnsignedIntValue("test", "12", value => value < 10);
            }).to.throw();
        });
    });

    describe(".isValidAmount()", function () {
        it("returns true for valid amounts", function () {
            let amounts = [
              "10",
              "0.10",
              "0.1234567",
              "922337203685.4775807" // MAX
            ];

            for (var i in amounts) {
                expect(StellarBase.Operation.isValidAmount(amounts[i])).to.be.true;
            }
        });

        it("returns false for invalid amounts", function () {
            let amounts = [
                100, // integer
                100.50, // float
                "", // empty string
                "test", // string not representing a number
                "0",
                "-10",
                "-10.5",
                "0.12345678",
                "922337203685.4775808", // Overflow
                "Infinity",
                Infinity,
                "Nan",
                NaN
            ];

            for (var i in amounts) {
                expect(StellarBase.Operation.isValidAmount(amounts[i])).to.be.false;
            }
        });

        it("allows 0 only if allowZero argument is set to true", function () {
            expect(StellarBase.Operation.isValidAmount("0")).to.be.false;
            expect(StellarBase.Operation.isValidAmount("0", true)).to.be.true;
        });
    });
});

function expectBuffersToBeEqual(left, right) {
    let leftHex = left.toString('hex');
    let rightHex = right.toString('hex');
    expect(leftHex).to.eql(rightHex);
}
