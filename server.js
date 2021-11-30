// import express from 'express'
// import http from 'http'
// import cors from 'cors'
// import path from 'path'
// // import { PhaserGame } from './game/game.js'

// import { dirname } from 'path'
// import { fileURLToPath } from 'url'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// const app = express()
// const server = http.createServer(app)

// // const game = new PhaserGame(server)
// const port = 1444

// app.use(cors())

// app.use('/', express.static(path.join(__dirname, '../client')))

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../index.html'))
// })

// // app.get('/getState', (req, res) => {
// //   try {
// //     let gameScene = game.scene.keys['GameScene']
// //     return res.json({ state: gameScene.getState() })
// //   } catch (error) {
// //     return res.status(500).json({ error: error.message })
// //   }
// // })

// server.listen(port, () => {
//   console.log('Express is listening on http://localhost:' + port)
// })

import fs from 'fs'
import express from 'express'
import Router from 'express-promise-router'
// import { Server } from 'socket.io'
import Http from 'http'
import * as Https from 'https'
// import * as SocketIo from 'socket.io'
// import { EventEmitter } from 'events'
import geckos, { iceServers } from '@geckos.io/server'
import Debug from 'debug'
// import { createServer } from 'cors-anywhere'
const debug = Debug('app:SocketServer')
var key = fs.readFileSync('./selfsigned.key')
var cert = fs.readFileSync('./selfsigned.crt')
var options = {
    key: key,
    cert: cert,
}

// let _http
// let _io
// let _httpPort
// let _socketOptions = {
//   path: '/socket.io',
//   pingInterval: 10 * 1000,
//   pingTimeout: 5000,
//   transports: ['websocket'],
//   cors: {
//     origin: '*',
//   },
// }
// _httpPort = Number(process.env.PORT || '8080')
// _http = Https.createServer(EventEmitter._httpHandler)

// _io = new SocketIo.Server(_http, _socketOptions)

// const _onHandshake = (socket, next) => {
//   if (socket.handshake.query.userId) {
//     return next()
//   } else {
//     debug(`handshake error: userId not exist`)
//     return next(new Error('authentication error'))
//   }
// }

// const _onConnect = (socket) => {
//   debug(`userId: ${socket.handshake.query.userId} connected`)
//   socket.on('disconnect', _onDisconnect.bind(this, socket))
// }

// const _onDisconnect = (socket) => {
//   debug(`userId: ${socket.handshake.query.userId} disconnected`)
// }

// _io.use(_onHandshake)
// _io.on('connection', _onConnect)

// _http.listen(_httpPort, '0.0.0.0', () => {
//   // debug(`http listening on ${_httpPort}`)
//   console.log(`http listening on ${_httpPort}`)
// })

// Create router
const router = Router()

// Main route serves the index HTML
router.get('/', async (req, res, next) => {
    let html = fs.readFileSync('index.html', 'utf-8')
    res.send(html)
})

// router.get('/', express.static('./static', { index: ['index.html'] }))

// Everything else that's not index 404s
router.use('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(404).send({ message: 'Not Found' })
})

// Create express app and listen on port 4444
const app = express()
app.use(express.static('build'))
app.use(router)

const port = process.env.PORT || 4444
const server = Https.createServer(app, options)
const io = geckos({ iceServers, port })

io.addServer(server)
io.listen(port)

let clients = {}

io.onConnection((channel) => {
    // console.log(channel.webrtcConnection.connections)
    console.log(
        `User ${channel.webrtcConnection.id} connected, there are currently ${channel.webrtcConnection.connections.size} users connected`
    )

    clients[channel.webrtcConnection.id] = {
        position: { x: 0, y: 0, z: 0 },
        quaternion: { _x: 0, _y: 0, _z: 0, _w: 0 },
    }
    channel.emit('move', clients)

    channel.on('move', (data) => {
        if (!clients[data.id]) return
        clients[data.id].position = data.position
        clients[data.id].quaternion = data.quaternion

        // console.log(Object.keys(clients).length)
        channel.broadcast.emit(
            'move',
            clients
            // clients,
            // Object.keys(clients)
            //   .filter((clientKey) => clientKey !== channel.webrtcConnection.id)
            //   .map((client) => {
            //     const { position, quaternion } = clients[client]
            //     // const payload = {}
            //     // payload[client] =
            //     return { position, quaternion }
            //   }),
            // clients.filter((c) => c[data.id] !== channel.webrtcConnection.id),
        )
        // client.on('move', ({ id, position, rotation, velocity }) => {
        //     if (!clients[id]) return
        //     clients[id].position = position
        //     clients[id].rotation = rotation
        //     clients[id].velocity = velocity

        //     _io.sockets.emit('move', clients)
        //   })
    })

    channel.on('disconnect', (data) => {
        delete clients[data.id]
        channel.emit('move', clients)
    })
})

// app.engine('.html', ejs.__express)
// app.set('view-engine', 'html')

// app.use(express.static('./static'))

// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Credentials', true)
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json',
//   )
//   next()
// })

// const server = Http.createServer(options, app)
// const server = Https.createServer(app)
// const server = createServer({ https: true }, app)
// server.listen(port, () => {
//   console.log(`Listening on port https://localhost:${port}...`)
// })

// .listen(_httpPort, '0.0.0.0', () => {
//   // debug(`http listening on ${_httpPort}`)
//   console.log(`http listening on ${_httpPort}`)
// })

// server.tran

// const _io = new SocketIo.Server(server, {
//   cors: {
//     origin: '*',
//   },
// })

// let clients = {}

// // // Socket app msgs
// _io.on('connection', (client) => {
//   console.log(`User ${client.id} connected, there are currently ${_io.engine.clientsCount} users connected`)

//   //Add a new client indexed by his id
//   clients[client.id] = {
//     position: [0, 0, 0],
//     rotation: [0, 0, 0],
//     velocity: [0, 0, 0],
//   }

//   _io.sockets.emit('move', clients)

//   client.on('move', ({ id, position, rotation, velocity }) => {
//     if (!clients[id]) return
//     clients[id].position = position
//     clients[id].rotation = rotation
//     clients[id].velocity = velocity

//     _io.sockets.emit('move', clients)
//   })

//   client.on('disconnect', () => {
//     console.log(`User ${client.id} disconnected, there are currently ${_io.engine.clientsCount} users connected`)

//     //Delete this client from the object
//     delete clients[client.id]

//     _io.sockets.emit('move', clients)
//   })
// })
