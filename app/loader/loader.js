

const fs = require('fs-extra');
const crypto = require('crypto');


//TODO: Redo this entire loading system (for compiling client code, also validation checks!)
class LoaderRuntime {
    constructor() {
        this.plugins = {}
        this.projects = {}
    }
    registerPlugin(name, runtime) {
        if (this.plugins[name] == null) {
            this.plugins[name] = runtime
        }
    }
    /**
     * Creates a checksum based on a string.
     * @param {String} str 
     * @param {String} algorithm 
     * @param {String} encoding 
     */
    generateChecksum(str, algorithm, encoding) {
        return crypto
            .createHash(algorithm || 'md5')
            .update(str, 'utf8')
            .digest(encoding || 'hex');
    }
    /**
     * Compiles all rendered files from plugins and serves them to the user.
     * @param {Object} imports 
     */
    compileRender(imports) {
        let self = this
        //Grab the list of plugins packages from defined
        let plugins = Observo.getDefined().plugins
        let db = imports.app.storage.APP.getDatabase()
        //Loop it
        for (let plugin in plugins) {
            //Grab package ifno
            let info = plugins[plugin].package
            //Check if render is a real option
            if (info.render != null) {
                let dirname = plugins[plugin].__dirname
                let filePath = dirname + "/" + info.render
                let compiledPath = dirname + "/cache/compiled.js"
                //Check if the RENDER FILE and WATCH IT
                fs.access(filePath, fs.F_OK, (err) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    let doCompile = () => {
                        fs.readFile(filePath, function (err, data) {
                            require("@babel/core").transform(data, {
                                presets: ["@babel/preset-env", "@babel/preset-react"],
                                plugins: ["@babel/plugin-transform-async-to-generator", "@babel/plugin-transform-spread"]
                            }, (err, result) => {
                                if (err) {
                                    console.log(err)
                                    return
                                }
                                fs.outputFile(compiledPath, result.code, err => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        let rcs = self.generateChecksum(data)
                                        let ccs = self.generateChecksum(result.code)
                                        console.log("CHECKSUM: " + rcs)
                                        console.log("CHECKSUM COMPILED: " + ccs)
                                        db.PLUGIN.setPluginRenderChecksum(plugin, rcs)
                                        db.PLUGIN.setPluginCompiledChecksum(plugin, ccs)
                                    }
                                })
                            });
                        });
                    }
                    let checkFile = () => {
                        //console.log(filePath)
                        fs.readFile(filePath, function (err, data) {
                            if (err) {
                                return
                            }
                            let cs = self.generateChecksum(data)
                            let scs = db.PLUGIN.getPluginRenderChecksum(plugin)
                            console.log("CHECKSUM FILE: " + cs)
                            console.log("CHECKSUM STORED:" + scs)
                            if (db.PLUGIN.getPluginRenderChecksum(plugin) == cs) {
                                console.log("Valid Checksum!")
                                //Check if the COMPILED file has been created. (lets say it got deleted, just check)
                                fs.access(compiledPath, fs.F_OK, (err) => {
                                    if (err) {
                                        //If not found, it will re compile
                                        doCompile()
                                        return
                                    }
                                })

                            } else {
                                console.log("Invalid Checksum!")
                                doCompile()
                            }
                        });
                    }
                    //TODO: Make it DEVELOPMENT only
                    let active = false
                    fs.watch(filePath, (event, filename) => {
                        if (filename && event == 'change' && active == false) {
                            active = true;
                            setTimeout(() => {
                                checkFile()
                                active = false;
                            }, 100)
                        }
                    });
                    checkFile()


                })
                //Add the download for the plugin to the express server.
                imports.app.http.APP.addPluginDownload(plugin, compiledPath)
            }
        }
    }
    activate(imports) {
        //Compiles all render files
        this.compileRender(imports)
        //console.log(JSON.stringify(Observo.getDefined()))
        for (let plugin in this.plugins) {
            console.log("adding handler")
            imports.app.http.APP.addHandler(plugin, (main, client, uuid, project) => {
                console.log(project)
                if (this.projects[project] == null) {
                    let classRuntime = this.plugins[plugin];
                    this.projects[project] = new classRuntime();
                    console.log("created new project runtime")
                }
                //TODO: Add pages in
                let page = "UNKNOWN"
                this.projects[project].onConnect(main, client, uuid, page)
                client.once("disconnect", () => {
                    this.projects[project].onDisconnect(main, client, uuid, page)
                })
            })
        }
    }
}
//let loader = new LoaderRuntime()

Observo.onMount((imports, register) => {
    //loader.activate(imports)
    register({
        GLOBAL: {
            register: (info, runtime) => {
                console.log(`${info.name} is registered`)
                //loader.registerPlugin(name, runtime)
            }
        }
    })
})

