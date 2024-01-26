var EventEmitter = require('../events');

function Services() {
}

Services.events = new EventEmitter();

module.exports = Services;