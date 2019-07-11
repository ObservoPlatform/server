
const Fabritect = require("fabritect")
let fab = new Fabritect("Observo")
let app = fab.createGroup("app", {
    color: "cyan",
    require: true, //All default to false
    include: true, //Allow plugins to include files in the directory (not string compatible)
    sections: ["APP"],
    process: true,
})
let plugins = fab.createGroup("plugins", {
    color: "yellow",
    require: false, //Can they use node_moudles
    include: true, //Allow plugins to include files in the directory (not string compatible)
    sections: ["APP"]
})
app.loadFolder("app")
//plugins.loadFolder("plugins")
fab.start(app)
//plugins.loadModule("plugins/data")