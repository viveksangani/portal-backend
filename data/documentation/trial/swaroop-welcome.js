const swaroopWelcomeDoc = {
  id: 'swaroop-welcome',
  title: 'Swaroop-Welcome API',
  description: 'Trial API that returns a welcome message. Used for testing API integration, authentication, and credit system.',
  version: '1.0.0',
  category: 'trial',
  status: 'active',
  pricing: {
    credits: 1,
    description: 'Each API call costs 1 credit'
  },
  baseUrl: 'https://api.portal.swaroop.ai/api/v1',
  endpoint: '/welcome',
  method: 'POST'
};

module.exports = { swaroopWelcomeDoc }; 