Observo.onMount((imports, register) => {
    console.log("{blue Hello from Data}")
    //imports.app.http - HTTP & XML requests
    //imports.app.math - EXCEL math based functions
    //imports.app.user - Check user roles with database
    class Example {
        constructor() {
            //A new class instance is created for each project
            console.log("Im a new class")
        }
        onConnect(global, client, uuid, page) {
           console.log("new clientssss")
        }
        onDisconnect(global, client, uuid, page) {
            
        }
    }
    imports.app.loader.register(Example)
})

