Observo.onMount((imports, register) => {
    console.log(`LOADING ${__name.toUpperCase()}`)
    const Loki = require("lokijs")
    const uuidv4 = require("uuid/v4")
    console.log(__root)
    let db = new Loki(__root + "/db/core.json", {
        autosave: true,
        autosaveInterval: 5000
    });
    var jdenticon = require("jdenticon")

    db.loadDatabase({}, (err) => {
        if (err) {
            console.log("$4Failed to load storage : " + err);
        }
        else {
            let _users = db.addCollection("users")
            let _groups = db.addCollection("groups")
            let _notifications = db.addCollection("notifications")

            let _loadedDB = {}
            //When a new project is created (projects/3878hf382gsjf9h9f.proj)
            //let _pages = db.addCollection("pages")
            //let _roles = db.addCollection("roles")
            let _db = {
                /**
                 * USERS STORAGE SUBSET
                 */
                USERS: {
                    //TODO: Move jdenticon to other location
                    addUser(username, password) {
                        let uuid = uuidv4() //Grab a uuid
                        let session = uuidv4()

                        let authKey = null
                        let image = jdenticon.toSvg(username, 50);

                        _users.insert({
                            username,
                            name,
                            uuid,
                            password,
                            session,
                            authKey,
                            image,
                        })
                    },
                    /**
                     * removeUser - Removes a user
                     * @param {String} user_uuid 
                     */
                    removeUser(user_uuid) {
                        if (this.isUser(user_uuid)) {
                            let user = this.getUserObjectByUUID(user_uuid)
                            user.remove()
                            db.saveDatabase()
                            return true
                        }
                        return false
                    },
                    /**
                     * Check if a user is real.
                     * @param {String} user_uuid 
                     */
                    isUser(user_uuid) {
                        let users = _users.find({ uuid: user_uuid })

                        if (users.length > 0) {
                            return true
                        }
                        return false
                    },
                    /**
                     * isUserByName - Check if name is a real user.
                     * @param {String} name 
                     */
                    isUserByName(name) {
                        let users = _users.find({ username: name })

                        if (users.length > 0) {
                            return true
                        }
                        return false
                    },
                    /**
                     * Gets the USER object from the UUID
                     * @param {String} user_uuid 
                     */
                    getUserObjectByUUID(user_uuid) {
                        if (this.isUser(user_uuid)) {
                            let user = _users.findObject({ uuid: user_uuid })
                            return user
                        }
                        return null
                    },
                    /**
                    * Gets the USER data from the UUID
                    * @param {String} user_uuid 
                    */
                    getUserByName(name) {
                        if (this.isUserByName(name)) {
                            let user = _users.find({ username: name })[0]
                            return user
                        }
                        return null
                    },
                    /**
                     * getsUserByUUID - Gets a user by their UUID
                     * @param {String} user_uuid 
                     */
                    getUserByUUID(user_uuid) {
                        if (this.isUser(user_uuid)) {
                            let user = _users.find({ uuid: user_uuid })[0]
                            return user
                        }
                        return null
                    },
                    /**
                     * getUserObjectByUUID - Gets a users object from their UUID
                     * @param {String} user_uuid 
                     */
                    getUserObjectByUUID(user_uuid) {
                        if (this.isUser(user_uuid)) {
                            let user = _users.findObject({ uuid: user_uuid })
                            return user
                        }
                        return null
                    },
                    /**
                     * Checks if a user password matches. 
                     * This doesn't hash/salt it, that needs to be done before callong
                     * @param {String} user_uuid 
                     * @param {String} password 
                     */
                    validateUserPassword(user_uuid, password) {
                        if (this.isUser(user_uuid)) {
                            let user = this.getUserByUUID(user_uuid)
                            if (user.password == password) {
                                return true
                            }
                        }
                        return false
                    },
                    /**
                     * Checks if a session is valid. Session uuid is given to a user when a an authKey has been used. 
                     * Usually an authKey is used between changes of dialogs. Session keys resets when authKey is accessed
                     * @param {String} user_uuid 
                     * @param {String} session 
                     */
                    validateSession(user_uuid, session) {
                        if (this.isUser(user_uuid)) {
                            let user = this.getUserByUUID(user_uuid)
                            if (user.password == password) {
                                //TODO: Reset the authkey (aka regenerate it here)
                                return true
                            }
                        }
                        return false
                    },
                    /**
                     * Checks if a authentication key is valid. Can only be used once then its reset.
                     * @param {String} user_uuid 
                     * @param {String} authKey 
                     */
                    validateAuthKey(user_uuid, authKey) {
                        console.log("yes")
                        if (this.isUser(user_uuid)) {
                            console.log("here")
                            let user = this.getUserByUUID(user_uuid)
                            if (user.authKey == authKey) {
                                return true
                            }
                        }
                        return false
                    },
                    getNewSession(user_uuid) {
                        if (this.isUser(user_uuid)) {
                            console.log("here")
                            let user = this.getUserObjectByUUID(user_uuid)
                            let session = uuidv4()
                            user.session = session
                            console.log("updating")
                            _users.update(user)
                            return session
                        }
                        return null
                    },
                    /**
                     * Returns all USERS
                     */
                    getUsers() {
                        return _users.find()
                    },
                    searchUsers(search) {

                        let users = _users.chain().find({ 'name': { '$contains': search.toLowerCase() } }).limit(10).data()
                        let data = []
                        for (let key in users) {
                            let user = users[key]
                            data.push({ username: user.username, uuid: user.uuid })
                        }
                        return data
                    }
                },
                /**
                 * GROUP STORAGE SUBSET
                 */
                GROUPS: {
                    /**
                     * createGroup - Creates a group with a name, and includes the owner
                     * @param {String} name 
                     * @param {String} user_uuid 
                     */
                    createGroup(name, user_uuid, members) {
                        if (_db.USERS.isUser(user_uuid)) {
                            //TODO: Add check to not create group if already created
                            let id = uuidv4() //Make a uuid for the group, if lets say the name was changed down the road
                            _groups.insert({
                                owners: [user_uuid], //Owner of the group, has all permissions of a group, and projects (MASTER)
                                uuid: id, //ID if the group
                                name, //Name of it,
                                projects: []
                            })
                            //Invite all users to the group
                            for (let member in members) {
                                this.addUserToGroup(id, members[member], { invited: false, permissions: [] })
                            }
                            //Add owner tog group
                            this.addUserToGroup(id, user_uuid, { invited: true, permissions: ["*"] })
                        }
                    },
                    hasGroupPermission(user_uuid, permission) {

                    },
                    async createProject(user_uuid, group_uuid) {
                        if (await this.isGroupByUUID(group_uuid)) {

                        }
                    },
                    /**
                     * isGroup - Check if a group, by name is already created. 
                     * @param {String} name
                     */
                    isGroupByName(name) {
                        let users = _groups.where((obj) => {
                            return name.toLowerCase() == obj.name.toLowerCase()
                        })
                        if (users.length > 0) {
                            return true
                        }
                        return false
                    },
                    /**
                     * getNameOfGroup - 
                     * @param {String} group_uuid 
                     */
                    getNameOfGroup(group_uuid) {
                        if (this.isGroupByUUID(group_uuid)) {
                            return _groups.findObject({ "uuid": group_uuid }).name
                        }
                        return null
                    },
                    /**
                     * isGroupByUUID - Check if a group by uuid is already created
                     * @param {String} group_uuid 
                     */
                    isGroupByUUID(group_uuid) {
                        let groups = _groups.find({ uuid: group_uuid })
                        if (groups.length > 0) {
                            return true
                        }
                        return false
                    },
                    /**
                     * isUserInGroup - Checks if a user is in prime
                     * @param {String} group_uuid 
                     * @param {String} user_uuid 
                     */
                    isUserInGroup(group_uuid, user_uuid) {
                        let user = _groups.findObject({ 'user': group_uuid, 'uuid': user_uuid })
                        if (user.length > 1) {
                            return true
                        }
                        return false
                    },
                    /**
                     * inviteUserToGroup - Invites a user to a group.
                     * @param {String} group_uuid 
                     * @param {String} user_uuid 
                     * @param {Boolean} accept 
                     */
                    addUserToGroup(group_uuid, user_uuid, options) {
                        console.log(user_uuid)
                        if (_db.USERS.isUser(user_uuid)) {
                            let user = _users.findObject({ 'uuid': user_uuid })
                            if (user.groups == null) {
                                user.groups = {}
                            }
                            if (user.groups[group_uuid] == null) {
                                user.groups[group_uuid] = {}
                            }
                            user.groups[group_uuid] = options
                            _users.update(user)
                        } else {
                            console.log("Invalid User...")
                        }
                    },
                    async listGroups(user_uuid) {
                        let data = _users.findObject({ 'uuid': user_uuid })
                        let groups = {}
                        if (data != null) {
                            for (let group in data.groups) {
                                if (data.groups[group].invited != null) {
                                    if (data.groups[group].invited == true) {
                                        let name = await this.getNameOfGroup(group)
                                        groups[name] = group
                                    }
                                }
                            }
                        }

                        return groups
                    },
                    PERMISSION: {
                        addPermission(user_uuid, group_uuid, permission) {
                            if (_db.USERS.isUser(user_uuid) && _db.GROUPS.isGroupByUUID(group_uuid)) {
                                let user = _users.findObject({ 'uuid': user_uuid })
                                if (!user.groups[group_uuid].permissions.includes(permission)) {
                                    user.groups[group_uuid].permissions.push(permission)
                                }
                                _users.update(user)
                            }
                        },
                        hasPermission(user_uuid, group_uuid, permission) {
                            if (_db.USERS.isUser(user_uuid) && _db.GROUPS.isGroupByUUID(group_uuid)) {
                                let user = _users.findObject({ 'uuid': user_uuid })
                                return user.groups[group_uuid].permissions.includes(permission)
                            }
                            return null
                        }
                    }
                },
                /**
                 * PLUGIN STORAGE SUBSET
                 */
                NOTIFICATION: {
                    create(user_uuid, title, message, icon, color) {
                        let id = uuidv4()
                        _notifications.insert({
                            user_uuid,
                            title,
                            message,
                            icon,
                            color,
                            read: false,
                            id,
                        })
                    },
                    /**
                     * Get the amount of notifications a user has not read
                     * @param {*} user_uuid 
                     * @param {*} id 
                     */
                    getAmount(user_uuid) {
                        let results = _notifications.find({
                            user_uuid,
                            read: false,
                        });
                        if (results.length > 0) {
                            return results.length
                        }
                        return 0
                    },
                    getStored(user_uuid, last_notification) {
                        let last = _notifications.find({
                            id: last_notification
                        })

                        let results = []
                        if (last.length > 0) {
                            results = _notifications.chain().find({
                                user_uuid,
                                "$loki": { "$lt": last[0]["$loki"] }
                            }).simplesort("$loki", true).limit(15).data();
                        } else {
                            results = _notifications.chain().find({
                                user_uuid,
                            }).simplesort("$loki", true).limit(15).data();
                        }
                        if (results.length > 0) {
                            return results
                        }
                        return null
                    },
                    markAsRead(user_uuid, id) {

                    },
                    delete(user_uuid, id) {

                    }
                },
                PROJECTS: {
                    /**
                     * createProject - Creates a new project based on a name and the group
                     * @param {String} name 
                     * @param {String} group_uuid 
                     */
                    async createProject(name, group_uuid) {
                        let uuid = uuidv4()
                        _projects.insert({
                            group: group_uuid,
                            uuid,
                            options: {}
                        })
                        await this.addProjectToGroup(name, uuid, group_uuid)
                        return true
                    },
                    /**
                     * addProjectToGroup - Adds a project to the group 
                     * @param {String} name Project Name
                     * @param {String} project_uuid Project UUID
                     * @param {String} group_uuid Group UUID
                     */
                    async addProjectToGroup(name, project_uuid, group_uuid) {
                        //Find the group object
                        let group = _groups.findObject({ "uuid": group_uuid })
                        //If there is an entry
                        if (group.length > 0) {
                            //Check if projects is made, if not make it an object
                            if (group.hasOwnProperty("projects")) {
                                group.projects = {}
                            }
                            //Save the name in projects
                            group.project[project_uuid] = name
                            //Update the group entry
                            _groups.update(group)
                        }
                        return true
                    },
                    async getProjects(group_uuid) {
                        let group = _groups.findObject({ "uuid": group_uuid })
                        //If there is an entry
                        if (group.length > 0) {
                            //Return all projects
                            return group.projects
                        }
                        return null //If not a group, return null
                    },
                    getProject() {
                        if (this.isProjectByUUID(project_uuid)) {
                            let project = _project.findObject({ 'uuid': project_uuid })
                            return project
                        }
                    },
                    isProjectByName() {
                        //?
                    },
                    /**
                     * isProjectByUUID - Is a project real?
                     * @param {String} project_uuid 
                     */
                    isProjectByUUID(project_uuid) {
                        let projects = _projects.find({ 'uuid': project_uuid })
                        if (projects.length > 1) return true
                        return false
                    },
                    DB: {
                        /**
                         * [DB] makeStorage - Creates/Loads the database for a project. Only needed to be done
                         * when a project is being accessed. 
                         */
                        makeStorage(name, project_uuid) {
                            if (_loadedDB[name] != null) {
                                _loadedDB[name] = new Loki(__root + `/db/projects/${project_uuid}.json`, {
                                    autosave: true,
                                    autosaveInterval: 5000
                                });
                            }
                        },
                        /**
                         * [DB] makeManagement - Creates the database for roles, for this project. 
                         * 
                         * TODO:
                         * Copy Roles from other projects. 
                         * Not all projects will have same roles
                         * Packs can import a role base line.
                         * 
                         * @param {String} name 
                         * @param {String} project_uuid 
                         */
                        makeManagement(name, project_uuid) {

                        }
                    }
                }
            }
            register({}, {
                get: () => {
                    return _db
                }
            })
        }

    })
})