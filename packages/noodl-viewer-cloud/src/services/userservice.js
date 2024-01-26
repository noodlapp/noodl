const NoodlRuntime = require('@noodl/runtime');
const EventEmitter = require('@noodl/runtime/src/events');
//const guid = require('../../../guid');
const Model = require('@noodl/runtime/src/model');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');

class UserService {
  constructor(modelScope) {
    this.events = new EventEmitter();
    this.events.setMaxListeners(100000);

    // User is fetched and validate when the request is initiated
    // see if there is a current user
    const request = (modelScope || Model).get('Request');
    if (request.UserId !== undefined) {
      const user = (modelScope || Model).get(request.UserId);

      this.current = user;
    }

    this.modelScope = modelScope;
  }

  on() {
    this.events.on.apply(this.events, arguments);
  }

  off() {
    this.events.off.apply(this.events, arguments);
  }

  _makeRequest(path, options) {
    if (typeof _noodl_cloudservices === 'undefined') {
      options.error && options.error({ error: 'No active cloud service', status: 0 });
      return;
    }

    const cs = _noodl_cloudservices;

    fetch(cs.endpoint + path, {
      method: options.method || 'GET',
      headers: {
        'X-Parse-Application-Id': cs.appId,
        'X-Parse-Master-Key': cs.masterKey,
        'content-type': 'application/json',
        'X-Parse-Session-Token': options.sessionToken
      },
      body: JSON.stringify(options.content)
    })
      .then((res) => {
        if (res.ok) {
          res.json().then((json) => options.success(json));
        } else {
          res.json().then((json) => options.error({ error: json.error, status: res.status }));
        }
      })
      .catch((e) => {
        options.error({ error: e.message });
      });
  }

  setUserProperties(options) {
    if (this.current !== undefined) {
      //make a shallow copy to feed through CloudStore._serializeObject, which will modify the object
      const propsToSave = CloudStore._serializeObject({ ...options.properties }, '_User', this.modelScope || Model);

      const _content = Object.assign({}, { email: options.email, username: options.username }, propsToSave);

      delete _content.createdAt; // Remove props you cannot set
      delete _content.updatedAt;

      this._makeRequest('/users/' + this.current.getId(), {
        method: 'PUT',
        content: _content,
        success: (response) => {
          // Store current user
          for (let key in _content) {
            this.current.set(key, _content[key]);
          }
          options.success(response);
        },
        error: (e) => {
          options.error(e.error);
        }
      });
    }
  }

  logIn(options) {
    this._makeRequest('/login', {
      method: 'POST',
      content: {
        username: options.username,
        password: options.password,
        method: 'GET'
      },
      success: (user) => {
        delete user.ACL;
        delete user.className;
        delete user.__type;

        const _user = CloudStore._fromJSON(user, '_User', this.modelScope || Model);

        options.success(_user);
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  // Just fetch the user don't set to current
  fetchUser(options) {
    this._makeRequest('/users/me', {
      method: 'GET',
      sessionToken: options.sessionToken,
      success: (user) => {
        // Store current user
        delete user.ACL;
        delete user.className;
        delete user.__type;

        const _user = CloudStore._fromJSON(user, '_User', this.modelScope || Model);

        options.success(_user);
      },
      error: (e) => {
        options.error(e.error);
      }
    });
  }

  fetchCurrentUser(options) {
    if (options.sessionToken) {
      // Fetch the current user with the session token
      this._makeRequest('/users/me', {
        method: 'GET',
        sessionToken: options.sessionToken,
        success: (user) => {
          // Store current user
          delete user.ACL;
          delete user.className;
          delete user.__type;

          this.current = CloudStore._fromJSON(user, '_User', this.modelScope || Model);
          this.events.emit('sessionGained');
          options.success(this.current);
        },
        error: (e) => {
          options.error(e.error);
        }
      });
    } else if (this.current !== undefined) {
      // Fetch the current user, will use master key
      this._makeRequest('/users/' + this.current.getId(), {
        method: 'GET',
        success: (user) => {
          // Store current user
          delete user.ACL;
          delete user.className;
          delete user.__type;

          this.current = CloudStore._fromJSON(user, '_User', this.modelScope || Model);

          options.success(this.current);
        },
        error: (e) => {
          options.error(e.error);
        }
      });
    }
  }
}

UserService.forScope = (modelScope) => {
  if (modelScope === undefined) return UserService.instance;
  if (modelScope._userService) return modelScope._userService;

  modelScope._userService = new UserService(modelScope);
  return modelScope._userService;
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
