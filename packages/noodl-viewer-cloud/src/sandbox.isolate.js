import { CloudRunner } from '.';

let _runner

const _api_response_handlers = {}
_noodl_api_response = (token,res) => {
    if(typeof _api_response_handlers[token] === 'function') {
        _api_response_handlers[token](res)
        delete _api_response_handlers[token]
    }
}

const eventQueue = []
_noodl_process_jobs = () => {
    while(eventQueue.length > 0) {
        const cb = eventQueue.shift()
        cb()
    } 
}

const _defineAPI = () => {
    global.require = function(module) {
        console.log("Error, require not supported: " + module)
    }

    global.console = {
        log:function() {
            let text = "";
            for(let i = 0; i < arguments.length; i++)
                text += arguments[i] + '\n'

            _noodl_api_call('log',undefined,{level:'info',message:text})
        },
        info:function() {
            global.console.log.apply(undefined,arguments)
        },
        error:function() {
            let text = "";
            for(let i = 0; i < arguments.length; i++)
                text += arguments[i] + '\n'

            _noodl_api_call('log',undefined,{level:'error',message:text})
        }
    }

    // ------------------------- Fetch API --------------------------------
    class Headers {
        constructor(headers) {
            this._headers = headers;
        }

        append(key,value) {
            const _key = key.toLowerCase();
            this._headers[_key] = this._headers[_key]?this._headers[_key].concat([value]):[value]
        }

        set(key,value) {
            const _key = key.toLowerCase();
            this._headers[_key] = [value]
        }
        
        get(key) {
            const _key = key.toLowerCase();
            if(this._headers[_key] === undefined) return null
            return this._headers[_key].join(', ');
        }

        delete(key) {
            const _key = key.toLowerCase();
            delete this._headers[_key]
        }

        has(key) {
            const _key = key.toLowerCase();
            return this._headers[key] !== undefined
        }

        keys() {
            return Object.keys(this._headers)
        }

        forEach(callback, thisArg = undefined) {
            for (const name of this.keys()) {
                Reflect.apply(callback, thisArg, [this.get(name), name, this]);
            }
        }

        * values() {
            for (const name of this.keys()) {
                yield this.get(name);
            }
        }

        * entries() {
            for (const name of this.keys()) {
                yield [name, this.get(name)];
            }
	    }
    }

    global.fetch = async function(url,args) {
        return new Promise((resolve,reject) => {
            const token = Math.random().toString(26).slice(2)
            _api_response_handlers[token] = (res) => {
                if(res.error === undefined) {
                    res.json = () => {
                        try {
                            return Promise.resolve(JSON.parse(res.body))
                        }
                        catch(e) {
                            return Promise.reject('Failed to parse JSON response')
                        }
                    }
                    res.text = () => {
                        return Promise.resolve(res.body)
                    }
                    res.headers = new Headers(res.headers)
                    resolve(res)
                }
                else reject(res.error)
            }
            _noodl_api_call("fetch",token,{url,...args})
        })
    }

    global.setTimeout = function(cb,millis) {
        const token = Math.random().toString(26).slice(2)
        _api_response_handlers[token] = () => {
            cb()
        }
        _noodl_api_call("setTimeout",token,millis)
    }

    global.setImmediate = function(cb) {
        eventQueue.push(cb)
        _noodl_request_process_jobs()
    }
}

const _prepareCloudRunner = async () => {
    if(!_runner) {
        _runner = new CloudRunner({});
        if(typeof _exportedComponents === 'undefined') {
            throw Error("No cloud components present.")
        }
        await _runner.load(_exportedComponents)
    }
}

const handleRequest = (req) => {
    return new Promise((resolve,reject) => {
        _prepareCloudRunner().then(() => {
            _runner.run(req.function,{
                body:req.body,
                headers:req.headers,
            }).then(resolve).catch(reject)
        }).catch(reject)
    })
}

_noodl_handleReq = (token,req) => {
    // req.function
    // req.headers
    // req.body

    if(!global.log) {
        _defineAPI()
    }

    console.info(`Cloud function ${req.function} called (requestId:${token})`)

    handleRequest(req).then(r => {
        console.info(`Cloud function ${req.function} response [${r.statusCode}] (requestId:${token})`)
        _noodl_response(token,r)
    }).catch(e => {
        console.error(`Cloud function ${req.function} response [400] message: ${e.message} (requestId:${token})`)
        _noodl_response(token,{statusCode:400,body:JSON.stringify({error:e.message})})
    })
}