/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/actionnodes.js":
/*!****************************!*\
  !*** ./src/actionnodes.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

var TriggerItemActionNode = {
  name: "Trigger Item Action",
  category: "Data",
  color: "data",
  usePortAsLabel: 'actionName',
  initialize: function () {
  },
  inputs: {
      actionName:{
          type:'string',
          displayName:'Action Name',
          set:function(value) {
              this._internal.actionName = value;
          },
          payload: {
              displayName: 'Payload',
              group: 'ResponPayloadses',
              type: 'stringlist',
              set: function (value) {
                  this._internal.payload = value;
              }
          },
      },
      trigger:{
          displayName:'Trigger',
          valueChangedToTrue:function() {
              var _this = this;

              this.scheduleAfterInputsHaveUpdated(function() {
                  _this.triggerActions();
              });
          }
      }         
  },
  outputs: {
  },
  prototypeExtensions: {
      triggerActions:function() {
          var parentNodeScope = this.nodeScope.componentOwner.parentNodeScope;
          if(!parentNodeScope) return;

          var itemModel = this.nodeScope.componentOwner._forEachModel;
          if(!itemModel) return;

          var actionName = this._internal.actionName;

          var actionReceivers = parentNodeScope.getNodesWithType("On Item Action").filter(function(actionReceiver) {
              return actionReceiver.getActionName() === actionName;
          })

          actionReceivers.forEach(function(actionReceiver) {
              actionReceiver.handleAction(itemModel);
          });
      }
  }
}

var OnItemActionNode = {
  name: "On Item Action",
  category: "Data",
  color: "data",
  usePortAsLabel: 'actionName',
  initialize: function () {
  },
  inputs: {
      actionName:{
          type:'string',
          displayName:'Action Name',
          set:function(value) {
              this._internal.actionName = value;
          }
      }       
  },
  outputs: {
      itemId:{
          type:'string',
          displayName:'Item Id',
          getter:function() {
              return this._internal.itemId;
          }
      },
      actionTriggered:{
          type:'signal',
          displayName:'Action Triggered'
      },       
  },
  prototypeExtensions: {
      getActionName:function() {
          return this._internal.actionName;
      },
      handleAction:function(model) {
          this._internal.itemId = model.getId();
          this.flagOutputDirty('itemId');
          this.sendSignalOnOutput('actionTriggered');
      }
  }
}

module.exports = {
  OnItemActionNode:OnItemActionNode,
  TriggerItemActionNode:TriggerItemActionNode
}

/***/ }),

/***/ "./src/extensions.js":
/*!***************************!*\
  !*** ./src/extensions.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

function componentScriptExtend(_this) {
  var _extended = {
      inputs:_this.inputs||{},
      outputs:_this.outputs||{},
      
      setup:function(inputs,outputs) {
          this.inputs = inputs;
          this.outputs = outputs;
          
          // Set outputs function
          this.setOutputs = function(states)  {
              for(var key in states) {
                  this.outputs[key] = states[key];
                  this.flagOutputDirty(key);
              }
          }
          
          if(_this.methods) {
              for(var key in _this.methods) {
                  this[key] = _this.methods[key];
              }
          }
          
          _this.setup&&_this.setup.apply(this);
      },

      destroy:function(inputs,outputs) {
          this.inputs = inputs;
          this.outputs = outputs;
          
          _this.destroy&&_this.destroy.apply(this);
      },
      
      change:function(inputs,outputs) {
          this.inputs = inputs;
          this.outputs = outputs;
          
          // Detect property changed
          var old = this._oldInputs || {};
          
          if(_this.changed) {
              for(var key in inputs) {
                  if(inputs[key] !== old[key]) {
                      var changedFunction = _this.changed[key];
                      if(typeof changedFunction === 'function')
                          changedFunction.apply(this,[inputs[key],old[key]])
                  }
              }
          }
          
          this._oldInputs = Object.assign({}, inputs);
      }
  }
  
  if(_this.signals) {
      for(var key in _this.signals) {
          _extended[key] = _this.signals[key];
          
          _extended.inputs[key] = 'signal';
      }
  }
  
  return _extended;
}
window.ComponentScript = componentScriptExtend;

var models = {};
var collections = {};

var _extend = function(protoProps, staticProps,createFuncs) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    Object.assign(child, parent, staticProps,(typeof createFuncs === 'function')?createFuncs(child):undefined);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function and add the prototype properties.
    child.prototype = Object.create(parent.prototype);
    Object.assign(child.prototype,protoProps);
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
}

function extendModelsAndCollections() {
    // --------------------- Model --------------------------
    Noodl.Model.extend = function(protoProps, staticProps) {
        return _extend.call(this,protoProps, staticProps,function(constructor) {
            return {
                create:function(data) {
                    var name = data.id;

                    if(name === undefined) name = Noodl.Model.guid();
                    if(models[name]) return models[name];

                    var modelData = data ? data : {};
                    var m = new constructor(name,{});

                    for(var key in modelData) {
                        if(key === 'id') continue;
                        m.set(key,modelData[key]);
                    }

                    models[name] = m;

                    m.initialize&&m.initialize();
                    return m;
                },
                get:function(name) {
                    return constructor.create(name);
                },
                instanceof:function(o) {
                    return o.constructor === constructor;
                },
                inherits:function(o) {
                    var _c = o.constructor;
                    while(_c) {
                        if(_c === constructor) return true;
                        _c = _c.__super__.constructor;
                    }
                    return false;
                }
            }
        })
    }

    // Have Noodl generate guids that are compatible with the backend db
    Noodl.Model.guid = function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000) .toString(16) .substring(1);
        }
        return s4() + s4() + s4() + s4() + s4() + s4();
    }

    Noodl.Model.get = function(id) {
        if(id === undefined) id = Noodl.Model.guid();
        if(!models[id]) models[id] = new Noodl.Model(id,{});
        return models[id];
    }

    Noodl.Model.exists = function(id) {
        return models[id] !== undefined;
    }

    Noodl.Model.prototype.toJSON = function() {
        return Object.assign({},this.data);
    }

    // ------------------- Collection ----------------------
    Noodl.Collection.extend = function(protoProps, staticProps) {
        return _extend.call(this,protoProps,staticProps,function(constructor) {
            return {
                create:function(options) {
                    var name = options?options.id:undefined;
                    if(name === undefined) name = Noodl.Model.guid();
                    if(collections[name]) return collections[name];

                    var c = new constructor(name,options)
                    c.id = name;
                    collections[name] = c;

                    c.initialize&&c.initialize();
                    return c;
                },
                get:function(name) {
                    return constructor.create(name);
                },
                instanceof:function(o) {
                    return o.constructor === constructor;
                },
                inherits:function(o) {
                    var _c = o.constructor;
                    while(_c) {
                        if(_c === constructor) return true;
                        _c = _c.__super__.constructor;
                    }
                    return false;
                }                
            }

        })
    }

    Noodl.Collection.get = function(name) {
        if(name === undefined) name = Noodl.Model.guid();
        if(!collections[name]) {
            var c = new Noodl.Collection()
            c.id = name;
            collections[name] = c;
            return c;
        }
        return collections[name];
    }
      
    Noodl.Collection.exists = function(name) {
        return collections[name] !== undefined;
    }

    Noodl.Collection.prototype.getId = function() {
        return this.id;
    }

    Noodl.Collection.prototype.map = function(fn) {
        return this.items.map(fn);
    }

    Noodl.Collection.prototype.toJSON = function() {
        return this.map(function(m) {
            return m.toJSON()
        })
    }

}

module.exports = {
  componentScriptExtend:componentScriptExtend,
  extendModelsAndCollections:extendModelsAndCollections
}



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

const extensions = __webpack_require__(/*! ./extensions */ "./src/extensions.js");
const actionNodes = __webpack_require__(/*! ./actionnodes */ "./src/actionnodes.js");

function endpoint() {
    return Noodl.getProjectSettings().foveaApiEndpoint||'';
}

function request(opt) {
    var request = new XMLHttpRequest()

    var method = opt.method || (opt.data?'POST':'GET');
    request.open(method, endpoint() + opt.res, true)
    request.setRequestHeader('Content-Type','application/json')

    if(opt.auth) {
        const token = localStorage['fovea-token'];
        request.setRequestHeader('Authorization','Token ' + token)
    }

    request.onload = function() {
        try {
            var data = JSON.parse(this.response)
        }
        catch(e) {}
    
      if (request.status == 200 ) {
        opt.success&&opt.success(data);
      } else if (request.status == 400) {
        opt.error&&opt.error(data.message || data.error);
      }
      else {
          console.log('request error:',data);
      }
    }
    
    request.send(opt.data?JSON.stringify(opt.data):undefined)    
}

function setup() {

window.Fovea = {};

Fovea.UserIdentity = {
    login:function(user,callback) {
        var _this = this;
    
        request({res:'/api/users/login',data:{user:user},success:function(data) {
            // User signed in successfully
            localStorage['fovea-token'] = data.user.token;
            localStorage['fovea-user-id'] = data.user._id;

            // Get the user profile
            _this.getUserProfile(function(profile) {

                // Login complete
                callback(data)
                Noodl.eventEmitter.emit('fovea-user-logged-in');
            })
        },error:function(msg) {
            callback(null,msg);
        }})        
    },

    acceptInvite:function(args,callback) {
        request({res:'/api/users/accept',data:args,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})        
    },

    _getUserProfile:function(callback) {
        request({res:'/api/users/profile',auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})  
    },

    getUserProfile:function(callback) {
        var _this = this;
        if(this._userProfile) return callback(this._userProfile);
        else if(this._awaitingUserProfile) return this._awaitingUserProfile.push(callback);

        this._awaitingUserProfile = [callback];
        this._getUserProfile(function(profile,err) {
            if(err) return callback(null,err);

            _this._userProfile = profile.user;
            _this.getUserWorkspaces(function(workspaces) {
                _this._userProfile.workspaces = workspaces;

                if(_this._userProfile.workspaceId)
                    var currentWorkspace = workspaces.find(function(w) { return w.id === _this._userProfile.workspaceId});
                else
                    var currentWorkspace = workspaces[0];

                _this._userProfile.workspaceName = currentWorkspace?currentWorkspace.name:'No workspace';
                _this._userProfile.workspaceId = currentWorkspace?currentWorkspace.id:undefined;

                _this._awaitingUserProfile.forEach(function(cb) { cb(_this._userProfile)})
                delete _this._awaitingUserProfile;
            })

        })
    },

    getUserId:function() {
        return this._userProfile._id;
    },

    getCurrentWorkspaceId:function() {
        return this._userProfile.workspaceId;
    },

    getUserInitials:function() {
        if(!this._userProfile) return "";

        var name = this._userProfile.name;
        if(!name) return "";

        var parts = name.split(' ');
        return ((parts[0]?parts[0][0]:'')||'') + ((parts[1]?parts[1][0]:'')||'');
    },

    updateUserProfile:function(profile,callback) {
        request({res:'/api/users/profile',auth:true,data:profile,success:function() {
            callback();
        },error:function(msg) {
            callback(msg);
        }})   
    },

    changePassword:function(data,callback) {
        request({res:'/api/users/password',auth:true,data:data,success:function() {
            callback();
        },error:function(msg) {
            callback(msg);
        }})          
    },

    getUserWorkspaces:function(callback) {
        var _this = this;

        Fovea.DB.find({collection:'workspaces',query:{"members.userId":this.getUserId()}},function(data,err) {
            if(err) return callback();

            callback(data.map(function(w) {
                var m = w.members.find(function(m) { return m.userId===_this.getUserId(); })

                return {
                    id:w._id,
                    name:w.name,
                    role:(m&&m.role)?m.role.toLowerCase():undefined,
                }
            }))
        })
    },

    isSiteAdmin:function() {
        return this._userProfile.role.toLowerCase() === 'admin'
    },

    isWorkspaceAdmin:function() {
        var _this = this;

        var w = this._userProfile.workspaces;
        for(var i = 0; i < w.length; w++) {
            if(w[i].role.toLowerCase()==='admin')
                return true;
        }

        return false;
    },

    setCurrentWorkspace:function(id) {
        var _this = this;

        var newWorkspace = this._userProfile.workspaces.find(function(w) { return w.id === id});
        if(!newWorkspace) return;

        this.updateUserProfile({workspaceId:id},function() {
            _this._userProfile.workspaceId = newWorkspace.id;
            _this._userProfile.workspaceName = newWorkspace.name;

            Noodl.eventEmitter.emit('fovea-workspace-changed');
        })
    },

    signOut:function() {
        delete this._userProfile;
        delete localStorage['fovea-user-id'];
        delete localStorage['fovea-token'];
    },

    formatIdeaCreatedString:function() {
        var date = new Date();
        
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
          ];
        
          var day = date.getDate();
          var monthIndex = date.getMonth();
          var year = date.getFullYear();

        return this._userProfile.name + ', ' + day + ' ' + monthNames[monthIndex] + ' ' + year;    
    }
}

Fovea.Users = {
    fetch:function(callback) {
        request({res:'/api/users',auth:true,success:function(data) {
            callback(data,null);
        },error:function(msg) {
            callback(null,msg);
        }})
    },

    delete:function(id,callback) {
        request({res:'/api/users/' + id,method:'DELETE',auth:true,success:function(data) {
            callback();
        },error:function(msg) {
            callback(msg);
        }})
    },

    update:function(id,data,callback) {
        request({res:'/api/users/' + id,data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})  
    },

    invite:function(data,callback) {
        request({res:'/api/users/invite',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})  
    },
    
    reInvite:function(data,callback) {
        request({res:'/api/users/reinvite',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})  
    },
}

Fovea.Toast = {
    show:function(args) {
        Noodl.eventEmitter.emit('fovea-show-toast',{
            title:args.title,
            body:args.body
        })
    }
}

Fovea.Navigate = {
    to:function(args) {
        Noodl.eventEmitter.emit('fovea-page-stack-navigate',{
            stack:args.stack,
            page:args.page
        })        
    }
}

Fovea.DB = {
    insert:function(data,callback) {
        request({res:'/api/db/insert',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})
    },

    update:function(data,callback) {
        request({res:'/api/db/update',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})
    },

    find:function(data,callback) {
        request({res:'/api/db/find',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})        
    },

    findById:function(data,callback) {
        request({res:'/api/db/findbyid',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})        
    },

    delete:function(data,callback) {
        request({res:'/api/db/delete',data:data,auth:true,success:function(data) {
            callback(data);
        },error:function(msg) {
            callback(null,msg);
        }})        
    }    
}


Fovea.DBCollection = Noodl.Collection.extend({
    model:Noodl.Model,
    constructor:function(id,options) {
        Noodl.Collection.apply(this,arguments);
        this.awaitCallbacks = [];
        if(options && options.query) this.query = options.query;
    },
    setQuery:function(query) {
        this.query = query;
    },
    _fetch:function(callback) {
        Fovea.DB.find({collection:this.collectionName,query:this.query},callback)
    },
    fetch:function(callback) {
        var _this = this;

        this.state = 'fetching';
        this._fetch(function(data,err) {     
            if(err) { console.log(err);  return; }

            _this.set(data.map(function(d) {
                return _this._createModel(d)
            }))

            _this.state = 'ready';
            _this.awaitCallbacks.forEach(function(cb) { cb() })
            _this.awaitCallbacks = [];

            callback&&callback();
            _this.notify('fetch');
        })

        return this;
    },
    await:function(callback) {
        if(this.state === 'ready') return callback();
        else if(this.state === 'fetching') this.awaitCallbacks.push(callback);
        else if(!this.state) {
            this.awaitCallbacks.push(callback);
            this.fetch();
        }
    },
    _saveModel:function(m) {
        var _id = m.getId();
        var item = m.toJSON();

        Fovea.DB.update({collection:this.collectionName,id:_id,item:item,upsert:true},function(data,err) {
            if(err) console.log(err);
        })
    },
    _createModel:function(d) {
        d.id = d._id;
        delete d._id;
        var m = this.model.create(d)

        m.on('save',this._saveModel.bind(this,m))
        m.on('delete',this._deleteModel.bind(this,m))

        return m;
    },
    _deleteModel:function(m) {
        var _id = m.getId();
        this.remove(m);
        Fovea.DB.delete({collection:this.collectionName,id:_id},function(data,err) {
            
        })
    },
    addNewItemAndSave:function(data) {
        var m = this._createModel(data);
        m.notify('save');
        this.add(m);

        return m;
    },
    deleteItemWithId:function(id) {
        if(!Noodl.Model.exists(id)) return;

        var m = Noodl.Model.get(id);
        this.remove(m);
        m.notify('delete');
    },    
    findByIds:function(ids) {
        return this.items.filter(function(m) {
            return ids.indexOf(m.getId()) !== -1
        })
    },
    findById:function(id) {
        return this.items.find(function(m) {
            return m.getId() === id;
        })
    },
    filter:function(fn) {
        return this.items.filter(fn)
    }             
})

Fovea.IdeaModel = Noodl.Model.extend({
    initialize:function() {
        var _this = this;

        // Resolve member relations
        var _themes = this.get('themes');
        this.set('themes',Fovea.ThemeCollection.create());

        if(_themes) Fovea.allThemes.await(function() {
            _this.get('themes').set(Fovea.allThemes.findByIds(_themes))
        })
    },
    getNotes:function() {
        if(!this.notes) {
            this.notes = Fovea.NoteCollection.create({ideaId:this.getId()})
            this.notes.fetch();
        }
        return this.notes;
    },
    toJSON:function() {
        return Object.assign({},this.data,{
            themes:this.get('themes').map(function(_m) { 
                return _m.getId()
            })
        })
    }
})

Fovea.IdeaCollection = Fovea.DBCollection.extend({
    model:Fovea.IdeaModel,
    collectionName:'ideas',
    filterOnThemes:function(themes) {
        var _themes = (typeof themes === 'string')?[themes]:themes;

        return this.items.filter(function(i) {
            var _items = i.get('themes').items;
            for(var j = 0; j < _items.length; j++)
                if(themes.indexOf(_items[j].getId()) !== -1) return true;
                
            return false;
        })
    }
})

Fovea.allIdeas = Fovea.IdeaCollection.create();

Fovea.filteredIdeas = Fovea.IdeaCollection.create();

function fetchContent() {
    Fovea.UserIdentity.getUserProfile(function(profile) {
        Fovea.allIdeas.setQuery({"workspaceId":profile.workspaceId});
        Fovea.allIdeas.fetch();

        Fovea.allThemes.setQuery({"workspaceId":profile.workspaceId});
        Fovea.allThemes.fetch();        
    })
}

Noodl.eventEmitter.on('fovea-user-logged-in',function() {
    fetchContent();
})

Noodl.eventEmitter.on('fovea-workspace-changed',function() {
    fetchContent();
})

Fovea.UserCollection = Fovea.DBCollection.extend({
    _fetch:function(callback) {
        request({res:'/api/users',auth:true,success:function(data) {
            callback(data,null);
        },error:function(msg) {
            callback(null,msg);
        }})
    },
    _deleteModel:function(m) {
        this.remove(m);
        Fovea.Users.delete(m.getId(),function(data,err) {
            
        })
    },
    _saveModel:function(m) {
        Fovea.Users.update(m.getId(),m.toJSON(),function(data,err) {
            if(err) console.log(err);
        })
    },
    search:function(filter) {
        if(!filter || filter==='') return [];

        var _filter = filter.toLowerCase();

        return this.items.filter(function(m) {
            var name = m.get('name');
            var email = m.get('email');
            return (name&&name.toLowerCase().indexOf(_filter)!==-1) || (email&&email.toLowerCase().indexOf(_filter)!==-1)
        })
    }
})
Fovea.allUsers = Fovea.UserCollection.create();

Fovea.ThemeCollection  = Fovea.DBCollection.extend({
    collectionName:'themes',
    getMatching:function(filter) {
        if(!filter || filter === '') return [];

        return this.items.filter(function(m) {
            var label = m.get('label');
            if(label && label.indexOf(filter) !== -1) return true;
        })
    }
})
Fovea.allThemes = Fovea.ThemeCollection.create();

Fovea.WorkspaceModel = Noodl.Model.extend({
    initialize:function() {
        var _this = this;

        // Resolve member relations
        var _members = this.get('members');
        this.set('members',Noodl.Collection.get());

        if(_members) Fovea.allUsers.await(function() {
            _this.get('members').set(_members)
        })
    },
    toJSON:function() {
        return {
            name:this.get('name'),
            members:this.get('members').map(function(_m) { 
                return {
                    userId:_m.get('userId'), 
                    role:_m.get('role')
                } 
            })
        }
    }
})

Fovea.WorkspaceCollection = Fovea.DBCollection.extend({
    model:Fovea.WorkspaceModel,
    collectionName:'workspaces',
    constructor:function(id,options) {
        Fovea.DBCollection.apply(this,arguments);
        if(options && options.onlyWorkspacesWithUserRole) {
            this.query = this.query || {};
            this.query["members.userId"] = Fovea.UserIdentity.getUserId();
            if(options.onlyWorkspacesWithUserRole && options.onlyWorkspacesWithUserRole !== 'any') 
                this.query["members.role"] = options.onlyWorkspacesWithUserRole;
        }
    },
    addNewItemAndSave:function(data) {
        // Make sure we are a member of this workspace
        data.members = [
            {
                role:'admin',
                userId:Fovea.UserIdentity.getUserId()
            }
        ]

        return Fovea.DBCollection.prototype.addNewItemAndSave.call(this,data);
    },
})
Fovea.allWorkspaces = Fovea.WorkspaceCollection.create();

Fovea.NoteCollection = Fovea.DBCollection.extend({
    collectionName:'notes',
    constructor:function(id,options) {
        Fovea.DBCollection.apply(this,arguments);
        if(options.ideaId) this.query = {ideaId:options.ideaId}
    }   
})

}

Noodl.defineModule({
    nodes:[
        actionNodes.TriggerItemActionNode,
        actionNodes.OnItemActionNode
    ],
    settings: [
        {
            type:'string',
            name:'foveaApiEndpoint',
            displayName:'API Endpoint',
            group:'Fovea'
        }
    ],
    setup() {
        //this is called once on startup
        Noodl.ComponentScript = extensions.ComponentScript;

        extensions.extendModelsAndCollections();

        setup();
    }
});

/***/ })

/******/ });
//# sourceMappingURL=index.js.map