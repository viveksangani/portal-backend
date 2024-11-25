const ApiSubscription = require('../models/ApiSubscription');

const checkApiSubscription = async (req, res, next) => {
  try {
    // Get the full path and extract the API name
    const fullPath = req.path;
    let apiName = fullPath.substring(1); // Remove leading slash

    // Map paths to API names
    const pathToApiMap = {
      'swaroop-welcome': 'welcome',
      'welcome': 'welcome'
    };

    // Use mapped API name if available
    apiName = pathToApiMap[apiName] || apiName;

    console.log('Checking subscription for:', {
      fullPath,
      apiName,
      userId: req.user.id,
      method: req.method
    });

    // Find active subscription
    const subscription = await ApiSubscription.findOne({
      userId: req.user.id,
      apiName,
      status: 'ACTIVE'
    });

    console.log('Found subscription:', subscription);

    if (!subscription) {
      return res.status(403).json({
        message: 'Please subscribe to this API first',
        subscriptionRequired: true,
        apiName,
        currentPath: fullPath
      });
    }

    // Update usage statistics
    subscription.lastUsed = new Date();
    subscription.usageCount += 1;
    await subscription.save();

    // Add subscription to request for later use
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error checking API subscription:', error);
    res.status(500).json({ message: 'Error checking API subscription' });
  }
};

module.exports = checkApiSubscription; 