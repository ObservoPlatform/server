/**
 * Observo 3.0.0
 */


//Load all defined and interactive console
let DefinedManager = require("./defined.js")
let InteractiveConsole = require("./console.js")


//Create a new instance of manager
let manager = new DefinedManager()
manager.setDefinedID("Observo")

//Set the logging from Defined to show on the IntertactiveConsole
manager.setLog((section, name, text) => {
    section = section.toUpperCase()
    name = name.toUpperCase()

    InteractiveConsole.message(`${section}:${name}`, `${text}`)
})


//When the Interactive Console has submitted a value (do something?)


/**
 * Transform any code we want when loading a defined module
 */
manager.transformCode((code, name) => {
    code = `//# sourceURL=${name.toUpperCase()}\n
    ${code}`

    //console.log(newCode)
    return code

})


let version = "2.0.1b"
let build = "12/16/2018@7:56"
let apps = manager.addDefined("APP", ["./app"], true, ["APP"]) //LOAD ALL API's
let plugins = manager.addDefined("PLUGINS", ["./plugins"], false) //LOAD CUSTOM PLUGINS


let a = []
for (let app in apps) {
    if (app != "__customRegisters") {
        a.push(app.toUpperCase())
    }
}
InteractiveConsole.setModules("APP", a)

let p = []
for (let plugin in plugins) {
    if (plugin != "__customRegisters") {
        p.push(plugin.toUpperCase())
    }
}
InteractiveConsole.setModules("PLUGINS", p)

InteractiveConsole.onConsole((value) => {
    apps.command.services.APP.onCommand(value)
})


manager.onAppReady((log) => {
    log(`{blue-fg}Running Observo ${version} built on ${build}{/blue-fg}`)
    log(`No update has been found.`)
})