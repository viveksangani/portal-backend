const documentIdentificationDoc = {
  id: 'document-identification',
  title: 'Document-Identification',
  description: 'Identifies the type of card, its side, and determines if the image is blurry or grayscale.',
  version: '1.0.0',
  category: 'id_card',
  status: 'active',
  pricing: {
    credits: 2,
    description: 'Each API call costs 2 credits'
  },
  baseUrl: 'https://api.portal.swaroop.ai/api/v1',
  endpoint: '/document-identification',
  method: 'POST'
};

module.exports = { documentIdentificationDoc }; 