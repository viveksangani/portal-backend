const documentation = {
  openapi: '3.0.0',
  info: {
    title: 'Portal API',
    version: '1.0.0',
    description: 'API documentation for Portal'
  },
  apis: {
    'swaroop-welcome': {
      name: 'Welcome API',
      description: 'Basic welcome API for testing',
      endpoint: '/api/v1/welcome',
      method: 'GET',
      pricing: {
        credits: 1
      }
    },
    'document-identification': {
      name: 'Document Identification',
      description: 'Identify document types',
      endpoint: '/api/v1/document-identification',
      method: 'POST',
      pricing: {
        credits: 2
      }
    },
    'pan-signature-extraction': {
      name: 'PAN Signature Extraction',
      description: 'Extract signatures from PAN cards',
      endpoint: '/api/v1/pan-signature',
      method: 'POST',
      pricing: {
        credits: 3
      }
    }
  }
};

module.exports = documentation; 