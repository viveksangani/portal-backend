const eventEmitter = require('../services/EventService');

const cleanupMiddleware = (req, res, next) => {
    req.on('close', () => {
        if (req.eventListener) {
            eventEmitter.removeListener(`transaction:${req.user?._id}`, req.eventListener);
        }
    });
    next();
};

module.exports = cleanupMiddleware; 