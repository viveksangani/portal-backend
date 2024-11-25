const EventEmitter = require('events');

class TransactionEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
    }

    async emitTransaction(userId, transaction) {
        try {
            this.emit(`transaction:${userId}`, transaction);
        } catch (error) {
            console.error('Error emitting transaction:', error);
        }
    }
}

module.exports = new TransactionEventEmitter(); 