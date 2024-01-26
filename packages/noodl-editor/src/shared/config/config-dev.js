module.exports = {
  type: 'dev',
  Tracker: {
    trackExceptions: false
  },
  PreviewServer: {
    port: 8574
  },
  devMode: true,

  apiEndpoint: 'https://apidev.noodlcloud.com',
  domainEndpoint: 'http://domains.noodlcloud.com',
  aiEndpoint: 'https://ftii7qa6g2a3k3hlwi6etoo3z40qbbtw.lambda-url.us-east-1.on.aws'

  // Test config during dev
  //  userConfig: require('./userconfig-dev')
};
