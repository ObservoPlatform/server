const Fabritect = require("fabritect")
let fab = new Fabritect("Observo")
let app = fab.createGroup("app", {
    color: "cyan",
    require: true, //All default to false
    include: true, //Allow plugins to include files in the directory (not string compatible)
    sections: ["APP"]
})
let plugins = fab.createGroup("plugins", {
    color: "yellow",
    require: false, //Can they use node_moudles
    include: true, //Allow plugins to include files in the directory (not string compatible)
    escapes: { //What possible methods can a module attempt to by pass? I mean technically VM2 would work but its slow. Just disable the module if anything bad is found.
        constructor: false,
        eval: false,
        proto: false
    }
})
app.loadFolder("app")
plugins.loadFolder("plugins")
fab.start()