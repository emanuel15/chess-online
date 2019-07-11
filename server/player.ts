import * as WebSocket from 'ws';
import { Color } from './shared';

export class Player {
    
    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    public send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
        this.socket.send(data);
    }
    
    private _color : Color;
    public get color() : Color {
        return this._color;
    }
    public set color(v : Color) {
        this._color = v;
    }
}