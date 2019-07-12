import * as WebSocket from 'ws';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';

import MatchManager from './matchmanager';
import { Player } from './player';
import { Events } from './shared';

const app = express();
const server = new http.Server(app);
const PORT = parseInt(process.env.PORT) || 8000;

app.use(express.static(path.join(__dirname, '../public')));

server.listen(PORT, () => {
    console.log(`Express listening on port ${PORT}`)
});

let matchManager = new MatchManager();

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket, request) => {
    console.log('New connection');

    let player = new Player(socket);
    let match = matchManager.getAvailableMatch();
    match.joinPlayer(player);

    socket.on('message', (data) => {
        let events = (<string>data).split(';');

        for (let i = 0; i < events.length; i++) {
            let [event, value] = events[i].split(':');

            switch (parseInt(event)) {
                case Events.Move:
                    match.movePiece(player.color, value);
                    break;
                
                default:
                    break;
            }
        }
    });

    socket.on('close', (code, reason) => {
        console.log('Connection closed');
        match.leavePlayer(player);
    });
});