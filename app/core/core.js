/**
 * app/core 
 * @author ImportProgram <importprogram.me>
 * @copyright ObservoPlatform 2019
 *
 * 
 * Welcome to the CORE of Observo. This is the main runtime of observo.
 * It handles all of the common "core" features, like user connecting,
 * authentication via sockets and everything else (fetching common data).
 * 
 * The core should NEVER be require by a GROUP module, but a PLUGIN/PACK will
 * always be allowed.
 * 
 */



var uuidv4 = require("uuid/v4")

//All Connected Sockets (based on UUIDS)
let basket = {}

//TODO: Make Fabritect support custom globals (Observo.global.debug?)
let debug = true
let print = (value) => {
    if (debug) {
        console.log(value)
    }
}
/**
 * SocketUser - 
 * 
 * A user connected via a single socket.
 * A user may have multiple clients connected on a single user uuid.
 * 
 * Primarily used for organizing core events for /core/ socket
 */
class User {
    constructor(db, basket, {socket, client, io}, notification, session) {
        this.db = db
        this.basket = basket

        this.socket = socket
        this.client = client
        this.io = io

        this.notification = notification
        
        this.session = session
        this.uuid = null
        this.validAuth = false


        this.event_auth_validateAccount()
        this.event_auth_validKey()
        this.event_group_create()
        this.event_group_checker()
        this.event_group_list()
        this.event_users_search()
        this.event_group_selected()
    }
    basket_remove() {
        this.basket.remove(this.uuid, this.client.id)
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
        this.client.on("auth/validateAccount", async (data) => {
            //Get the users data
            let username = data.username
            let password = data.password
            let remember = data.remember
            //Get the user (if has username)
            let user = await self.db.USERS.getUserByName(username)
            if (user != null) {
                //If valid username, grab uuid
                let uuid = user.uuid
                //With the UUID validate the user with the password
                //TODO: Need to hash the password (both into database)
                if (await self.db.USERS.validateUserPassword(uuid, password)) {
                    let session = await self.db.USERS.getNewSession(uuid)
                    self.uuid = uuid
                    print(`[auth/validateAccount] Validating User| ${this.uuid}`)
                    //TODO: Send authkey (for so they don't have to keep logging
                    self.validAuth = true
                    //Add the user to the user basket (pool)
                    this.basket.add(this.uuid, this.client.id)

                    //TODO: We can use auth key for remember me.
                    self.client.emit("auth/valid", ({ session, uuid, username: user.username }))
                    this.event_auth_valid()
                } else {
                    //Invalid
                    print(`[auth/validateAccount] Validating Failed | ${this.uuid}`)
                    self.client.emit("auth/invalid")
                }
            } else {
                //Invalid
                print(`[auth/validateKey] Validating User | ${this.uuid}`)
                self.client.emit("auth/invalid")
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
        this.client.on("auth/validateKey", async (data) => {
            let uuid = data.uuid
            let authKey = data.authKey
            //Check the Authentication Key via the database
            if (await self.db.USERS.validateAuthKey(uuid, authKey)) {
                let session = await self.db.USERS.getNewSession(uuid)
                self.uuid = uuid //Users UUID
                self.validAuth = true //Valid Authentication
                //Add the user to the user basket (pool)
                this.basket.add(this.uuid, this.client.id)
                self.client.emit("auth/valid", ({ session, uuid }))
                print(`[auth/validateKey] Validating User | ${this.uuid}`)
                this.event_auth_valid()
            } else {
                //INVALID Authentication Key Token
                self.client.emit("auth/invalid")
            }
        })

    }
    /**
     * event_auth_valid - Update the client when a user logs in
     */
    event_auth_valid() {
        //Update things
        this.update_group_list()
        this.update_notification()
    }
    ///////////////////////
    event_group_checker() {
        let self = this
        this.client.on("groups/checker", async (data) => {
            if (self.uuid != null && data.search != undefined) {
                let search = data.search
                if (search != null && search != "") {
                    let isGroup = await self.db.GROUPS.isGroupByName(search)
                    print(`[group/checker] Validating Group: ${search}~${isGroup} | ${this.uuid}`)
                    if (isGroup == true) {
                        self.client.emit("groups/checker", { isGroup: false })
                    } else {
                        self.client.emit("groups/checker", { isGroup: true })
                    }
                } else {
                    self.client.emit("groups/checker", { isGroup: false })
                }
            } else {
                self.client.emit("groups/checker", { isGroup: false })
            }
        })
    }
    /**
     * event_group_list - List of all groups the user has accepted (or created)
     */
    event_group_list() {
        let self = this
        this.client.on("groups/list", async () => {
            if (self.uuid != null) {
                self.update_group_list()
            }
        })
    }
    /**
     * event_group_selected - When a user selects a group to view
     */
    event_group_selected() {
        let self = this
        this.client.on("groups/select", async (data) => {
            if (data.uuid != null) {
                if (this.selectedGroup != data.uuid) {
                    let isGroup = await self.db.GROUPS.isGroupByUUID(data.uuid)
                    if (isGroup) {
                        this.selectedGroup = data.uuid
                        print(`[group/select] Selected Group: ${data.uuid} | ${this.uuid}`)
                    }
                }
            }
        })
    }
    /**
     * event_group_projects - Get a list of group projects
     * TODO: Yes
     */
    event_group_projects() {

    }
    /**
     * event_group_create - When a user creates a new group
     */
    event_group_create() {
        let self = this
        this.client.on("groups/create", async (data) => {
            print(`[group/create] Attempting to Create Group | ${this.uuid}`)
            //Check if the data is valid data
            if (data.name != undefined && data.members != undefined) {

                //Get this valid data
                //TODO: Use shorthand ifs maybe?
                let name = data.name
                let members = data.members
                //Check if the group is not already being used.
                //The reason for this check is to make sure not multiple users
                //aren't creating the same group at the same time.
                let isGroup = await self.db.GROUPS.isGroupByName(name)
                if (isGroup == false) {
                    //Now create the group
                    await self.db.GROUPS.createGroup(name, this.uuid, members)
                    //Loop all members in the group

                    for (let member in members) {
                        //Grab the members uuid
                        let id = members[member]
                        //Send a notification to the members (if online, and offline)
                        await this.notification.create(id, {
                            title: "Invited to Group",
                            message: `You have been invited to join group: ${name}`,
                            icon: "usergroup-add",
                            color: "green"
                        }, true)
                    }
                    //Now update the CREATORS list of groups (should be at bottom but whatever)
                    //TODO: Add personal search for groups?
                    await this.update_group_list()
                    print(`[group/create] Creating Group Successfully | ${this.uuid}`)
                } else {
                    //Error if group is already created
                    print(`[group/create] Group Already Created | ${this.uuid}`)
                    await this.notification.create(this.uuid, {
                        title: "Group Error!",
                        message: `This group has already been created`,
                        icon: "error",
                        color: "red"
                    }, false)
                }
            }

        })
    }
    /**
     * event_users_search - Search for a group with a name thats NOT taken
     */
    event_users_search() {
        let self = this
        this.client.on("users/search", async (data) => {
            print(`[users/search] Attempting User Search | ${this.uuid}`)
            //Check if data client is sending is valid
            if (self.uuid != null && data.search != undefined) {
                //If valid, parse data
                let search = data.search
                //Now check if the data isn't blank
                if (search != null && search != "") {
                    //Attempt a search from the database
                    let users = await self.db.USERS.searchUsers(search)
                    //If nothing match send nothing (but as an object)
                    if (users.length == 0) {
                        users.push({ none: true })
                    }
                    print(`[users/search] User Search Completed | ${this.uuid}`)
                    //Now send the users (or nothing) to the client
                    self.client.emit("users/search", users)
                } else {
                    //If the search was invalid, this time we will literally send nothing
                    self.client.emit("users/search", [])
                }
            }
        })
    }
    ///////////////////////////////////
    /**
     * update_group_list - Updates the group list of users
     */
    async update_group_list() {
        //Valid Authentication?
        if (this.validAuth) {
            //Get the list of groups the user is accepted in
            let groups = await this.db.GROUPS.listGroups(this.uuid);
            //Send list of groups to client
            this.client.emit("groups/list", { groups })
            print(`[group/list] Updating Groups | ${this.uuid}`)
        }

    }
    /**
     * updateNotifications - Update the users notifications
     */
    async update_notification() {
        if (this.validAuth) {
            let self = this
            print(`[notifications/list] Attempt Updating Notifications | ${this.uuid}`)
            this.notification.updateAmount(this.uuid)
            this.client.on("notifications/list", async (page) => {
                let notifications = await self.notification.get(self.uuid, page)
                self.client.emit("notifications/list", notifications)
                print(`[notifications/list] Pushed Notifications Successfully | ${this.uuid}`)
            })
        }
    }
}


Observo.onMount(async (imports, register) => {
    //Import Socket System
    let io = imports.GROUP.network.SOCKET.get()
    let basket = imports.GROUP.network.BASKET
    //Import Database Scheme 
    let db = imports.GROUP.database.get()
    //Import Notification System
    let notification = imports.GROUP.notification.get()
    let socket = io.of("/core/").on('connection', function (client) {
        let session = uuidv4()
        print(`Client Connected | S ${session} - C ${client.id}`)
        let user = new User(db, basket, {socket, client, io}, notification, session)
        client.once('disconnect', function () {
            user.basket_remove()
            print(`Client Disconnected | S ${session} - C ${client.id}`)
            client.disconnect()
            user = null
        })
    })
    register(
        {

        },
        {
            /**
             * NOTIFICATION API
             * imports.GROUP.core.NOTIFICATION.create("Hello World", {save: true, icon: "pizza"})
             */
            NOTIFICATION: {
                create(info, message, options) {

                }
            }
        }
    )
})