const documentation = {
  openapi: '3.0.0',
  info: {
    title: 'Portal API',
    version: '1.0.0',
    description: 'API documentation for Portal'
  },
  apis: {
    'swaroop-welcome': {
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
      method: 'POST',
      authentication: {
        type: 'Bearer Token',
        description: 'Requires JWT token in Authorization header'
      }
    },
    'document-identification': {
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
      method: 'POST',
      authentication: {
        type: 'Bearer Token',
        description: 'Requires JWT token in Authorization header'
      }
    },
    'pan-signature-extraction': {
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
      method: 'POST',
      authentication: {
        type: 'Bearer Token',
        description: 'Requires JWT token in Authorization header'
      }
    }
  }
};

module.exports = documentation; 