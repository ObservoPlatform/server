Observo.onMount((imports)=>{
    //imports.notification
    //imports.loader //Loading system for react and socket.io
    //imports.components - List of react components that area allowed.
    //Errors


    class VisualPlugin extends React.Component {
        constructor() {
            super()
        }
        componentDidMount() {
            let rt = imports.app.realtime.connect(this.props.page)
            rt.on("connect", () => {
                console.log("Connected to Visual Server")
            })
        }
        render() {
            return <div>Im a plugin!</div>
        }
    }


    imports.app.loader.register(VisualPlugin)
})
