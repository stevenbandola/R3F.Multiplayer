import fs from 'fs'
import express from 'express'
import Router from 'express-promise-router'
// import { Server } from 'socket.io'
// import https from 'https'
import * as Https from 'https'
import * as SocketIo from 'socket.io'
import { EventEmitter } from 'events'
import Debug from 'debug'
// import { createServer } from 'cors-anywhere'
const debug = Debug('app:SocketServer')
// var key = fs.readFileSync('./selfsigned.key')
// var cert = fs.readFileSync('./selfsigned.crt')
// var options = {
//     key: key,
//     cert: cert,
// }

let _http
let _io
let _httpPort
let _socketOptions = {
    path: '/socket.io',
    pingInterval: 10 * 1000,
    pingTimeout: 5000,
    transports: ['websocket'],
    cors: {
        origin: '*',
    },
}
_httpPort = Number(process.env.PORT || '8080')
_http = Https.createServer(EventEmitter._httpHandler)

_io = new SocketIo.Server(_http, _socketOptions)

const _onHandshake = (socket, next) => {
    if (socket.handshake.query.userId) {
        return next()
    } else {
        debug(`handshake error: userId not exist`)
        return next(new Error('authentication error'))
    }
}

const _onConnect = (socket) => {
    debug(`userId: ${socket.handshake.query.userId} connected`)
    socket.on('disconnect', _onDisconnect.bind(this, socket))
}

const _onDisconnect = (socket) => {
    debug(`userId: ${socket.handshake.query.userId} disconnected`)
}

_io.use(_onHandshake)
_io.on('connection', _onConnect)

_http.listen(_httpPort, '0.0.0.0', () => {
    // debug(`http listening on ${_httpPort}`)
    console.log(`http listening on ${_httpPort}`)
})

// // Create router
// const router = Router()

// // Main route serves the index HTML
// router.get('/', async (req, res, next) => {
//     let html = fs.readFileSync('index.html', 'utf-8')
//     res.send(html)
// })

// // Everything else that's not index 404s
// router.use('*', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.status(404).send({ message: 'Not Found' })
// })

// // Create express app and listen on port 4444
// const app = express()

// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*')
//     res.header('Access-Control-Allow-Credentials', true)
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
//     )
//     next()
// })

// app.use(router)

// const server = Https.createServer(app)
// // const server = createServer({ https: true }, app)
// const port = process.env.PORT || 443
// server.listen(port, () => {
//     console.log(`Listening on port https://localhost:4444...`)
// })

// // server.tran

// const _io = new SocketIo.Server(server, {
//     cors: {
//         origin: '*',
//     },
// })

let clients = {}

// // Socket app msgs
_io.on('connection', (client) => {
    console.log(
        `User ${client.id} connected, there are currently ${_io.engine.clientsCount} users connected`
    )

    //Add a new client indexed by his id
    clients[client.id] = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
    }

    _io.sockets.emit('move', clients)

    client.on('move', ({ id, rotation, position }) => {
        clients[id].position = position
        clients[id].rotation = rotation

        _io.sockets.emit('move', clients)
    })

    client.on('disconnect', () => {
        console.log(
            `User ${client.id} disconnected, there are currently ${_io.engine.clientsCount} users connected`
        )

        //Delete this client from the object
        delete clients[client.id]

        _io.sockets.emit('move', clients)
    })
})
