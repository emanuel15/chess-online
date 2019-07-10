import { Colors, Player } from './player';
import { DataStream, Events } from './shared';
import * as uuidv4 from 'uuid/v4';
import Board from './board';

export default class Match {

    private player1: Player = null;
    private player2: Player = null;

    private _id: string;

    private dataStream: DataStream;
    private currentTurn: Player = null;

    private board: Board;

    constructor() {
        this._id = uuidv4();
        this.dataStream = new DataStream();
        this.board = new Board();
    }

    joinPlayer(player: Player) {
        if (!this.player1) {
            this.player1 = player;
            this.player1.color = Math.random() > 0.5 ? Colors.Black : Colors.White;

            this.player1.send(this.dataStream
                .queue(Events.Color, this.player1.color)
                .output()
            );
        }
        else {
            this.player2 = player;
            if (this.player1.color == Colors.White)
                this.player2.color = Colors.Black;
            else
                this.player2.color = Colors.White;
            
            this.player2.send(this.dataStream
                .queue(Events.Color, this.player2.color)
                .output()
            );

            this.beginMatch();
        }
    }

    leavePlayer(player: Player) {
    }

    beginMatch() {
        this.sendToBoth(this.dataStream
            .queue(Events.GameStart)
            .output()
        );

        this.changeTurn();
    }

    endMatch() {

    }

    movePiece(color: Colors, moveText: string) {
        console.log(moveText);
        if (this.board.validateMove(color, moveText)) {
            if (this.player1.color == color) {
                this.player2.send(this.dataStream
                    .queue(Events.Move, moveText)
                    .output()
                );
            }
            else {
                this.player1.send(this.dataStream
                    .queue(Events.Move, moveText)
                    .output()
                );
            }
            this.changeTurn();
        }
    }

    changeTurn() {
        if (!this.currentTurn) {
            if (this.player1.color == Colors.White) {
                this.currentTurn = this.player1;
            }
            else {
                this.currentTurn = this.player2;
            }
        }
        else {
            if (this.currentTurn == this.player1) {
                this.currentTurn = this.player2;
            }
            else {
                this.currentTurn = this.player1;
            }
        }

        this.sendToBoth(this.dataStream
            .queue(Events.ChangeTurn, this.currentTurn.color)
            .output()
        );
    }

    sendToBoth(data: string) {
        this.player1.send(data);
        this.player2.send(data);
    }

    public get id() : string {
        return this._id;
    }
    
    
    public get playerCount() : number {
        let count = 0;

        if (this.player1)
            count++;
        
        if (this.player2)
            count++;
        
        return count;
    }
}