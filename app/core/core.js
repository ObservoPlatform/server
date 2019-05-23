/**
 * app/core - Main Core of Observo Backend
 */
var uuidv4 = require("uuid/v4")


/**
 * ConnectedUser - A user which has connected to the "core" socket
 * 
 * Also used for organizing events
 */
class ConnectedUser {
    constructor(db, socket, client, sessionKey) {
        this.db = db
        this.socket = socket
        this.client = client
        this.sessionKey = sessionKey



        this.uuid = null
        this.validAuth = false

        this.update_group_list()

        this.event_auth_validateAccount()
        this.event_auth_validKey()
        this.event_group_create()
        this.event_group_checker()
        this.event_group_list()
        this.event_users_search()
    }
    /**
     * event_auth_validateAccount 
     * 
     * Validates a users account
     * @param username
     * @param password
     * @param remember
     */
    event_auth_validateAccount() {
        let self = this
        this.client.on("auth_validateAccount", async (data) => {
            let username = data.username
            let password = data.password
            let remember = data.remember

            let user = await self.db.USERS.getUserByName(username)
            if (user != null) {
                let uuid = user.uuid
                console.log(uuid)
                if (await self.db.USERS.validateUserPassword(uuid, password)) {
                    let session = await self.db.USERS.getNewSession(uuid)
                    self.uuid = uuid
                    if (remember) {
                        console.log("A AUTH KEY WOULD BE GIVEN, then the client would save the key in a cookie or localstorage")
                    }
                    self.validAuth = true
                    //TODO: We can use auth key for remember me.
                    self.client.emit("auth_valid", ({ session, uuid, username: user.username }))
                } else {
                    console.log(`Invalid Account: ${user}`)
                    self.client.emit("auth_invalidAccount")
                }
            } else {
                console.log(`Invalid Account: ${user}`)
                self.client.emit("auth_invalidAccount")
            }

        })
    }
    /**
     * event_auth_validKey 
     * 
     * Validates a users auth key and uuid
     * @param uuid
     * @param authKey
     */
    event_auth_validKey() {
        let self = this
        this.client.on("auth_validateKey", async (data) => {
            let uuid = data.uuid
            let authKey = data.authKey
            //Check the Auth Key via the database
            if (await self.db.USERS.validateAuthKey(uuid, authKey)) {
                console.log(`Valid Account: ${uuid}`)
                let session = await self.db.USERS.getNewSession(uuid)
                self.uuid = uuid
                self.validAuth = uuid
                self.client.emit("auth_valid", ({ session, uuid }))
            }
        })

    }
    event_group_checker() {
        let self = this
        this.client.on("groups_checker", async (data) => {
            if (self.uuid != null && data.search != undefined) {
                let search = data.search
                if (search != null && search != "") {
                    let isGroup = await self.db.GROUPS.isGroupByName(search)
                    if (isGroup == true) {
                        self.client.emit("groups_checker", { isGroup: false })
                    } else {
                        self.client.emit("groups_checker", { isGroup: true })
                    }
                } else {
                    self.client.emit("groups_checker", { isGroup: false })
                }
            } else {
                self.client.emit("groups_checker", { isGroup: false })
            }
        })
    }
    event_group_list() {
        let self = this
        this.client.on("groups_list", async () => {
            if (self.uuid != null) {
                self.update_group_list()
            }
        })
    }
    event_group_selected() {
        this.client.on("group_selected", async (data) => {
            if (data.hasPropertyKey("uuid")) {
                let isGroup = await self.db.GROUPS.isGroupByUUID(data.uuid)
                if (isGroup) {
                    
                }
            }
        })
    }
    event_group_projects() {

    }
    event_group_create() {
        let self = this
        this.client.on("group_create", async (data) => {
            console.log("CREATING GROUP")
            if (data.name != undefined && data.members != undefined) {
                let name = data.name
                let members = data.members
                console.log("PASSED")
                let isGroup = await self.db.GROUPS.isGroupByName(name)
                if (isGroup == false) {
                    await self.db.GROUPS.createGroup(name, this.uuid, members)
                    this.update_group_list()
                    console.log("CREATING GROUP:  " + name)
                } else {
                    console.log("group already created")
                }
            }

        })
    }
    event_users_search() {
        let self = this
        this.client.on("users_search", async (data) => {
            if (self.uuid != null && data.search != undefined) {
                let search = data.search
                if (search != null && search != "") {
                    let users = await self.db.USERS.searchUsers(search)
                    if (users.length == 0) {
                        users.push({ none: true })
                    }
                    self.client.emit("users_search", users)
                } else {
                    self.client.emit("users_search", [])
                }
            }
        })
    }
    ///////////////////////////////////
    async update_group_list() {
        let groups = await this.db.GROUPS.listGroups(this.uuid);
        this.client.emit("groups_list", { groups })
        console.log("Updated Group List")
    }
}






Observo.onMount((imports, register) => {
    //Import Database (loki.js)
    let db = imports.app.storage._.APP.getDatabase()
    //Import Socket (socket.io)
    let io = imports.app.http._.APP.getSocket()

    let socket = io.of("/core/").on('connection', function (client) {

        let sessionKey = uuidv4()
        console.log("New Client: " + sessionKey)
        let newUser = new ConnectedUser(db, socket, client, sessionKey)
        client.once('disconnect', function () {
            console.log("Client Disconnected: " + sessionKey)
            client.disconnect()
            newUser = null
        })
    })
})