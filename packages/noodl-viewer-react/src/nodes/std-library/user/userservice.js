const NoodlRuntime = require('@noodl/runtime');
const EventEmitter = require('events').EventEmitter;
const guid = require('../../../guid');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

class UserService {
  constructor() {
    this._initCloudServices();

    this.events = new EventEmitter();
    this.events.setMaxListeners(100000);

    // Check for current user session, and validate if it exists
    const currentUser = this.getUserFromLocalStorage();

    if (currentUser) {
      this.current = this.getUserModel();
      this.fetchCurrentUser({
        success: () => {},
        error: () => {
          // The session is nolonger valid
          delete localStorage['Parse/' + this.appId + '/currentUser'];
          delete this.current;
          this.events.emit('sessionLost');
        }
      });
    }
  }

  getUserFromLocalStorage() {
    const currentUser = localStorage['Parse/' + this.appId + '/currentUser'];
    if (currentUser) {
      try {
        return JSON.parse(currentUser);
      } catch (e) {
        //do nothing
      }
    }
    return undefined;
  }

  _initCloudServices() {
    const cloudServices = NoodlRuntime.instance.getMetaData('cloudservices');

    if (cloudServices) {
      this.appId = cloudServices.appId;
      this.endpoint = cloudServices.endpoint;
    }
  }

  on() {
    this.events.on.apply(this.events, arguments);
  }

  off() {
    this.events.off.apply(this.events, arguments);
  }

  _makeRequest(path, options) {
    if (!this.endpoint) {
      if (options.error) {
        options.error({ error: 'No active cloud service', status: 0 });
      }
      return;
    }

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        var json;
        try {
          json = JSON.parse(xhr.response);
        } catch (e) {}

        if (xhr.status === 200 || xhr.status === 201) {
          options.success(json || xhr.response);
        } else options.error(json || { error: xhr.responseText, status: xhr.status });
      }
    };

    xhr.open(options.method || 'GET', this.endpoint + path, true);

    xhr.setRequestHeader('X-Parse-Application-Id', this.appId);

    // Installation Id
    var _iid = localStorage['Parse/' + this.appId + '/installationId'];
    if (_iid === undefined) {
      _iid = localStorage['Parse/' + this.appId + '/installationId'] = guid();
    }
    xhr.setRequestHeader('X-Parse-Installation-Id', _iid);

    // Check for current users
    if (options.sessionToken) xhr.setRequestHeader('X-Parse-Session-Token', options.sessionToken);
    else {
      var currentUser = this.getUserFromLocalStorage();
      if (currentUser !== undefined) {
        xhr.setRequestHeader('X-Parse-Session-Token', currentUser.sessionToken);
      }
    }

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(options.content));
  }

  logIn(options) {
    this._makeRequest('/login', {
      method: 'POST',
      content: {
        username: options.username,
        password: options.password,
        _method: 'GET'
      },
      success: (response) => {
        // Store current user
        localStorage['Parse/' + this.appId + '/currentUser'] = JSON.stringify(response);
        this.current = this.getUserModel(); // Make sure the user model is updated
        options.success(response);
        this.events.emit('loggedIn');
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  logOut(options) {
    this._makeRequest('/logout', {
      method: 'POST',
      content: {},
      success: (response) => {
        // Store current user
        delete localStorage['Parse/' + this.appId + '/currentUser'];
        delete this.current;
        options.success();
        this.events.emit('loggedOut');
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  signUp(options) {
    //make a shallow copy to feed through CloudStore._serializeObject, which will modify the object
    const additionalUserProps = options.properties
      ? CloudStore._serializeObject({ ...options.properties }, '_User')
      : {};

    this._makeRequest('/users', {
      method: 'POST',
      content: Object.assign({}, additionalUserProps, {
        username: options.username,
        password: options.password,
        email: options.email
      }),
      success: (response) => {
        // Store current user
        const _cu = Object.assign(response, { username: options.username }, options.properties);
        localStorage['Parse/' + this.appId + '/currentUser'] = JSON.stringify(_cu);
        this.current = this.getUserModel(); // Make sure the user model is updated
        options.success(response);
        this.events.emit('loggedIn');
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  setUserProperties(options) {
    const _cu = this.getCurrentUser();
    if (_cu !== undefined) {
      //make a shallow copy to feed through CloudStore._serializeObject, which will modify the object
      const propsToSave = CloudStore._serializeObject({ ...options.properties }, '_User');

      const _content = Object.assign({}, { email: options.email, username: options.username }, propsToSave);

      delete _content.emailVerified; // Remove props you cannot set
      delete _content.createdAt;
      delete _content.updatedAt;
      //delete _content.username;

      this._makeRequest('/users/' + _cu.objectId, {
        method: 'PUT',
        content: _content,
        success: (response) => {
          // Store current user
          Object.assign(_cu, _content);
          localStorage['Parse/' + this.appId + '/currentUser'] = JSON.stringify(_cu);
          this.current = this.getUserModel(); // Make sure the user model is updated
          options.success(response);
        },
        error: (e) => {
          options.error(e.error);
        }
      });
    }
  }

  fetchCurrentUser(options) {
    this._makeRequest('/users/me', {
      method: 'GET',
      sessionToken: options.sessionToken,
      success: (response) => {
        // Store current user
        localStorage['Parse/' + this.appId + '/currentUser'] = JSON.stringify(response);
        this.current = this.getUserModel(); // Make sure the user model is updated
        this.events.emit('sessionGained');
        options.success(response);
      },
      error: (e) => {
        if (e.code === 209) {
          delete localStorage['Parse/' + this.appId + '/currentUser'];
          this.events.emit('sessionLost');
        }
        options.error(e.error);
      }
    });
  }

  verifyEmail(options) {
    this._makeRequest(
      '/apps/' + this.appId + '/verify_email?username=' + options.username + '&token=' + options.token,
      {
        method: 'GET',
        success: (response) => {
          if (response.indexOf('Successfully verified your email') !== -1) {
            options.success();
          } else if (response.indexOf('Invalid Verification Link')) {
            options.error('Invalid verification token');
          } else {
            options.error('Failed to verify email');
          }
        },
        error: (e) => {
          options.error(e.error);
        }
      }
    );
  }

  sendEmailVerification(options) {
    this._makeRequest('/verificationEmailRequest', {
      method: 'POST',
      content: { email: options.email },
      success: (response) => {
        options.success();
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  resetPassword(options) {
    this._makeRequest('/apps/' + this.appId + '/request_password_reset', {
      method: 'POST',
      content: {
        username: options.username,
        token: options.token,
        new_password: options.newPassword
      },
      success: (response) => {
        if (
          response.indexOf('Password successfully reset') !== -1 ||
          response.indexOf('Successfully updated your password') !== -1
        ) {
          options.success();
        } else if (response.indexOf('Invalid Link')) {
          options.error('Invalid verification token');
        } else {
          options.error('Failed to verify email');
        }
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  requestPasswordReset(options) {
    this._makeRequest('/requestPasswordReset', {
      method: 'POST',
      content: { email: options.email },
      success: (response) => {
        options.success();
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  getCurrentUser() {
    var _cu = localStorage['Parse/' + this.appId + '/currentUser'];
    if (_cu !== undefined) return JSON.parse(_cu);
  }

  getUserModel() {
    const _cu = this.getCurrentUser();
    if (_cu !== undefined) {
      delete _cu.sessionToken;
      delete _cu.ACL;
      delete _cu.className;
      delete _cu.__type;
      return CloudStore._fromJSON(_cu, '_User');
    }
  }
}

UserService.forScope = (modelScope) => {
  // On the viewer, always return main scope
  return UserService.instance;
};

var _instance;
Object.defineProperty(UserService, 'instance', {
  get: function () {
    if (_instance === undefined) _instance = new UserService();
    return _instance;
  }
});

NoodlRuntime.Services.UserService = UserService;

module.exports = UserService;
