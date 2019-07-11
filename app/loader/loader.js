

//let loader = new LoaderRuntime()
const glob = require("glob")
const fs = require("fs")
//Get packages but promised based on a single folder (within sub folders)
const globFiles = async (path) => {
    return new Promise((resolve) => {
        glob(path, function (er, files) {
            resolve(files)
        })
    })
}
const readFile = async (path) => {
    return new Promise((resolve) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.log(`Error can't read file ${path}`)
            } else {
                resolve(data)
            }
        });
    })
}
let FetchModules = async () => {
    let packs = {}
    let run = async () => {
        let packages = await _getPacks()
        for (let mod in packages) {
            let _item = packages[mod]
            let [path, directory] = _item.split("@")
            //console.log(directory)
            let [_organization, _package, _json] = directory.split("/") //TODO: Is this path the same on Linux?
            console.log(_organization)
            if (packs[_organization] == null) {
                packs[_organization] = {}
            }
            let data = await readFile(_item)
            if (data != null) {
                let obj = JSON.parse(data)
                if (obj.hasOwnProperty("observo")) {
                    if (obj.observo.hasOwnProperty("type")) {
                        packs[_organization][_package] = {}
                        packs[_organization][_package].package = obj
                    }
                } else {
                    console.log("{red Missing Observo in package}")
                }

            }
        }
    }
    let _getPacks = async () => {
        return await globFiles(`${__root}/packages/*/*/package.json`)
    }
    await run()
    proxyPack = new Proxy(packs, {
        set: () => {
            return false
        }
    })
    return proxyPack
}

//List of Opack categories
let categories = {
    "Robotics": null,
    "Games": null,
}

Observo.onMount(async (imports, register) => {
    //console.log("???")
    //console.log(await FetchModules())
    
    register({

    }, {
        
    })
})

