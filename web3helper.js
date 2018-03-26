const Web3 = require('web3');
const fetch = require('node-fetch');

class Web3Helper {
    /**
     * @param {string} provider
     */
    constructor(provider) {
        this.provider = provider;
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.provider));
    }

    /**
     * @param {number} time
     * @returns {Promise.<*>}
     */
    timeoutPromise(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    /**
     * @param {string} contractAddress
     * @returns {Promise.<object>}
     */
    loadAbi(contractAddress) {
        return fetch('https://api.etherscan.io/api?module=contract&action=getabi&address=' + contractAddress)
            .then(response => response.json().then(json => JSON.parse(json.result)))
            .catch(error => console.log(error));
    }

    /**
     * @returns {Promise.<Eth.Contract>}
     */
    loadContract(contractAddress) {
        return this.loadAbi(contractAddress)
            .then(abi => new this.web3.eth.Contract(abi, contractAddress));
    }

    /**
     * @TODO end/reject? how we do give up on a TX? how long?
     * @param {string} txHash
     * @returns {Promise.<object>}
     */
    waitUntilTxMined(txHash) {
        return this.web3Helper.eth.getTransaction(txHash)
            .then(tx => {
                console.log('poll tx');
                console.log(tx);

                if (tx && tx.blockNumber) {
                    return tx;
                } else {
                    // @TODO reject when?
                    if (false) {
                        return Promise.reject(tx);
                    }

                    return this.timeoutPromise(15000)
                        .then(() => this.waitUntilTxMined(txHash));
                }
            });
    }
}

module.exports = Web3Helper;
