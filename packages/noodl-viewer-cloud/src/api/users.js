const Model = require('@noodl/runtime/src/model');
const CloudStore = require('@noodl/runtime/src/api/cloudstore');
const NoodlRuntime = require('@noodl/runtime');
const RecordsAPI = require('@noodl/runtime/src/api/records');

function createUsersAPI(modelScope) {
  let _cloudstore;
  const cloudstore = () => {
    // We must create the cloud store just in time so all meta data is loaded
    if (!_cloudstore) _cloudstore = new CloudStore(modelScope);
    return _cloudstore;
  };

  const Records = RecordsAPI(modelScope);

  const api = {
    // This API should support an options object, this is how it works on
    // the frontend and in the docs. To support any old use added a ugly fix
    async logIn(username, password) {
      if(typeof username === 'object' && password === undefined) {
        const options = username; 
        username = options.username;
        password = options.password;
      }

      return new Promise((resolve, reject) => {
        const userService = NoodlRuntime.Services.UserService.forScope(modelScope);
        userService.logIn({
          username,
          password,
          success: (user) => {
            resolve(user);
          },
          error: (e) => {
            reject(Error(e));
          }
        });
      });
    },

    async impersonate(username, options) {
      // Look for the user based on username
      const users = await Records.query('_User', {
        username: { equalTo: username }
      });

      if (!users || users.length !== 1) {
        throw Error('Could not find user.');
      }

      // See if there is a session already
      const user = users[0];

      const query = {
        and: [{ user: { pointsTo: user.id } }, { expiresAt: { greaterThan: new Date() } }]
      };

      if (options && options.installationId) {
        query.and.push({ installationId: { equalTo: options.installationId } });
      }

      const sessions = await Records.query('_Session', query);

      async function _fetchUser(sessionToken) {
        return new Promise((resolve, reject) => {
          const userService = NoodlRuntime.Services.UserService.forScope(modelScope);
          userService.fetchUser({
            sessionToken,
            success: (user) => resolve(user),
            error: (e) => reject(Error(e))
          });
        });
      }

      if (!sessions || sessions.length === 0) {
        // No session, we need to create one
        const session = await Records.create('_Session', {
          user: user.id,
          installationId: options ? options.installationId : undefined,
          sessionToken: 'r:' + Model.guid() + Model.guid(),
          expiresAt: new Date(
            Date.now() + (options && options.duration !== undefined ? options.duration : 24 * 60 * 60 * 1000)
          ),
          restricted: false
        });

        return _fetchUser(session.sessionToken);
      } else {
        return _fetchUser(sessions[0].sessionToken);
      }
    }
  };

  Object.defineProperty(api, 'Current', {
    get: function () {
      const request = (modelScope || Model).get('Request');
      const userId = request.get('UserId');
      if (!userId) return;

      return {
        UserId: userId,
        Properties: (modelScope || Model).get(userId),
        async save(options) {
          return new Promise((resolve, reject) => {
            cloudstore().save({
              collection: '_User',
              objectId: userId,
              data: (modelScope || Model).get(userId).data,
              acl: options ? options.acl : undefined,
              success: (response) => {
                resolve();
              },
              error: (err) => {
                reject(Error(err || 'Failed to save.'));
              }
            });
          });
        },
        async fetch() {
          return new Promise((resolve, reject) => {
            cloudstore().fetch({
              collection: '_User',
              objectId: userId,
              success: function (response) {
                var record = cloudstore()._fromJSON(response, '_User');
                resolve(record);
              },
              error: function (err) {
                reject(Error(err || 'Failed to fetch.'));
              }
            });
          });
        }
      };
    }
  });

  return api;
}

module.exports = createUsersAPI;
