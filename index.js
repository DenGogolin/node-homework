const config = require('./config');
const models = require('./models');

console.log(config.name);
new models.Product();
new models.User();