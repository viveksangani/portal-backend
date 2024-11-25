const { documentIdentificationDoc } = require('./document-identification');
const { panSignatureExtractionDoc } = require('./pan-signature-extraction');

const idCardApis = {
  'document-identification': documentIdentificationDoc,
  'pan-signature-extraction': panSignatureExtractionDoc
};

module.exports = { idCardApis }; 