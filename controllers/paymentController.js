const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, credits } = req.body;
    const userId = req.user._id;

    // Start a session for transaction atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Here you would integrate with PhonePe API
      // For now, we'll simulate a successful payment
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update user credits
      const user = await User.findById(userId).session(session);
      const previousBalance = user.credits;
      user.credits += credits;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'CREDIT',
        amount: credits,
        description: `Purchased ${credits} credits`,
        balance: user.credits,
        source: 'PURCHASE',
        metadata: {
          packageName: amount === credits ? 'Standard Package' : 'Custom Package',
          paymentId,
          orderId: `ORDER_${Date.now()}`
        }
      });
      await transaction.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Payment successful',
        credits: user.credits,
        transaction: {
          id: transaction._id,
          amount: credits,
          previousBalance,
          currentBalance: user.credits
        }
      });

    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment failed',
      error: error.message
    });
  }
}; 