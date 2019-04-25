
/**
 * Observo HTTP App Runtime
 * - This module runs the Express and Socket.io Servers.
 * - Also any "core" events will be ran here.
 * - :)
 */

//Include all modules
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(35575);

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
let buildUserIcons = (_app, _db) => {
    _app.get(`/users/icons/:uuid`, (req, res, next) => {
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
        if (_db.USERS.isUser(user_uuid)) {
            //If so get that user
            let user = _db.USERS.getUserByUUID(user_uuid)
            res.setHeader('Content-Type', 'image/svg+xml');
            //Send the image to the client
            res.status(200).send(user.image)
        } else {
            //TODO: Send a error SVG file
            res.status(404).send('User not found');
        }
    })
}


Observo.onMount((imports, register) => {
    console.log(`LOADING ${name.toUpperCase()}`)
    let db = imports.app.storage._.APP.getDatabase()
    buildUserIcons(app, db)
    /*app.get('/', function (req, res, next) {
        res.sendFile(__dirname + '/web/index.html');
        console.log("{green-fg}Accessed{/green-fg}")
        //db.createPack("FRC Scouting", ["database"])
        db.setProjectPack("Bob", "FRC Scouting")
    });*/

    
    
    register({
        GLOBAL: {

        },
        APP: {
            getSocket: (info) =>  {
                return io
            },
            addHandler: (info, callback) => {
                createPluginHandler(db, info.name, callback)
            },
            addPluginDownload: (info, handler, path) => {
                let { name } = info
                console.log("CREATED /plugins/" + name)
                app.get(`/plugins/${name}`, (req, res, next) => {
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
    })
})
/*
Observo.register({
    GLOBAL: {

    },
    APP: {
        addHandler: (name, handler, callback) => {
            socketInstance.addHandler(handler, callback)
        },
        addPluginDownload: (name, handler, path) => {
            socketInstance.addPluginDownload(handler, path)
        }
    }
})
*/