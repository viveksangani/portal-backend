const express = require('express');
const router = express.Router();
const multer = require('multer');
const apiController = require('../controllers/apiController');
const idCardController = require('../controllers/idCardController');
const verifyToken = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const ApiLog = require('../models/ApiLog');
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const checkApiSubscription = require('../middleware/checkApiSubscription');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication
router.use(verifyToken);

// Add this middleware after verifyToken
const checkSubscription = async (req, res, next) => {
  try {
    const apiName = req.path.substring(1); // Remove leading slash
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      apiName,
      status: 'ACTIVE',
      endDate: { $gt: new Date() }
    });

    if (!subscription && apiName !== 'welcome') {
      return res.status(403).json({ 
        message: 'No active subscription found for this API',
        subscriptionRequired: true
      });
    }

    // Check API limits if subscription exists
    if (subscription) {
      const apiCallsFeature = subscription.features.find(f => f.name === 'API Calls');
      if (apiCallsFeature && apiCallsFeature.used >= apiCallsFeature.limit) {
        return res.status(429).json({ 
          message: 'API call limit exceeded for current subscription',
          limitExceeded: true
        });
      }

      // Increment usage counter
      apiCallsFeature.used += 1;
      await subscription.save();
    }

    next();
  } catch (error) {
    console.error('Error checking subscription:', error);
    next(error);
  }
};

// Welcome API endpoint
router.post('/swaroop-welcome', verifyToken, checkApiSubscription, apiController.welcomeApi);
router.post('/welcome', verifyToken, checkApiSubscription, apiController.welcomeApi);

// ID Card APIs
router.post('/document-identification', 
  verifyToken,
  checkApiSubscription,
  upload.single('image'), 
  idCardController.documentIdentification
);

router.post('/pan-signature-extraction',
  verifyToken,
  checkApiSubscription,
  upload.single('image'),
  idCardController.panSignatureExtraction
);

// Analytics endpoints
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const userId = req.user.id;

    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch analytics data
    const apiLogs = await ApiLog.find({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 });

    // Calculate usage over time
    const usageOverTime = [];
    const dailyUsage = {};
    
    apiLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = 0;
      }
      dailyUsage[date]++;
    });

    Object.entries(dailyUsage).forEach(([date, calls]) => {
      usageOverTime.push({ date, calls });
    });

    // Calculate status code distribution
    const statusCodes = {};
    apiLogs.forEach(log => {
      if (!statusCodes[log.statusCode]) {
        statusCodes[log.statusCode] = 0;
      }
      statusCodes[log.statusCode]++;
    });

    const statusCodeDistribution = Object.entries(statusCodes).map(([code, count]) => ({
      code: parseInt(code),
      count,
      percentage: count / apiLogs.length
    }));

    // Calculate API usage by name
    const apiUsageByName = Object.entries(
      apiLogs.reduce((acc, log) => {
        acc[log.apiName] = (acc[log.apiName] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, calls]) => ({ name, calls }));

    // Calculate top endpoints
    const topEndpoints = [...apiUsageByName]
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    // Calculate success rate
    const successfulCalls = apiLogs.filter(log => log.statusCode >= 200 && log.statusCode < 300).length;
    const successRate = apiLogs.length > 0 ? (successfulCalls / apiLogs.length) : 0;

    const response = {
      totalCalls: apiLogs.length,
      averageResponseTime: apiLogs.reduce((acc, log) => acc + log.executionTime, 0) / apiLogs.length || 0,
      apiUsageByName,
      usageOverTime,
      statusCodeDistribution,
      topEndpoints,
      successRate
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});
router.get('/analytics/:apiId', apiController.getApiStats);

// Token deletion route
router.delete('/auth/tokens/:tokenId', verifyToken, authController.deleteToken);

// Add this route to get available APIs
router.get('/available-apis', verifyToken, async (req, res) => {
  try {
    const apis = [
      {
        id: 'welcome',
        title: 'Welcome API',
        description: 'A simple welcome message API to test integration.',
        method: 'POST',
        version: '1.0.0',
        pricing: { credits: 1 },
        endpoint: '/swaroop-welcome'
      },
      {
        id: 'document-identification',
        title: 'Document Identification',
        description: 'Identifies the type of card, its side, and determines if the image is blurry or grayscale.',
        method: 'POST',
        version: '1.0.0',
        pricing: { credits: 2 }
      },
      {
        id: 'pan-signature-extraction',
        title: 'PAN Signature Extraction',
        description: 'Extracts signature from PAN card images.',
        method: 'POST',
        version: '1.0.0',
        pricing: { credits: 3 }
      }
    ];

    res.json(apis);
  } catch (error) {
    console.error('Error fetching available APIs:', error);
    res.status(500).json({ message: 'Error fetching available APIs' });
  }
});

// Debug log registered routes
console.log('API Routes registered:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${r.route.stack[0].method.toUpperCase()} /api/v1${r.route.path}`);
  }
});

module.exports = router; 