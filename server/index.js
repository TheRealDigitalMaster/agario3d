console.log('[STARTING SERVER]')
import express from 'express'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import config from '../webpack.config.js'
import Game from './game'

const isDeveloping = process.env.NODE_ENV !== 'production'
const app = express()

if (isDeveloping) {
    const compiler = webpack(config)
    const middleware = webpackMiddleware(compiler, {
        publicPath: config.output.publicPath,
        contentBase: 'src',
        stats: {
            colors: true,
            hash: false,
            timings: true,
            chunks: false,
            chunkModules: false,
            modules: false
        }
    })

    app.use(middleware)
    app.use(webpackHotMiddleware(compiler))
}

import Http from 'http'
import IO from 'socket.io'

const http = (Http).Server(app)
const io = (IO)(http)

Game.start(() => {
    const d = Game.delta(),
        {changed, deleted} = d

    if (d && (changed.length > 0 || deleted .length > 0)) {
        io.emit('update', d)
    }
})

io.on('connection', (socket) => {
    const {name, colour} = socket.handshake.query
    console.log(`User ${name} joined the game with colour ${colour}`)

    socket.on('position', pos => Game.updatePosition(socket.id, pos))

    socket.on('disconnect', _ => Game.removePlayer(socket.id))

    socket.emit('welcome', Game.addPlayer({
        name: name,
        colour: colour,
        id: socket.id
    }))
})

// Don't touch, IP configurations.
const ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1'
const serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000
if (process.env.OPENSHIFT_NODEJS_IP !== undefined) {
    http.listen(serverport, ipaddress, () => {
        console.log(`[DEBUG] Listening on *:${serverport}`)
    })
} else {
    http.listen(serverport, () => {
        console.log(`[DEBUG] Listening on *:${3000}`)
    })
}
