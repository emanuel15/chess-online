import * as WebSocket from 'ws';

export enum Colors {
    Black,
    White
};

export class Player {
    
    private socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    public send(data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) {
        this.socket.send(data);
    }
    
    private _color : Colors;
    public get color() : Colors {
        return this._color;
    }
    public set color(v : Colors) {
        this._color = v;
    }
}