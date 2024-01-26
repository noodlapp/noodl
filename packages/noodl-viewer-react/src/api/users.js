const UserService = require('../nodes/std-library/user/userservice')

const users = {
    async logIn(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.logIn({
                username:options.username,
                password:options.password,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async signUp(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.signUp({
                username:options.username,
                password:options.password,
                email:options.email,
                properties:options.properties,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async become(sessionToken) {
        return new Promise((resolve,reject) => {
            UserService.instance.fetchCurrentUser({
                sessionToken,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    // Deprecated use cloud functions instead
  /*  async requestPasswordReset(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.requestPasswordReset({
                email:options.email,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async resetPassword(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.resetPassword({
                token:options.token,
                username:options.username,
                newPassword:options.newPassword,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },   

    async sendEmailVerification(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.sendEmailVerification({
                email:options.email,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async verifyEmail(options) {
        return new Promise((resolve,reject) => {
            UserService.instance.verifyEmail({
                username:options.username,
                token:options.token,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },*/

    on(event,cb) {
        UserService.instance.on(event,cb)
    },

    off(event,cb) {
        UserService.instance.off(event,cb)
    }, 
}

const _currentUser = {
    async logOut() {
        return new Promise((resolve,reject) => {
            UserService.instance.logOut({
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async save() {
        return new Promise((resolve,reject) => {
            const props = Object.assign({},_currentUser.Properties.data)

            UserService.instance.setUserProperties({
                properties:props,
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    },

    async fetch() {
        return new Promise((resolve,reject) => {
            UserService.instance.fetchCurrentUser({
                success:() => {
                    resolve()
                },
                error:(e) => {
                    reject(e)
                }
            })
        })
    }
}

Object.defineProperty(users, 'Current', { 
    get: function() { 
        const _user = UserService.instance.current; 
        if(_user === undefined) return; 
        else {
            _currentUser.email = _user.email;
            _currentUser.username = _user.username;
            _currentUser.id = _user.id;
            _currentUser.emailVerified = _user.emailVerified;
            _currentUser.Properties = _user
            return _currentUser
        } 
    } 
});

module.exports = users