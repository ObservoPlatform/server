/**
 * Notification
 * 
 * The direct API for sending notifications
 * - Mutiple User Client Support (based on same UUID)
 */


let debug = true
let print = (value) => {
    if (debug) {
        console.log(value)
    }
}
//Same as comment above
class NotificationAPI {
    constructor(io, db, basket) {
        this.io = io
        this.db = db
        this.basket = basket
    }
    async create(user_uuid, body, save) {
        print(`[notifications/push] Notification Attempting | ${user_uuid}`)
        //Grab all of the infomation a notification would use
        let title = body.title ? body.title : "Notification"
        let message = body.message ? body.message : "This is a default notification"
        let icon = body.icon ? body.icon : "bell"
        let color = body.color ? body.color : "black"
        let button = body.button ? body.button : null;
        //Check if the user is in the basket
        if (this.basket.has(user_uuid)) {
            print(`[notifications/push] Found user in [basket] | ${user_uuid}`)
            for (let socketID in this.basket.get(user_uuid)) {
             
                print(`[notifications/push] Found Client in [/core/] | ${user_uuid}`)
                this.io.of("/core/").to(socketID).emit("notifications/push", {
                    title,
                    message,
                    icon,
                    color,
                    button
                })
                print(`[notifications/push] Notification Sent | ${user_uuid}`)
            }
        } else {
            print(`[notifications/push] DIDNT FIND USER | ${user_uuid}`)
        }
        //Do we want to save this notification? (not always, like errors)
        if (save) {
            await this.db.NOTIFICATION.create(user_uuid, title, message, icon, color, button)
        }
        //Update the amount a user has
        this.updateAmount(user_uuid)
    }
    async get(user_uuid, page) {
        return await this.db.NOTIFICATION.getStored(user_uuid, page)
    }
    /**
     * updateAmount - Updates the amount of unread notifications to the client
     * @param {*} user_uuid 
     * @param {*} page 
     */
    async updateAmount(user_uuid) {
        print(`[notifications/amount] Attempting Notification Amount | ${user_uuid}`)
        let amount = await this.db.NOTIFICATION.getAmount(user_uuid)
        if (this.basket.has(user_uuid)) {
            for (let socketID in this.basket.get(user_uuid)) {
                this.io.of("/core/").to(socketID).emit("notifications/amount", amount)
                print(`[notifications/amount] Notification Amount Sent | ${user_uuid}`)
            }
        }
    }
}
Observo.onMount((imports, register) => {
    console.log(`LOADING ${__name.toUpperCase()}`)
    //Import Socket System
    let io = imports.GROUP.network.SOCKET.get()
    let basket = imports.GROUP.network.BASKET
    //Import Database Scheme
    let db = imports.GROUP.database.get()
    let notification = new NotificationAPI(io, db, basket)
    register({}, {
        get: () => {
            return notification
        }
    })
})