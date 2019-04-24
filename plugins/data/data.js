Observo.onMount((imports) => {
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
Observo.register({
    GLOBAL: {
        doSomething: (name, callback) => {
            //Waits for the onMount process to complete
            Observo.isLoaded(() => {
                
            })
        }
    }
})
console.log("{white-bg}{black-fg}Hello from Data{/black-fg}{/white-bg}")