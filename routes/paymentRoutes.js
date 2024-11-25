const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middleware/authMiddleware');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.post('/initiate', verifyToken, paymentController.initiatePayment);

// Add subscription payment route
router.post('/subscription', verifyToken, async (req, res) => {
  try {
    const { subscriptionId, paymentMethod } = req.body;
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ _id: subscriptionId, userId });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user has enough credits
    const user = await User.findById(userId);
    if (user.credits < subscription.price) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Process payment
    const transaction = new Transaction({
      userId,
      type: 'DEBIT',
      amount: subscription.price,
      description: `Subscription renewal: ${subscription.apiName} - ${subscription.plan}`,
      balance: user.credits - subscription.price,
      source: 'SUBSCRIPTION',
      metadata: {
        subscriptionId: subscription._id,
        paymentMethod
      }
    });

    // Update subscription dates
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + 1);
    subscription.endDate = newEndDate;
    
    await Promise.all([
      transaction.save(),
      subscription.save(),
      User.findByIdAndUpdate(userId, { $inc: { credits: -subscription.price } })
    ]);

    res.json({ message: 'Payment successful', subscription });
  } catch (error) {
    console.error('Error processing subscription payment:', error);
    res.status(500).json({ message: 'Error processing payment' });
  }
});

module.exports = router; 