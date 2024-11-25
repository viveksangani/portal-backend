const panSignatureExtractionDoc = {
  id: 'pan-signature-extraction',
  title: 'PAN-Signature-Extraction',
  description: 'Extracts signature of the person from PAN card images.',
  version: '1.0.0',
  category: 'id_card',
  status: 'active',
  pricing: {
    credits: 3,
    description: 'Each API call costs 3 credits'
  },
  baseUrl: 'https://api.portal.swaroop.ai/api/v1',
  endpoint: '/pan-signature-extraction',
  method: 'POST'
};

module.exports = { panSignatureExtractionDoc }; 