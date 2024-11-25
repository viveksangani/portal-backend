const SUBSCRIPTION_PLANS = {
  'document-identification': [
    {
      name: 'FREE',
      price: 0,
      features: [
        { name: 'API Calls', limit: 100 },
        { name: 'Response Time', value: '1000ms' },
        { name: 'Support', value: 'Community' }
      ],
      billingCycle: 'MONTHLY'
    },
    {
      name: 'BASIC',
      price: 29,
      features: [
        { name: 'API Calls', limit: 1000 },
        { name: 'Response Time', value: '500ms' },
        { name: 'Support', value: 'Email' },
        { name: 'Advanced Analytics' }
      ],
      billingCycle: 'MONTHLY'
    },
    {
      name: 'PRO',
      price: 99,
      features: [
        { name: 'API Calls', limit: 5000 },
        { name: 'Response Time', value: '200ms' },
        { name: 'Support', value: '24/7 Priority' },
        { name: 'Advanced Analytics' },
        { name: 'Custom Integration' }
      ],
      billingCycle: 'MONTHLY'
    }
  ],
  'pan-signature-extraction': [
    {
      name: 'FREE',
      price: 0,
      features: [
        { name: 'API Calls', limit: 50 },
        { name: 'Response Time', value: '1000ms' },
        { name: 'Support', value: 'Community' }
      ],
      billingCycle: 'MONTHLY'
    },
    {
      name: 'BASIC',
      price: 49,
      features: [
        { name: 'API Calls', limit: 500 },
        { name: 'Response Time', value: '500ms' },
        { name: 'Support', value: 'Email' },
        { name: 'Advanced Analytics' }
      ],
      billingCycle: 'MONTHLY'
    },
    {
      name: 'PRO',
      price: 149,
      features: [
        { name: 'API Calls', limit: 2000 },
        { name: 'Response Time', value: '200ms' },
        { name: 'Support', value: '24/7 Priority' },
        { name: 'Advanced Analytics' },
        { name: 'Custom Integration' }
      ],
      billingCycle: 'MONTHLY'
    }
  ]
};

module.exports = SUBSCRIPTION_PLANS; 