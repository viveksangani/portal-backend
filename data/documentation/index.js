const { trialApis } = require('./trial');
const { idCardApis } = require('./id_card');
const { imageProcessingApis } = require('./image_processing');
const { videoProcessingApis } = require('./video_processing');

const documentation = {
  openapi: '3.0.0',
  info: {
    title: 'Portal API',
    version: '1.0.0',
    description: 'API documentation for Portal'
  },
  apis: {
    ...trialApis,
    ...idCardApis,
    ...imageProcessingApis,
    ...videoProcessingApis
  }
};

module.exports = documentation; 