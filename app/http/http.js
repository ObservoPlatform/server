
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
var uuidv4 = require("uuid/v4")

server.listen(35575);





class SocketRuntime {
    constructor() {
        this.imports = []
        this.handlers = {}
        this.created = {}
    }
    addHandler(name, callback) {
        if (this.handlers[name] == null) {
            this.handlers[name] = callback
            if (this.imports != []) {
                this.buildHandlers(this.imports)
            }
        } else {
            console.log(`${name} is already a registered event handler!`)
        }
    }
    buildHandlers(imports) {
        for (let handler in this.handlers) {
            console.log(`plugins/${handler}`)
            if (this.created[handler] == null) {
                let main = io.of("plugins/" + handler).on('connection', function (client) {
                    client.on("auth_checkSession", (data) => {
                        let uuid = data.uuid
                        let session = data.session
                        let project = data.project
                        if (uuid != null && uuid != "") {
                            //TODO: Maybe check with core client on what project is being viewed instead.
                            if (imports.app.storage.APP.validateSession(uuid, session) && imports.app.storage.isProject(project)) {
                                client.emit("auth_validSession")
                                this.handlers[handler](main, client, data.uuid, data.project)
                            } else {
                                client.emit("auth_error", { error: "invalid session" })
                            }
                        }
                    })
                })
                console.log(main)
            }
            this.created[handler] = true
        }
    }
    buildUserIconAPI(imports) {
        let db = imports.app.storage.APP.getDatabase()
        app.get(`/users/icons/:uuid`, (req, res, next) => {
            console.log("hi")
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
            if (db.USERS.isUser(user_uuid)) {
                let user = db.USERS.getUserByUUID(user_uuid)
                res.setHeader('Content-Type', 'image/svg+xml');
                res.status(200).send(user.image)
            } else {
                res.status(404).send('User not found');
            }
        })
    }
    activate(imports) {
        console.log("HEY DO I WORK")
        this.buildUserIconAPI(imports)
        this.imports = imports
    }
    addPluginDownload(name, path) {
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

let socketInstance = new SocketRuntime();

Observo.onCustomMount((imports) => {
    let db = imports.app.storage.APP.getDatabase()

    let socket = io.of("/core/").on('connection', function (client) {
        let sessionKey = uuidv4()
        let valid_auth = false
        let user_uuid = null
        let user_project = true
        console.log("New Client: " + sessionKey)
        client.once('disconnect', function () {
            console.log("Client Disconnected: " + sessionKey)
            client.disconnect()
        })
        client.on("auth_validateAccount", async (data) => {
            let username = data.username
            let password = data.password
            let remember = data.remember

            let user = await db.USERS.getUserByName(username)
            if (user != null) {
                let uuid = user.uuid
                console.log(uuid)
                if (await db.USERS.validateUserPassword(uuid, password)) {
                    let session = await db.USERS.getNewSession(uuid)
                    user_uuid = uuid
                    console.log("valid password weird")
                    if (remember) {
                        console.log("A AUTH KEY WOULD BE GIVEN, then the client would save the key in a cookie or localstorage")
                    }
                    valid_auth = true
                    //TODO: We can use auth key for remember me.
                    client.emit("auth_valid", ({ session, uuid, username: user.username }))
                } else {
                    client.emit("auth_invalidAccount")
                }
            } else {
                client.emit("auth_invalidAccount")
            }

        })
        /**
         * Validate AUTH KEY - Checks if the UUID and Auth key are valid
         */
        client.on("auth_validateKey", async (data) => {
            let uuid = data.uuid
            let authKey = data.authKey
            //Check the Auth Key via the database
            if (await db.USERS.validateAuthKey(uuid, authKey)) {
                console.log("VALID user")
                let session = await db.USERS.getNewSession(uuid)
                user_uuid = uuid
                valid_auth = true
                client.emit("auth_valid", ({ session, uuid }))
            }
        })

        client.on("groups_create", async (data) => {
            let user_uuid = data.uuid
            let name = data.uuid
            if (!await db.GROUPS.isGroup(name)) {
                db.GROUPS.addGroup(name)
            }
        })
        client.on("groups_checker", async (data) => {
            if (user_uuid != null && data.search != undefined) {
                let search = data.search
                if (search != null && search != "") {
                    console.log("SEARCH: " + search)
                    let isGroup = await db.GROUPS.isGroupByName(search)
                    if (isGroup == true) {
                        client.emit("groups_checker", { isGroup: false })
                    } else {
                        client.emit("groups_checker", { isGroup: true })
                    }
                } else {
                    client.emit("groups_checker", { isGroup: false })
                }
            } else {
                client.emit("groups_checker", { isGroup: false })
            }
        })
        let updateGroupList = async () => {
            let groups = await db.GROUPS.listGroups(user_uuid);
            console.log(JSON.stringify(groups))
            client.emit("groups_list", { groups })
        }
        client.on("groups_list", async () => {
            if (user_uuid != null) {
                updateGroupList()
            }
        })
        client.on("users_search", async (data) => {
            console.log("YES")
            if (user_uuid != null && data.search != undefined) {
                let search = data.search
                if (search != null && search != "") {
                    console.log("SEARCH: " + search)
                    let users = await db.USERS.searchUsers(search)
                    console.log(JSON.stringify(users))
                    if (users.length == 0) {
                        users.push({ none: true })
                    }
                    client.emit("users_search", users)
                } else {
                    client.emit("users_search", [])
                }

            }
        })

    })

    app.get('/', function (req, res, next) {
        res.sendFile(__dirname + '/web/index.html');
        console.log("{green-fg}Accessed{/green-fg}")
        //db.createPack("FRC Scouting", ["database"])
        db.setProjectPack("Bob", "FRC Scouting")
    });
    socketInstance.activate(imports)
})
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