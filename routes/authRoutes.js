const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');
const Subscription = require('../models/Subscription');
const SUBSCRIPTION_PLANS = require('../config/subscriptionPlans');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiSubscription = require('../models/ApiSubscription');
const wsService = require('../services/WebSocketService');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-username', authController.forgotUsername);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', verifyToken, authController.getMe);

// Token management routes
router.route('/tokens')
  .get(verifyToken, authController.getTokens)
  .post(verifyToken, authController.createToken);

router.delete('/tokens/:tokenId', verifyToken, authController.deleteToken);

// Transaction history routes
router.get('/transactions', verifyToken, authController.getTransactions);

// Subscription routes
router.get('/subscriptions', verifyToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id });
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

router.post('/subscriptions', verifyToken, async (req, res) => {
  try {
    const { plan, apiName, billingCycle } = req.body;
    const userId = req.user.id;

    // Check if user already has a subscription for this API
    const existingSubscription = await Subscription.findOne({ userId, apiName });
    if (existingSubscription) {
      return res.status(400).json({ message: 'You already have a subscription for this API' });
    }

    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS[apiName].find(p => p.name === plan);
    if (!planDetails) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Create subscription
    const subscription = new Subscription({
      userId,
      apiName,
      plan,
      features: planDetails.features.map(f => ({
        name: f.name,
        limit: f.limit,
        used: 0
      })),
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: true,
      price: planDetails.price,
      billingCycle
    });

    await subscription.save();

    // Create transaction record if it's a paid plan
    if (planDetails.price > 0) {
      const transaction = new Transaction({
        userId,
        type: 'DEBIT',
        amount: planDetails.price,
        description: `Subscription: ${apiName} - ${plan} Plan`,
        balance: req.user.credits - planDetails.price,
        source: 'SUBSCRIPTION'
      });
      await transaction.save();

      // Update user credits
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: -planDetails.price }
      });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Add this route to get available plans
router.get('/subscription-plans', verifyToken, async (req, res) => {
  try {
    console.log('Sending subscription plans:', SUBSCRIPTION_PLANS);
    res.json(SUBSCRIPTION_PLANS);
  } catch (error) {
    console.error('Error in subscription-plans route:', error);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
});

// Get user's API subscriptions
router.get('/api-subscriptions', verifyToken, async (req, res) => {
  try {
    const subscriptions = await ApiSubscription.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching API subscriptions:', error);
    res.status(500).json({ message: 'Error fetching API subscriptions' });
  }
});

// Subscribe to an API
router.post('/api-subscriptions', verifyToken, async (req, res) => {
  try {
    const { apiName } = req.body;
    const userId = req.user.id;

    console.log('Subscribing to API:', { userId, apiName }); // Debug log

    // Check if subscription already exists
    let subscription = await ApiSubscription.findOne({ userId, apiName });
    console.log('Existing subscription:', subscription); // Debug log
    
    if (subscription) {
      if (subscription.status === 'ACTIVE') {
        return res.status(400).json({ 
          message: 'You are already subscribed to this API' 
        });
      }
      // Reactivate existing subscription
      subscription.status = 'ACTIVE';
      subscription.subscribedAt = new Date();
      await subscription.save();
      console.log('Reactivated subscription:', subscription); // Debug log
    } else {
      // Create new subscription
      subscription = new ApiSubscription({
        userId,
        apiName,
        status: 'ACTIVE',
        subscribedAt: new Date()
      });
      await subscription.save();
      console.log('Created new subscription:', subscription); // Debug log
    }

    // Notify user through WebSocket
    wsService.sendToUser(userId, {
      type: 'subscription_update',
      status: 'subscribed',
      apiName
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error subscribing to API:', error);
    res.status(500).json({ message: 'Error subscribing to API' });
  }
});

// Unsubscribe from an API
router.delete('/api-subscriptions/:apiName', verifyToken, async (req, res) => {
  try {
    const { apiName } = req.params;
    const userId = req.user.id;

    const subscription = await ApiSubscription.findOne({ userId, apiName });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    subscription.status = 'INACTIVE';
    subscription.updatedAt = new Date();
    await subscription.save();

    // Notify user through WebSocket
    wsService.sendToUser(userId, {
      type: 'subscription_update',
      status: 'unsubscribed',
      apiName
    });

    res.json({ message: 'Successfully unsubscribed from API' });
  } catch (error) {
    console.error('Error unsubscribing from API:', error);
    res.status(500).json({ 
      message: 'Error unsubscribing from API',
      error: error.message 
    });
  }
});

// Add this route
router.get('/check-super-admin', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ 
      isAdmin: user?.isAdmin || false,
      isSuperAdmin: user?.isSuperAdmin || false 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
});

module.exports = router;





