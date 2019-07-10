import { Colors } from "./player";
import { PieceKind } from "../client/piece";

export enum Events {
    GameStart,
    GameOver,
    GameTied,
    Color,
    ChangeTurn,
    FindGame,
    EnemyLeave,
    Move,
};

export class DataStream {
    // This class represents an event queue in the following format:
    // event-value;event-value;event-value....
    // Arrays can be represented using ',':
    // event-value,value,value;event-value;event-value,value

    private streams: string[][] = [];

    constructor() {
    }

    queue(event: Events, value?: any) {
        let stream: string[] = [event.toString()];

        if (value !== undefined) {
            if (Array.isArray(value)) {
                stream.push(value.join(','));
            }
            else {
                stream.push(value.toString());
            }
        }
        
        this.streams.push(stream);
        return this;
    }

    output(): string {
        let result = [];
        for (let i = 0; i < this.streams.length; i++) {
            const stream = this.streams[i];
            result.push(stream.join(':'));
        }
        this.streams.splice(0, this.streams.length);
        return result.join(';');
    }
}

/* PGN related stuff */

export interface PGNObject {
    pieceKind: PieceKind;
    fromCol: number;
    fromRow: number;
    toCol: number;
    toRow: number;
    promotionKind: PieceKind;
    isKingSideCastle: boolean;
    isQueenSideCastle: boolean;
    hasCapture: boolean;
    isPawnPromotion: boolean;
    isCheck: boolean;
    isCheckMate: boolean;
}

export function translateIntoPGNMove(color: Colors, move: PGNObject): string {
    if (move.isKingSideCastle) {
        return 'O-O';
    }
    else if (move.isQueenSideCastle) {
        return 'O-O-O';
    }

    let output: string[] = [move.pieceKind];

    if (move.hasCapture) {
        output.splice(1, 0, 'x');
    }

    let rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
    let cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    if (color == Colors.Black) {
        rows = rows.reverse();
        cols = cols.reverse();

        move.fromCol = 7 - move.fromCol;
        move.fromRow = 7 - move.fromRow;
        move.toCol = 7 - move.toCol;
        move.toRow = 7 - move.toRow;
    }

    output.push(
        cols[move.fromCol],
        rows[move.fromRow],
        cols[move.toCol],
        rows[move.toRow]
    );

    if (move.isPawnPromotion) {
        output.push('=', move.promotionKind);
    }

    if (move.isCheck) {
        output.push('+');
    }
    else if (move.isCheckMate) {
        output.push('#');
    }

    return output.join('');
}

/*
    O-O is king side castle
    O-O-O is queen side castle

    Nf3g5 knight went from f3 to g5
    Nxf3g5 knight went from g4 to e2 and captured a piece
    Pxf7g8=Q pawn went from f7 to g8, captured a piece and promoted to queen

    Qb3f7+ queen went from b3 to f7 and checking
    Qf3h5# queen went from f3 to h5 and checkmate
*/
export function translateFromPGNMove(color: Colors, moveText: string): PGNObject {
    let output: PGNObject = {
        pieceKind: null,
        fromCol: 0,
        fromRow: 0,
        toCol: 0,
        toRow: 0,
        promotionKind: null,
        isKingSideCastle: false,
        isQueenSideCastle: false,
        hasCapture: false,
        isPawnPromotion: false,
        isCheck: false,
        isCheckMate: false
    };

    if (moveText == 'O-O') {
        output.isKingSideCastle = true;
        return output;
    }
    else if (moveText == 'O-O-O') {
        output.isQueenSideCastle = true;
        return output;
    }
    else {
        output.pieceKind = <PieceKind>moveText[0];

        if (moveText[1] == 'x') {
            output.hasCapture = true;
            moveText = moveText[0] + moveText.substr(2);
        }

        let rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
        let cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        if (color == Colors.Black) {
            rows = rows.reverse();
            cols = cols.reverse();
        }
        
        output.fromCol = cols.indexOf(moveText[1]);
        output.fromRow = rows.indexOf(moveText[2]);
        output.toCol = cols.indexOf(moveText[3]);
        output.toRow = rows.indexOf(moveText[4]);

        if (moveText.charAt(5) == '=') {
            output.isPawnPromotion = true;
            output.promotionKind = <PieceKind>moveText[6];
        }

        if (moveText[moveText.length - 1] == '+') {
            output.isCheck = true;
        }
        else if (moveText[moveText.length - 1] == '#') {
            output.isCheckMate = true;
        }

        return output;
    }
}