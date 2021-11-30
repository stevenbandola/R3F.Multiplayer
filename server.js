import fs from 'fs'
import express from 'express'
import Router from 'express-promise-router'

import * as Https from 'https'
import geckos, { iceServers } from '@geckos.io/server'
import Debug from 'debug'
const debug = Debug('app:SocketServer')
var key = fs.readFileSync('./selfsigned.key')
var cert = fs.readFileSync('./selfsigned.crt')
var options = {
    key: key,
    cert: cert,
}

// Create router
const router = Router()

// Main route serves the index HTML
router.get('/', async (req, res, next) => {
    let html = fs.readFileSync('index.html', 'utf-8')
    res.send(html)
})

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
