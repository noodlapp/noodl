'use strict';

const { Services } = require('@noodl/runtime');

var PersistHelper = function (args) {
  for (var i in args) this[i] = args[i];

  this.hasScheduled = {};

  requestInitialFetchOnConnected();
};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// Handling of initial fetch for sync models and collections
// Each model/collection requiring initial fetch is only requested once
var hasScheduledInitialFetchForId = {};
var initialFetchHandlerForType = {};

PersistHelper.setInitialFetchHandlerForType = function (type, handler) {
  initialFetchHandlerForType[type] = handler;
};

function initialFetchMessageHandler(message) {
  var id = message.topic.substring('ndl/persist/getaccepted/'.length);
  if (hasScheduledInitialFetchForId[id] === message.payload.clientToken) {
    var type = id.split('/')[0];
    var _id = id.substring(type.length + 1);
    initialFetchHandlerForType[type](_id, message.payload.data);
  }
}

function requestInitialFetchForId(id) {
  if (hasScheduledInitialFetchForId[id]) return;

  Services.pubsub.subscribe('ndl/persist/getaccepted/' + id, initialFetchMessageHandler);

  hasScheduledInitialFetchForId[id] = guid();
  Services.pubsub.publish('ndl/persist/get/' + id, {
    clientToken: hasScheduledInitialFetchForId[id]
  });
}

var connectionHandlerInstalled = false;
function requestInitialFetchOnConnected() {
  if (!connectionHandlerInstalled) {
    connectionHandlerInstalled = true;

    Services.pubsub.on('connected', function () {
      // Must request all sync models
      for (var id in hasScheduledInitialFetchForId) {
        Services.pubsub.publish('ndl/persist/get/' + id, {
          clientToken: hasScheduledInitialFetchForId[id]
        });
      }
    });
  }
}

// Handling of delta notifications from persist servier
// each delta notification is handled only once by the first
// handler that is registered
var deltaHandlers = {};
var deltaHandlerForType = {};

PersistHelper.setDeltaHandlerForType = function (type, handler) {
  deltaHandlerForType[type] = handler;
};

function deltaMessageHandler(message) {
  var id = message.topic.substring('ndl/persist/delta/'.length);
  if (deltaHandlers[id]) {
    var type = id.split('/')[0];
    var _id = id.substring(type.length + 1);
    deltaHandlerForType[type](_id, message.payload.delta);
  }
}

function subscribeToDeltaForId(id) {
  if (!deltaHandlers[id]) {
    // First subscrive, register handler and notify pubsub that we want to subscribe to the topic
    deltaHandlers[id] = { cnt: 1 };
    Services.pubsub.subscribe('ndl/persist/delta/' + id, deltaMessageHandler);
  } else {
    // If this is the second time someone subscribes for this id, just update the count
    deltaHandlers[id].cnt++;
  }
}

function unsubscribeToDeltaForId(id) {
  if (deltaHandlers[id]) {
    deltaHandlers[id].cnt--; // Reduce count
    if (deltaHandlers[id].cnt === 0) {
      // No more interested in delta for this id, unsubscribe from persist service
      Services.pubsub.unsubscribe('ndl/persist/delta/' + id, deltaMessageHandler);
      delete deltaHandlers[id];
      delete hasScheduledInitialFetchForId[id]; // Next time someone subscribes for deltas, make a new initial fetch
    }
  }
}

PersistHelper.prototype.setId = function (id) {
  this.id = id;

  var _this = this;
  this.schedule('subscribeToPersistService', function () {
    _this.subscribeToPersistService();
  });
};

PersistHelper.prototype.isWorking = function () {
  return !!this.persistWorking;
};

PersistHelper.prototype.setPersistType = function (type) {
  this.persistType = type;

  var _this = this;
  this.schedule('subscribeToPersistService', function () {
    _this.subscribeToPersistService();
  });
};

PersistHelper.prototype.schedule = function (type, callback) {
  var _this = this;

  if (this.hasScheduled[type]) return;
  this.hasScheduled[type] = true;

  this.scheduleFunction(function () {
    callback();

    _this.hasScheduled[type] = false;
  });
};

PersistHelper.prototype.unsubscribe = function () {
  if (this.lastSubscribedId) {
    // Unsubscribe to current model id
    Services.pubsub.unsubscribe('ndl/persist/updateaccepted/' + this.lastSubscribedId, this.messageHandler);
    Services.pubsub.unsubscribe('ndl/persist/updaterejected/' + this.lastSubscribedId, this.messageHandler);
    Services.pubsub.unsubscribe('ndl/persist/getaccepted/' + this.lastSubscribedId, this.messageHandler);
    Services.pubsub.unsubscribe('ndl/persist/getrejected/' + this.lastSubscribedId, this.messageHandler);
    unsubscribeToDeltaForId(this.lastSubscribedId);
  }
};

PersistHelper.prototype.handleMessage = function (message) {
  // Handle update accepted
  if (message.topic.indexOf('ndl/persist/updateaccepted/') === 0) {
    if (message.payload.clientToken === this.persistUpdateClientToken) {
      this.persistWorking = false;
      this.onWorkingChanged(this.persistWorking);
      this.onPersistSuccess();
    }
  }

  // Handle update rejected
  else if (message.topic.indexOf('ndl/persist/updaterejected/') === 0) {
    if (message.payload.clientToken === this.persistUpdateClientToken) {
      this.persistWorking = false;
      this.onWorkingChanged(this.persistWorking);
      this.onPersistFailure();
    }
  }

  // Handle get accepted
  else if (message.topic.indexOf('ndl/persist/getaccepted/') === 0) {
    if (message.payload.clientToken === this.persistGetClientToken) {
      this.persistWorking = false;
      this.onWorkingChanged(this.persistWorking);
      this.onFetchSuccess(message.payload.data);
    }
  }

  // Handle get rejected
  else if (message.topic.indexOf('ndl/persist/getrejected/') === 0) {
    if (message.payload.clientToken === this.persistGetClientToken) {
      this.persistWorking = false;
      this.onWorkingChanged(this.persistWorking);
      this.onFetchFailure();
    }
  }
};

PersistHelper.prototype.subscribeToPersistService = function () {
  var _this = this;
  var id = this.id !== '' ? this.id : undefined;

  if (!(this.persistType === 'global' || this.persistType === 'sync')) return; // Only subscribe in global and sync mode
  if (this.lastSubscribedId === id) return; // We are already subscribed to this id

  this.unsubscribe();
  this.lastSubscribedId = id;
  if (id === undefined) return;

  // Subscribe to persistance topics
  if (this.persistType === 'global' || this.persistType === 'sync') {
    this.messageHandler = this.handleMessage.bind(this);

    // Subscribe to persist accepted for this model
    Services.pubsub.subscribe('ndl/persist/updateaccepted/' + id, this.messageHandler);

    // Subscrive to presist rejected for this model
    Services.pubsub.subscribe('ndl/persist/updaterejected/' + id, this.messageHandler);

    // Subscrive to get accepted for this model
    Services.pubsub.subscribe('ndl/persist/getaccepted/' + id, this.messageHandler);

    // Subscrive to get rejected for this model
    Services.pubsub.subscribe('ndl/persist/getrejected/' + id, this.messageHandler);

    // Subscrive to delta topics
    if (this.persistType === 'sync') {
      subscribeToDeltaForId(id);

      // If we are in sync mode and we have not previously scheduled a fetch for this id
      // fetch it
      requestInitialFetchForId(id);
    }
  }
};

PersistHelper.prototype.schedulePersist = function () {
  var _this = this;
  this.schedule('schedulePersist', function () {
    _this.persistData(_this.onPersistDataNeeded());
  });
};

PersistHelper.prototype.persistData = function (data) {
  if (!data) return;

  var persistType = this.persistType;
  var id = this.id;

  if (persistType === 'local') {
    // Store model on local storage
    try {
      localStorage['noodl-persist-' + id] = JSON.stringify(data);
      this.onPersistSuccess();
    } catch (e) {
      this.onPersistFailure();
    }
  } else if (persistType === 'global' || persistType === 'sync') {
    // Send update request to persist service
    this.persistUpdateClientToken = guid();
    Services.pubsub.publish('ndl/persist/update/' + id, {
      data: data,
      clientToken: this.persistUpdateClientToken
    });

    this.persistWorking = true;
    this.onWorkingChanged(this.persistWorking);
  }
};

PersistHelper.prototype.scheduleFetch = function () {
  var _this = this;
  this.schedule('scheduleFetch', function () {
    _this.fetchData();
  });
};

PersistHelper.prototype.fetchData = function () {
  var persistType = this.persistType;
  var id = this.id;

  if (persistType === 'local') {
    // Store model on local storage
    try {
      var json = localStorage['noodl-persist-' + id];
      var data = JSON.parse(json ? json : '{}');
      if (id.indexOf('collection/') === 0) {
        // This is a collection, fetch all models
        var items = [];
        for (var i = 0; i < data.length; i++) {
          var modelJson = localStorage['noodl-persist-model/' + data[i]];
          var modelData = JSON.parse(modelJson ? modelJson : '{}');
          modelData.id = data[i];
          items.push(modelData);
        }
        this.onFetchSuccess(items);
      } else this.onFetchSuccess(data);
    } catch (e) {
      this.onFetchFailure();
    }
  } else if (persistType === 'global' || persistType === 'sync') {
    // Send get request to persist service
    this.persistGetClientToken = guid();
    Services.pubsub.publish('ndl/persist/get/' + id, {
      clientToken: this.persistGetClientToken
    });

    this.persistWorking = true;
    this.onWorkingChanged(this.persistWorking);
  }
};

module.exports = PersistHelper;
