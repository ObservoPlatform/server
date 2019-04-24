/**
 * Observo's Interactive Console
 * @author ImportProgram
 */

let version = "Observo v3.0.0"
console.log("Starting Interactive Console...")
var blessed = require('blessed')
    , program = blessed.program();
// Create a screen object.
var screen = blessed.screen({
    smartCSR: true,
});
screen.title = 'Observo';
// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    tags: true,
    style: {
        fg: 'white',
    }
});
//Menu at the top of screen. 
var menu = blessed.box({
    parent: box,
    left: 0,
    right: 0,
    tags: true,
    style: {
        fg: 'black',
        bg: 'cyan'
    },
    height: 1,
})
menu.setContent(`${version}{|}{white-bg}{bold}Ctrl + C - {/bold}Consoles{bold}  ESC - {/bold}Exit{/white-bg}`)
//Outputs the logs based on a selected console
var output = blessed.box({
    parent: box,
    left: 0,
    top: 1,
    width: '100%',
    height: '100%-4',
    border: {
        type: 'line',
        fg: 'green'
    },
    keys: true,
    vi: true,
    alwaysScroll: true,
    scrollable: true,
    scrollbar: {
        style: {
            bg: 'green'
        }
    },
    tags: true,
    style: {
        fg: 'white',
        bg: "black"
    }
});
//Title for the Output
var title = blessed.box({
    parent: box,
    left: 5,
    top: 1,
    tags: true,
    style: {
        fg: 'white',
    },
    content: "ALL",
    height: 1,
    width: 3,
})
//List for the Consoles
var list = blessed.list({
    parent: box,
    right: 0,
    top: 1,
    hidden: true,
    width: '30%',
    height: '100%-4',
    border: {
        type: 'line',
        fg: 'white'
    },
    keys: true,
    vi: true,
    alwaysScroll: true,
    scrollable: true,
    scrollbar: {
        style: {
            bg: 'green'
        }
    },
    tags: true,
    style: {
        selected: {
            bg: "cyan"
        },
        fg: 'white',
    }
});
//Layout for the input
var inputLayout = blessed.box({
    parent: box,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
        fg: 'white',
        bg: 'orange',
    }
});
//Form for the Console Input (aka FIELD)
var form = blessed.form({
    parent: inputLayout,
    width: '100%',
    left: 0,
    keys: true,
    vi: true
});
//Exit Box (Prompt)
var exit = blessed.box({
    parent: box,
    hidden: true,
    top: 'center',
    left: 'center',
    width: 50,
    height: 11,
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black'
    }
});
//Text for Exit
blessed.text({
    parent: exit,
    top: 2,
    left: "center",
    content: "Are you sure you want to exit?",
    width: 30,
    style: {
        fg: 'white',
        bg: 'black'
    }
})
//Text for Exit
blessed.text({
    parent: exit,
    top: 3,
    left: "center",
    content: "All data will be saved.",
    style: {
        fg: 'cyan',
        bg: 'black'
    },
})
var q_buttons = blessed.box({
    parent: exit,
    top: 6,
    height: 3,
    left: "center",
    width: 30,
    tags: true,
    style: {
        fg: 'white',
        bg: 'black'
    },
});
//Sumbit Button, for Exit
var submit = blessed.button({
    parent: q_buttons,
    name: 'submit',
    content: 'Submit',
    top: 0,
    left: 0,
    width: 10,
    padding: {
        top: 1,
        right: 2,
        bottom: 1,
        left: 2
    },
    style: {
        bold: true,
        fg: 'white',
        bg: 'green',
        focus: {
            inverse: true
        }
    }
});
//Cancel Button for Exit
var cancel = blessed.button({
    parent: q_buttons,
    name: 'cancel',
    content: 'Cancel',
    top: 0,
    right: 0,
    width: 10,
    padding: {
        top: 1,
        right: 2,
        bottom: 1,
        left: 2
    },
    style: {
        bold: true,
        fg: 'white',
        bg: 'red',
        focus: {
            inverse: true
        }
    }
});

var field = blessed.textbox({
    parent: form,
    name: 'field',
    bottom: 0,
    left: 0,
    inputOnFocus: true,
    border: {
        type: 'line',
        fg: 'cyan'
    },
    focus: {
        fg: 'blue'
    },
    style: {
        fg: 'white',
        bg: 'orange',
    }
});
// Append our box to the screen.
screen.append(box);




//Create Global Variables for use
var FIXED = true //is the Output Console Fixed? 
var SELECTED_EXIT = 0 //What state is the Exit Prompt in..
var STATE = "OUTPUT" //STATE of the Interactive Console
var SELECTED_TYPE = "ALL" //The selected type/section
var SELECTED_MODULE = "" //The selected module from defined
//Types and TYPE references.
var TYPES = { "ALL": [] }
var TYPE_REF = ["ALL"]
var MESSAGES = [] //All the messages


//Base console event, just puts messages sent from user into shell there on
let consoleEvent = (value) => { message(`${SELECTED_TYPE}:${SELECTED_MODULE}`, value) }


/**
 * Updatemessage -> Updates the messages from the selected TYPE and MODULE into Ouput
 */
let updateMessage = () => {
    let section = `${SELECTED_TYPE}:${SELECTED_MODULE}`
    output.setContent("")
    //Check if the TYPE is all, if so, make all sections get displayed
    if (section == "ALL:") {
        let lines = 0
        for (let m in MESSAGES) {
            let sec = MESSAGES[m].section.split(":")
            let color = MESSAGES[m].color
            let time = MESSAGES[m].time
            if (sec[0] == "ALL") {
                output.setLine(lines, `${time}{${color}-fg}[ALL]{/${color}-fg} ${MESSAGES[m].message}`)
            } else {
                output.setLine(lines, `${time}{${color}-fg}[${sec[0]}][${sec[1]}]{/${color}-fg} ${MESSAGES[m].message}`)
            }
            lines++
        }
        //if not all, just display the section
    } else {
        let lines = 0
        for (let m in MESSAGES) {
            if (MESSAGES[m].section == section) {
                let time = MESSAGES[m].time
                output.setLine(lines, `${(time)}${MESSAGES[m].message}`)
                lines++
            }
        }
    }
    //output.pushLine(JSON.stringify(MESSAGES))
}

/**
 * Send a message to the section/type
 * @param {String} section 
 * @param {String} message 
 */
let message = (section, message, color='white') => {


    let getTime = (date) => {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        var t = ((hour < 10) ? '0' + hour : hour) +
            ':' +
            ((minutes < 10) ? '0' + minutes : minutes) +
            ':' +
            ((seconds < 10) ? '0' + seconds : seconds) +
            '.' +
            ('00' + milliseconds).slice(-3)
        return `[{white-bg}{black-fg}${t}{/black-fg}{/white-bg}]`

    }

    MESSAGES.push({ section, message, color, time: getTime(new Date()) })
    updateMessage();
    //Just check if the Output Console is Fixed, if so keep it at the bottom
    if (FIXED) {
        output.scrollTo(output.getScrollHeight())
    }
    screen.render()
}

/**
 * Enter key press
 */
field.key('enter', (ch, key) => {
    if (STATE == "OUTPUT") {

        //When the user has entered something thats not null or spaces, call the consoleEvent (aka onConsole)
        if (field.getValue() != null && field.getValue().trim() != "") {
            consoleEvent(field.getValue())
        }
        //Keep the focus of the form so we can type right after again
        form.focusNext();

        //Clear the text box for the next command
        field.clearValue()

        //If the TYPE list state is active, lets grab the selected value of the list
    } else if (STATE == "TYPE_LIST") {
        SELECTED_TYPE = TYPE_REF[list.selected]
        stateModuleList()
        //if the MODULE list state is active, lets grab the value too
    } else if (STATE == "MODULE_LIST") {
        SELECTED_MODULE = TYPES[SELECTED_TYPE][list.selected]
        updateConsole()
        stateOutput()
        //if were in exit state, check the EXIT state close/cancel the console
    } else if (STATE == "EXIT") {
        if (SELECTED_EXIT == 1) {
            //TODO: Run Observo Shutdown Process
            return process.exit(1)
        } else {
            //Just don't do anthing, hide the exit prompt
            exit.hidden = true
            SELECTED_EXIT = 0
            STATE = "OUTPUT"
            field.focus()
        }
    }
    screen.render();
});

/**
 * Down Key Press
 */
field.key("down", (ch, key) => {
    //If the output is selected use the arrow keys to scroll down
    if (STATE == "OUTPUT") {
        output.scroll(1)
        //While going down, lets also check if the view of the scrollable box is at the end, so we can tell it to say FIXED instead.
        if (output.getScrollHeight() - 1 == output.getScroll()) {
            FIXED = true
            output.scrollbar.style.bg = "green"
        }
        //If either of the LIST states are active, just move it down
    } else if (STATE == "TYPE_LIST" || STATE == "MODULE_LIST") {
        list.down(1)
    }
    screen.render();
})
/**
 * Up Key Press
 */
field.key("up", (ch, key) => {
    //If the output is selected use the arrow keys to scroll up
    if (STATE == "OUTPUT") {
        output.scroll(-1)
        FIXED = false
        output.scrollbar.style.bg = "yellow"
        //If either of the LIST states are active, just move it up 
    } else if (STATE == "TYPE_LIST" || STATE == "MODULE_LIST") {

        list.up(1)
    }
    screen.render();
})


/**
 * Updates the Console (Messages and Title)
 */
let updateConsole = () => {
    //Check the ALL type, if so, lets just make it to defaults
    if (SELECTED_TYPE == "ALL") {
        title.setContent("ALL")
        SELECTED_MODULE = ""
        title.width = 3
    } else {
        //If not ALL, we can dynamically check for the TYPE and MODULE and set the title
        let text = `${SELECTED_TYPE}:${SELECTED_MODULE}`
        title.setContent(text)
        try {
            title.width = text.length
        } catch (e) {
            title.width = 0
        }
    }
    //Update all messages in the selected console.
    updateMessage(`${SELECTED_TYPE}:${SELECTED_MODULE}`)
}

/**
 * State where the list for consoles are open
 */
let stateTypeList = () => {
    STATE = "TYPE_LIST" //Set the state of the LIST

    //Change the visuals
    list.hidden = false
    list.border.fg = 'green'
    output.width = "70%"
    output.border.fg = 'white'
    field.hidden.true = 'white'

    //Now select the first item
    list.select(0)
    //Focus the list (doesn't really need to but whatever)
    list.focus()
    //Clear all items from the list
    list.clearItems()
    //Now append all items to the list
    for (let t in TYPES) {
        list.addItem(t)
    }
    screen.render();
}
let stateModuleList = () => {
    STATE = "MODULE_LIST"
    if (SELECTED_TYPE == "ALL") {
        updateConsole()
        stateOutput()
    } else {
        //Change the visuals
        list.hidden = false
        list.border.fg = 'green'
        output.width = "70%"
        output.border.fg = 'white'

        //Now select the first item
        list.select(0)
        //Fo    cus the list (doesn't really need to but whatever)
        form.focusNext();
        //Clear all items from the list
        list.clearItems()

        //Then check if either SELECTED TYPE (Plugin or APP) and populate the List
        if (SELECTED_TYPE == "PLUGINS") {
            for (let p in TYPES[SELECTED_TYPE]) {
                list.addItem(TYPES[SELECTED_TYPE][p])
            }
        } else if (SELECTED_TYPE == "APP") {
            for (let p in TYPES[SELECTED_TYPE]) {
                list.addItem(TYPES[SELECTED_TYPE][p])
            }
        }
    }
    screen.render();
}

//When the List wants to be closed, lets make it to the default state, which is output.
let stateOutput = () => {
    STATE = "OUTPUT"
    //Hide everything and change some of the borders
    list.hidden = true
    list.border.fg = 'white'
    output.width = '100%'
    output.border.fg = "green"
    //Focus it and render
    form.focusNext();
    screen.render();
}

/**
 * Ctrl-C -> Opens the Console List
 */
field.key("C-c", (ch, key) => {
    //Change the state if we need to.
    if (STATE == "OUTPUT") {
        stateTypeList()
    } else if (STATE == "TYPE_LIST" || STATE == "MODULE_LIST") {
        stateOutput()
    }
})
/**
 * Left --> Used for Exiting (Submit)
 */
field.key("left", (ch, key) => {
    if (SELECTED_EXIT == 0 && STATE == "EXIT") {
        SELECTED_EXIT = 1
        submit.style.bg = 'blue'
        cancel.style.bg = 'red'
        screen.render()
    }
})
/**
 * Right --> Used for Exiting (Cancel)
 */
field.key("right", (ch, key) => {
    if (SELECTED_EXIT == 1 && STATE == "EXIT") {
        SELECTED_EXIT = 0
        submit.style.bg = 'green'
        cancel.style.bg = 'blue'
        screen.render()
    }
})



// Quit 
//on Escape
field.key('escape', function (ch, key) {
    exit.hidden = false
    STATE = "EXIT"
    field.focus()
    screen.render()
});
screen.key(['C-p'], function (ch, key) {
    return process.exit(1)
});
// Focus our element.
form.focusNext();
// Render the screen.
screen.render();


//Event when required to check if the Input of the Console is triggered
let onConsole = (callback) => {
    consoleEvent = callback
}

//Set the modules of the Consoles Lists
let setModules = (section, modules) => {
    if (section != "ALL") {
        TYPES[section] = []
        TYPES[section] = modules
        TYPE_REF.push(section)
    }
}

//Export everything
module.exports = {
    message,
    setModules,
    onConsole,
}