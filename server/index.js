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

Game.start()

io.on('connection', (socket) => {
    const name = socket.handshake.query.name
    console.log(`User ${name} joined the game`)
    console.log(`id: ${socket.id}`)

    socket.emit('welcome', Game.addPlayer({
        name: name,
        id: socket.id
    }))

    io.emit('update', Game.state())

    socket.on('gotit', () => {

    })

    socket.on('ping', () => {
        socket.emit('pong')
    })

    socket.on('windowResized', () => {
    })

    socket.on('respawn', () => {

    })

    socket.on('disconnect', () => {

    })
})

function moveloop() {
}

function gameloop() {
}

function sendUpdates() {
}

setInterval(moveloop, 1000 / 60)
setInterval(gameloop, 1000)
setInterval(sendUpdates, 1000 / 40)

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
