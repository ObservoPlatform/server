Observo.onMount((imports, register) => {
    console.log(`LOADING ${name.toUpperCase()}`)
    const Loki = require("lokijs")
    const uuidv4 = require("uuid/v4")
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
            let _settings = db.addCollection("settings")
            let _packs = db.addCollection("packs")
            let _plugins = db.addCollection("plugins")
            let _groups = db.addCollection("groups")
            let _projects = db.addCollection("projects")

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
                    createGroup(name, user_uuid) {
                        //TODO: Add check to not create group if already created
                        let id = uuidv4() //Make a uuid for the group, if lets say the name was changed down the road
                        _groups.insert({
                            owner: user_uuid, //Owner of the group, has all permissions of a group, and projects (MASTER)
                            user: user_uuid,  //Also a user of this group
                            uuid: id, //ID if the group
                            name, //Name of it
                            accept: true
                        })
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
                    inviteUserToGroup(group_uuid, user_uuid, accept = false) {

                        _groups.insert({ user: user_uuid, uuid: group_uuid, accepted: accept })
                    },
                    /**
                     * acceptInvite - Accept an invite from a group
                     * @param {String} group_uuid 
                     * @param {String} user_uuid 
                     */
                    acceptInvite(group_uuid, user_uuid) {
                        let invite = _groups.findObject({ 'user': group_uuid, 'uuid': group_uuid })
                        invite.accept = true
                        _groups.update(invite)
                    },
                    /**
                     * listUserInvites - List all user invites
                     * @param {String} user_uuid 
                     */
                    listUserInvites(user_uuid) {
                        //Check if the user has "not" accept any invites (false)
                        let user = _groups.findObject({ 'user': user_uuid, 'accept': false })
                        return user
                    },
                    /**
                     * isUserAccepted - Checks if a user has accepted invite from selected group
                     * @param {String} group_uuid 
                     * @param {String} user_uuid 
                     */
                    isUserAccepted(group_uuid, user_uuid) {
                        if (isUserInGroup(group_uuid, user_uuid)) {
                            let user = _groups.findObject({ 'user': group_uuid, 'uuid': group_uuid })
                            return user.accept
                        }
                    },
                    listGroups(user_uuid) {
                        let data = _groups.find({ 'user': user_uuid, 'accept': true })
                        let groups = {}
                        for (let group in data) {
                            let object = data[group]
                            console.log(JSON.stringify(object))
                            groups[object.name] = object.uuid
                        }
                        return groups
                    }
                },
                /**
                 * PLUGIN STORAGE SUBSET
                 */
                PLUGIN: {
                    /**
                     * Sets a plugins checksum. Creates it if not found, updates if is found
                     * @param {String} plugin 
                     * @param {Hash} checksum 
                     */
                    setPluginRenderChecksum(plugin, checksum) {
                        if (this.isPlugin(plugin)) {
                            let p = _plugins.findObject({ 'name': plugin })
                            p.checksum = checksum
                            _plugins.update(p)
                        } else {
                            _plugins.insert({ name: plugin, checksum: checksum, compiled_checksum: null })
                        }
                    },
                    setPluginCompiledChecksum(plugin, checksum) {
                        if (this.isPlugin(plugin)) {
                            let p = _plugins.findObject({ 'name': plugin })
                            p.compiled_checksum = checksum
                            _plugins.update(p)
                        } else {
                            _plugins.insert({ name: plugin, compiled_checksum: checksum, checksum: null })
                        }
                    },
                    /**
                     * Gets a plugins checksum if its found, if not returns null
                     * @param {String} plugin 
                     * @param {Hash} checksum 
                     */
                    getPluginRenderChecksum(plugin) {
                        if (this.isPlugin(plugin)) {
                            let result = _plugins.find({ 'name': plugin })[0]
                            return result.checksum
                        }
                        return null
                    },
                    getPluginCompiledChecksum(plugin) {
                        if (this.isPlugin(plugin)) {
                            let result = _plugins.find({ 'name': plugin })[0]
                            return result.compiled_checksum
                        }
                        return null
                    },
                    /**
                     * Checks if a plugin exists.
                     * @param {*} plugin 
                     */
                    isPlugin(plugin) {
                        let result = _plugins.find({ 'name': plugin })
                        if (result.length > 0) return true
                        return false
                    }
                },
                PACK: {
                    //////////////////////////////////
                    /**
                     * Create a new pack with a NAME a string array of PLUGINS
                     * @param {String} name 
                     * @param {String Array} plugins 
                     */
                    createPack(name, plugins) {
                        _packs.insert({ name, plugins })
                    },
                    /**
                     * Check if a PACK is valid
                     * @param {String} name 
                     */
                    isPack(name) {
                        let result = _packs.find({ 'name': name })
                        if (result.length > 0) return true
                        return false
                    },
                    /**
                     * Get the PLUGINS in a pack
                     * @param {String} name 
                     */
                    getPack(name) {
                        if (this.isPack(name)) {
                            let pack = _packs.find({ 'name': name })[0]
                            return pack
                        }
                        return null
                    }
                },
                PROJECTS: {
                    createProject(name, group_uuid) {
                        _projects.insert({
                            group: group_uuid,
                            uuid: uuidv4(),
                            name: name,
                            options: {}
                        })
                    },
                    getProjectsFromGroup(group_uuid) {
                        let projects = _project.findObject({ 'group': group_uuid })
                        return projects
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
            register({
                GLOBAL: {

                },
                APP: {
                    getDatabase: () => {
                        return _db
                    }
                }
            })
        }

    })
})