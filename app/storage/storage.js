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

        /*
        
                class Database {
                    ////////////////////////////////////////////////////////////////////////////////////////////////
                    --
                    /**
                     * Gets a role by NAME
                     * @param {String} name 
                     
                    getRoleByName(name) {
                        if (this.isRole(name)) {
                            let role = _roles.findObject({ name })
                            return role
                        }
                        return null
                    }
                    /**
                     * Adds a PERMISSION to a ROLE
                     * @param {String} role 
                     * @param {String} permission 
                     
                    addPermissionToRole(role, permission) {
                        if (!this.roleHasPermission(role, permission)) {
                            let result = _role.findObject({ 'name': role })
                            result.permission.push(permission)
                            _role.update(result)
                        }
                    }
                    /**
                     * Check if a role has a permission. 
                     * @param {String} role 
                     * @param {String} permission 
                     * @return {Boolean}
                     
                    roleHasPermission(role, permission) {
                        if (this.isRole(role)) {
                            let result = _roles.find({ 'name': role, 'permission': { '$contains': permission } })
                            console.log(`RoleHasPermission: ${JSON.stringify(permission)}`)
                            if (result.length > 0) {
                                return true
                            }
                        }
                        return false
                    }
                    /**
                     * Removes a PERMISSION from a role
                     * @param {String} role 
                     * @param {String} permission 
                     
                    removePermissionFromRole(role, permission) {
                        //TODO:
                    }
                    /**
                     * Gets ALL PERMISSIONS from a role
                     * @param {String} role 
                     
                    getPermissionFromRole(role) {
                        if (this.isRole(role)) {
                            let result = _roles.find({ 'name': role })
                            if (result.length > 0) {
                                return result[0]
                            }
                        }
                    }
                    /**
                     * Adds a ROLE to a USER
                     * @param {String} role 
                     * @param {String} user_uuid 
                     
                    addRoleToUser(role, user_uuid) {
                        if (this.isRole(role) && this.isUser(user_uuid)) {
                            let user = this.getUserObjectByUUID(user_uuid)
                            //Check if the roles array already has the role inbound, if so don't add it again.
                            let index = user.roles.findIndex(x => x == role)
                            if (index == -1) {
                                user.roles.push(role)
                                _users.update(user)
                                return true
                            }
                        }
                        return false
                    }
                    /**
                     * Removes a ROLE from a USER
                     * @param {String} role 
                     * @param {String} user_uuid 
                     *
                    removeRoleFromUser(role, user_uuid) { }
        
                    /**
                     * Createa a NEW PROJECT
                     * @param {String}} name 
                     *
                    createProject(name) {
                        let uuid = uuidv4() //make a new uuid for it
                        let pack = null //The plugin pack being used
                        if (!this.isProject(name)) {
                            _projects.insert({ name, uuid, pack })
                            //TODO: create a new loki db for the project (name)
                        }
                    }
                    archiveProject(project_uuid) { }
                    getProjects() { }
                    /**
                     * Check if the given PROJECT exists. 
                     * @param {String} name 
                     *
                    isProject(project) {
                        let result = _projects.find({ 'name': project })
                        if (result.length > 0) return true
                        return false
                    }
                    setProjectPack(project, pack) {
                        if (this.isProject(project) && this.isPack(pack)) {
                            let p = _projects.findObject({ 'name': project })
                            console.log("PROJECT")
                            console.log(JSON.stringify(p))
                            p.pack = pack
                            _projects.update(p)
                        }
                    }
                    getProject(project) {
                        if (this.isProject(project)) {
                            let p = _projects.find({ name: project })[0]
                            return p
                        }
                    }
        
                    addPageToProject(project_uuid, plugin) { }
                    hasPluginCreatedPage(project_uuid) { }
                    
            }*/





        //let _database = new Database()


        Observo.onMount((imports) => {
            console.log("Storage: Loaded Databases Successfully")
            db.saveDatabase()
            imports.app.command.addCommand("add", ["name", "password"], "storage add --name <name> --password <password>", (error) => {
                console.log("Usage: storage add --name <name> --password <password>")
            }, (results) => {
                _db.USERS.addUser(results.name, results.password)
                db.saveDatabase()
                console.log("Added: " + results.name)
            })
            imports.app.command.addCommand("addp", ["name"], "storage addp --name <name>", (error) => {

            }, (results) => {
                _projects.insert({ name: results.name })
                console.log('Added Project')
            })

            imports.app.command.addCommand("get", ["name"], "storage get --name <name>", (error) => {
                console.log("Usage: storage get --name <name>")
            }, (results) => {
                let data = _users.find({ 'name': results.name })
                console.log(JSON.stringify(data))
            })
            imports.app.command.addCommand("update", ["name", "age"], "storage update --name <name> --age <age>", (error) => {
                console.log("Usage: storage get --name <name> --age <age>")
            }, (results) => {
                let data = _users.findObject({ 'name': results.name })
                data.age = results.age
                _users.update(data)
            })
            imports.app.command.addCommand("list", [], "storage list", (error) => {
                console.log("storage list")
            }, (results) => {
                var result = _users.find();
                console.log(JSON.stringify(result))
            })
            imports.app.command.addCommand("newgroup", ["name"], "storage newgroup --name <name>", () => {
                console.log("????")
            }, (results) => {
                _db.GROUPS.createGroup(results.name, "872571a1-0872-4e74-8b90-57df2bb75093")
            })
        })
        Observo.register({
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

