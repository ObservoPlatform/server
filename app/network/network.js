
/**
 * Observo HTTP App Runtime
 * - This module runs the Express and Socket.io Servers.
 * - Also any "core" events will be ran here.
 * - :)
 */

//Include all modules
const { JSONPath } = require('jsonpath-plus');
const express = require('express');
const chalk = require('chalk');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(35575);

let basket = {}
let sockets = {}

/**
 * createPluginHandler - Creates a plugin handler (socket.io)
 * @param {Object} _db Database storage object 
 * @param {String} _name Name of plugin
 * @param {Function} _callback Callback
 */
let createPluginHandler = (_db, _name, _callback) => {
    //Create a new handler
    let main = io.of("plugins/" + _name).on('connection', function (client) {
        //NEW CLIENT
        //Check for a valid session (because we have the options)
        client.on("auth_checkSession", (data) => {
            //If valid session, continue
            let uuid = data.uuid
            let session = data.session
            let project = data.project
            if (uuid != null && uuid != "") {
                //TODO: Maybe check with core client on what project is being viewed instead.
                //TODO: Update imports.app.storage (invalid)
                if (imports.app.storage.APP.validateSession(uuid, session) && imports.app.storage.isProject(project)) {
                    client.emit("auth_validSession")
                    this.handlers[handler](main, client, data.uuid, data.project)
                } else {
                    client.emit("auth_error", { error: "invalid session" })
                }
            }
        })
    })
}


/**
 * buildUserIcons - Builds the users icons (init handlers)
 * @param {Object} _app 
 * @param {Oject} _db 
 */



class REST {
    constructor(db) {
        this.db = db
        this.user_icons()
    }
    user_icons() {
        let self = this
        app.get(`/users/icons/:uuid`, (req, res, next) => {
            let user_uuid = req.params.uuid
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1234');
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);
            //Check if its a valid user
            if (self.db.USERS.isUser(user_uuid)) {
                //If so get that user
                let user = self.db.USERS.getUserByUUID(user_uuid)
                res.setHeader('Content-Type', 'image/svg+xml');
                //Send the image to the client
                res.status(200).send(user.image)
            } else {
                //TODO: Send a error SVG file
                res.status(404).send('User not found');
            }
        })
    }
    module_download(info, handler, path) {
        let { name } = info
        console.log("CREATED /module/" + name)
        app.get(`/module/${name}`, (req, res, next) => {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1234');
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);
            res.sendFile(path)
        })
    }
}
/**
 * Network
 */
Observo.onMount((imports, register) => {
    console.log(`LOADING ${__name.toUpperCase()}`)
    let db = imports.GROUP.database.get()
    let a = new REST(db)
    let BASKET_STRUCT = {
        report: () => {
            console.log(basket)
        },
        add: (info, uuid, socketIdentifier) => {
            if (basket[uuid] == null) {
                basket[uuid] = {}
            }
            if (basket[uuid][socketIdentifier] == null) {
                if (sockets[socketIdentifier] != uuid) {
                    BASKET_STRUCT.remove({}, uuid, socketIdentifier)
                    sockets[socketIdentifier] = uuid
                }
                basket[uuid][socketIdentifier] = {}
                console.log(chalk`[basket/{green add}] Added ${socketIdentifier} to ${uuid} | ${basket[uuid].length}`)
            }
        },
        setValue(info, uuid, socketIdentifier, key, value) {
            if (basket[uuid]) {
                if (basket[uuid][socketIdentifier]) {
                    basket[uuid][socketIdentifier][key] = value
                    return true
                }
                return false
            }
            return false
        },
        selectAll(info, key, value) {
            const results = JSONPath({ resultType: "path" }, `$..*[?(@property =='${key}' && @ == '${value}')]`, basket);
            if (results.length > 0) {
                let paths = []
                for (let path in results) {
                    let data = JSONPath.toPathArray(results[path].replace('/core/',''))
                    let socket = "/core/" + results[path].split("/core/")[1].split("\']")[0]
                    let value = {}
                    value[data[1]] = socket
                    paths.push(value)
                }
                return paths
            }
            return []
        },
        get: (info, uuid) => {
            if (basket[uuid]) {
                return basket[uuid]
            }
            return null
        },
        has: (info, uuid) => {
            if (basket[uuid] != null) {
                return true
            }
            return false
        },
        remove(info, uuid, socketIdentifier) {
            if (basket[uuid] != null) {
                if (basket[uuid][socketIdentifier] != null) {
                    delete basket[uuid][socketIdentifier]
                    delete sockets[socketIdentifier]
                    console.log(chalk`[basket/{red remove}] Removed ${socketIdentifier} from ${uuid} | ${basket[uuid].length}`)
                }
            }
        }
    }
    register({}, {
        SOCKET: {
            get: () => {
                return io
            }
        },
        BASKET: BASKET_STRUCT
    })
})
