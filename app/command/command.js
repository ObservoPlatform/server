
/**
 * Observo's Interactive Command API
 * - Allows for APP and PLUGINS to communicate with the Interactive Console
 * @author Brendan Fuller
 */


var minimist = require('minimist')
var stringArgv = require('string-argv');

Observo.onMount((imports) => {
    console.log("Loaded: Command")
})


class Command {
    constructor() {
        this.commands = {}
    }
    arrayEquals(arr1, arr2) {
        return arr1.length === arr2.length && !arr1.some((v) => arr2.indexOf(v) < 0) && !arr2.some((v) => arr1.indexOf(v) < 0);
    }
    command(cmd) {
        console.log(cmd)
        try {
            //Parse the raw command string into an ARG V syntax
            let parse = stringArgv(cmd)
            //Next convert the arg v syntax into a common object viv minimist
            let commands = minimist(parse)
            //Now lets go through all commands in the system
            let found = false
            for (let match in this.commands) {

                //Grab all the info from the object stored in the array
                let result = this.commands[match].cmds
                let options = this.commands[match].options
                let error = this.commands[match].error
                let execute = this.commands[match].execute

                //Now lets check if the arrays of the commands (stored and just inputed) are correct
                if (this.arrayEquals(result, commands._)) {
                    //If so lets check if any options are missing
                    let missing = []
                    for (let option in options) {
                        //Just check if the are null in the inputed one
                        if (commands[options[option]] == null || commands[options[option]] == undefined) {
                            missing.push(options[option]) //If null add the to a list so we can return it the the error callback
                        }
                    }
                    //Now if the missing array has a missing option, the list of missing is sent back to the error callback for any operations if need
                    if (missing.length > 0) {
                        error(missing)
                    } else {
                        //if everything is good, lets run the code plus send everthing over. Its easy as sending the minimist object over.
                        execute(commands)
                    }
                    //If the array check fails, just say unknown command
                    found = true
                }

            }
            if (!found) {
                console.log(`{red-fg}Unknown Command:{/red-fg}{white-fg} ${commands._.join().replace(/,/g, " ").toLowerCase()}{/white-fg}`)
            }
            //Check to see if MINIMIST/STRINGARV fails, if so just send it to the user. 
        } catch (e) {
            console.log(e)
            console.log(`{red-fg}Unknown Command:{/red-fg}{white-fg} ${cmd}{/white-fg}`)
        }
    }
    createCommand(cmds, options, usage, error, execute) {
        let result = cmds.join().replace(/,/g, " ").toLowerCase()
        if (this.commands[result] == null) {
            this.commands[result] = {
                cmds,
                options,
                usage,
                error,
                execute
            }
        }
    }
    getCommands() {
        return this.commands
    }
}


let cmdInstance = new Command()

//Register Command API's
Observo.register({
    GLOBAL: {
        /**
         * 
         */
        addCommand: (name, cmd, options, usage, error, execute) => {
            cmdInstance.createCommand([name], [], '', () => {

            }, () => {
                let commands = cmdInstance.getCommands()
                console.log("Showing list of sub-commands for: pizz{bold}storage{/bold}")
                for (let list in commands) {
                    if (commands[list].cmds[0] == name && commands[list].usage != "") {
                        console.log(`- {green-fg}${commands[list].usage}{/green-fg}`)
                    }
                }
            })
            cmdInstance.createCommand([name, cmd], options, usage, error, execute)
        }
    },
    APP: {
        onCommand: (value) => {
            cmdInstance.command(value)
        }
    }
})