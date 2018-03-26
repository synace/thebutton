#!/usr/bin/env node

const Web3Helper = require('./web3helper.js');
const blessed = require('blessed');

class TheButton {

    constructor(key) {
        this.web3Helper = new Web3Helper('https://mainnet.infura.io/');
        this.web3 = null;

        this.contractAddress = '0xF7f6B7164FB3ab456715D2E8B84E8BAaC8BD09a9';
        this.contract = null;

        this.key = key;
        this.account = this.web3Helper.web3.eth.accounts.privateKeyToAccount(this.key);
        this.updating = false;

        this.status = 'idle';
        this.log = '';

        this.balance = null;
        this.blockNumber = null;
        this.endBlock = null;

        this.lastPresser = null;
        this.lastPresserCount = null;
        this.lastPresserUnlock = null;

        this.pressCount = null;
        this.pressUnlock = null;

        this.pressing = false;
        this.txHash = null;
        this.gasPrice = null;

        this.screen = null;
        this.screenText = null;
    }

    /**
     * @returns {Promise.<boolean>}
     */
    run() {
        setInterval(() => {
            this.render();
        }, 500);

        return this.init()
            .then(() => this.loop());
    }

    /**
     * @returns {Promise.<object>}
     */
    init() {
         return this.web3Helper.loadContract(this.contractAddress)
            .then(contract => {
                return this.contract = contract;
            });
    }

    /**
     * @returns {Promise.<boolean>}
     */
    loop() {
        return this.update()
            .then(() => this.web3Helper.timeoutPromise(30000))
            .then(() => this.loop());
    }

    /**
     * @returns {Promise.<boolean>}
     */
    update() {
        if (!this.key) {
            this.status = 'No Key Provided!';
            return Promise.resolve(false);
        }

        if (this.updating) {
            this.status = 'Updating...';
            return Promise.resolve(false);
        }

        this.log = 'Update...';
        this.updating = true;

        return Promise.all([
                this.web3Helper.web3.eth.getBalance(this.contractAddress),
                this.web3Helper.web3.eth.getBlockNumber(),
                this.web3Helper.web3.eth.getGasPrice(),
                this.contract.methods.endBlock().call(),
                this.contract.methods.lastPresser().call()
                    .then(lastPresser => {
                        this.lastPresser = lastPresser;
                        return this.contract.methods.pressers(lastPresser).call();
                    }),
                this.contract.methods.pressers(this.account.address).call(),
            ])
            .then(([
                balance,
                blockNumber,
                gasPrice,
                endBlock,
                lastPresser,
                selfPresser,
            ]) => {
                this.log += 'Got updates...';

                this.balance = this.web3Helper.web3.utils.fromWei(balance, 'ether');
                this.blockNumber = blockNumber;
                this.gasPrice = gasPrice;
                this.endBlock = endBlock;

                this.lastPresserCount = lastPresser[0];
                this.lastPresserUnlock = lastPresser[1];

                this.pressCount = selfPresser[0];
                this.pressUnlock = selfPresser[1];

                if (this.lastPresser == this.account.address) {
                    this.status = 'Am last presser, hanging tough';
                } else if (this.gasPrice < 0 || this.gasPrice > 10000000000) {
                    this.status = 'Gas price too high, waiting';
                } else if (this.lastPresser != this.account.address) {
                    if (this.blockNumber < this.pressUnlock) {
                        if (this.pressUnlock >= this.endBlock) {
                            this.status = 'Can\'t press in time to prevent win!!!!!!';
                        } else {
                            this.status = 'Can\'t press yet';
                        }
                    } else {
                        this.status = 'Can press';
                        this.log += 'Would press...';

                        return this.press();
                    }
                } else {
                    this.status = 'Do nothing';
                    this.log += 'Would do nothing...';
                }

                this.updating = false;
                this.log = '';

                return true;
            });
    }

    /**
     * @returns {Promise.<boolean>}
     */
    press() {
        if (this.pressing) {
            return Promise.resolve(false);
        }
        this.pressing = true;

        this.status = 'Pressing';

        const pollTx = (txHash) => {
            return this.web3Helper.waitUntilTxMined(txHash)
                .then(tx => {
                    this.status = 'Sent tx in block number' + tx.blockNumber;
                    return tx;
                })
                .catch(tx => {
                    this.status = 'Did not send tx ' + tx.transactionHash;
                    return tx;
                });
        };

        return this.web3Helper.web3.eth.getTransactionCount(this.account.address)
            .then(nonce => ({
                nonce: nonce,
                from: this.account.address,
                to: this.contractAddress,
                data: this.contract.methods.press().encodeABI(),
                value: this.web3Helper.web3.utils.toWei('0.001', 'ether'),
                gas: 60000,
                gasPrice: this.gasPrice
            }))
            .then(tx => this.account.signTransaction(tx))
            .then(transaction => {
                this.status = 'Sending';

                return this.web3Helper.web3.eth.sendSignedTransaction(transaction.rawTransaction)
                    .once('transactionHash', hash => {
                        this.log += "\n" + 'transactionHash:' + hash;
                        this.txHash = hash;
                    })
                    .once('receipt', receipt => {
                        this.log += "\n" + 'receipt:' + receipt;
                    })
                    .on('confirmation', (confNumber, receipt) => {
                        this.log += '...' + 'confirmation:' + confNumber;
                    })
                    .on('error', error => {
                        this.log += "\n" + 'error:' + error;
                    })
                    .then(result => {
                        this.log += "\n" + 'sent:' + result;

                        this.status = 'Success? Polling ' + this.txHash;

                        return pollTx(this.txHash);
                    })
                    .catch(e => {
                        this.log += "\n" + 'caught:' + e;

                        this.status = 'Error? Polling ' + this.txHash;

                        return pollTx(this.txHash);
                    })
                    .then(tx => {
                        this.pressing = false;

                        return tx;
                    });
            });
    }

    render() {
        if (!this.screen) {
            this.screen = blessed.screen({
                title: 'TheButton',
                smartCSR: true
            });
            this.screen.key(['escape', 'q', 'C-c'], function (ch, key) {
                return process.exit(0);
            });
            this.screenText = blessed.text({
                parent: this.screen,
                content: 'TheButton...'
            });
        }

        this.screenText.setContent([
            'Account: ' + this.account.address,
            'Updating: ' + (this.updating ? 'yes' : ''),
            'contractAddress: ' + this.contractAddress,
            'balance: ' + this.balance,
            'blockNumber: ' + this.blockNumber,
            'endBlock: ' + this.endBlock,
            'lastPresserCount: ' + this.lastPresserCount,
            'lastPresserUnlock: ' + this.lastPresserUnlock,
            'lastPresserBlocksToGo: ' + (this.lastPresserUnlock - this.blockNumber),
            'pressCount: ' + this.pressCount,
            'pressUnlock: ' + this.pressUnlock,
            'pressBlocksToGo:' + (this.pressUnlock - this.blockNumber),
            'pressing: ' + this.pressing,
            'txHash: ' + this.txHash,
            'gasPrice: ' + this.gasPrice,
            'Status: ' + this.status,
            'Log: ' + this.log,
        ].join("\n"));

        this.screen.render();
    }
}

const button = new TheButton('yourprivatekeygoeshere');
button.run();
