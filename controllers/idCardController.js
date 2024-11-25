const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const Transaction = require('../models/Transaction');
const documentation = require('../data/documentation');
const mongoose = require('mongoose');

const CLOUD_RUN_URL = 'https://document-verification-895906245277.us-central1.run.app';

// Define active APIs
const ACTIVE_APIS = {
  'document-identification': true,
  'pan-signature-extraction': true
};

// Add this function to create transaction records for API usage
const createApiUsageTransaction = async (userId, apiName, creditCost, currentCredits) => {
  try {
    const transaction = new Transaction({
      userId,
      type: 'DEBIT',
      amount: creditCost,
      description: `API Usage: ${apiName}`,
      balance: currentCredits,
      source: 'API_USAGE',
      metadata: {
        apiName
      }
    });
    await transaction.save();
  } catch (error) {
    console.error('Error creating API usage transaction:', error);
  }
};

// Helper function to create transaction record with retry logic
const createTransactionWithRetry = async (userId, apiName, creditCost, currentCredits, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const transaction = new Transaction({
        userId,
        type: 'DEBIT',
        amount: creditCost,
        description: `API Usage: ${apiName}`,
        balance: currentCredits,
        source: 'API_USAGE',
        metadata: {
          apiName
        }
      });

      const savedTransaction = await transaction.save();
      console.log('Transaction created successfully:', savedTransaction);
      return savedTransaction;
    } catch (error) {
      console.error(`Transaction creation attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }
  }
};

// Common function to handle credit deduction and transaction creation
const handleCreditsAndTransaction = async (user, apiName, creditCost) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update user credits
    user.credits -= creditCost;
    await user.save({ session });

    // Create transaction record
    const transaction = await createTransactionWithRetry(
      user._id,
      apiName,
      creditCost,
      user.credits
    );

    await session.commitTransaction();
    return { updatedCredits: user.credits, transaction };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

exports.documentIdentification = async (req, res) => {
  const startTime = Date.now();
  const apiName = 'document-identification';

  try {
    const user = await User.findById(req.user._id);
    const apiDoc = documentation.apis[apiName];
    const creditCost = apiDoc?.pricing?.credits || 2;

    if (user.credits < creditCost) {
      return res.status(403).json({
        success: false,
        message: `Insufficient credits. This API requires ${creditCost} credits.`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const cloudRunResponse = await axios.post(
      `${CLOUD_RUN_URL}/document-identification`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    // Handle credits and create transaction
    const remainingCredits = await handleCreditsAndTransaction(user, apiName, creditCost);

    // Log API call
    const apiLog = new ApiLog({
      userId: user._id,
      apiName,
      requestBody: { filename: req.file.originalname },
      responseBody: cloudRunResponse.data,
      statusCode: cloudRunResponse.status,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      executionTime: Date.now() - startTime,
      creditsUsed: creditCost
    });
    await apiLog.save();

    res.json({
      success: true,
      data: cloudRunResponse.data,
      creditsRemaining: remainingCredits
    });

  } catch (error) {
    console.error('Document Identification API Error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Error processing document',
      error: error.message
    });
  }
};

exports.panSignatureExtraction = async (req, res) => {
  const startTime = Date.now();
  const apiName = 'pan-signature-extraction';

  try {
    const user = await User.findById(req.user._id);
    const apiDoc = documentation.apis[apiName];
    const creditCost = apiDoc?.pricing?.credits || 1;

    if (user.credits < creditCost) {
      return res.status(403).json({
        success: false,
        message: `Insufficient credits. This API requires ${creditCost} credits.`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Make API call first to ensure it succeeds
    const cloudRunResponse = await axios.post(
      `${CLOUD_RUN_URL}/pan-signature-extraction`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      }
    );

    // Handle credits and create transaction
    const remainingCredits = await handleCreditsAndTransaction(user, apiName, creditCost);

    // Log API call
    const apiLog = new ApiLog({
      userId: user._id,
      apiName,
      requestBody: { filename: req.file.originalname },
      responseBody: { message: 'Signature image extracted successfully' },
      statusCode: cloudRunResponse.status,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      executionTime: Date.now() - startTime,
      creditsUsed: creditCost
    });
    await apiLog.save();

    // Set response headers and send image
    res.set('Content-Type', 'image/png');
    res.set('X-Credits-Remaining', remainingCredits.toString());
    res.send(cloudRunResponse.data);

  } catch (error) {
    console.error('PAN Signature Extraction API Error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Error extracting signature',
      error: error.message
    });
  }
}; 