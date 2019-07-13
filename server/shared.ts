export enum Events {
    GameStart,
    GameOver,
    GameTied,
    Color,
    ChangeTurn,
    FindGame,
    EnemyLeave,
    Move,
    Ping,
    Pong
};

export class DataStream {
    // This class represents an event queue in the following format:
    // event:value;event:value;event:value....
    // Arrays can be represented using ',':
    // event:value,value,value;event:value;event:value,value

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

export enum Color {
    Black = 'black',
    White = 'white'
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
    isCheckmate: boolean;
}

export const PGN = {
    translateInto(color: Color, move: PGNObject): string {
        if (move.isKingSideCastle) {
            if (move.isCheck) {
                return 'O-O+';
            }
            else if (move.isCheckmate) {
                return 'O-O#';
            }
            return 'O-O';
        }
        else if (move.isQueenSideCastle) {
            if (move.isCheck) {
                return 'O-O-O+';
            }
            else if (move.isCheckmate) {
                return 'O-O-O#';
            }
            return 'O-O-O';
        }
    
        let output: string[] = [move.pieceKind];
    
        if (move.hasCapture) {
            output.splice(1, 0, 'x');
        }
    
        let rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
        let cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
        if (color == Color.Black) {
            rows = rows.reverse();
            cols = cols.reverse();
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
        else if (move.isCheckmate) {
            output.push('#');
        }
    
        return output.join('');
    },
    /*
        O-O is king side castle
        O-O-O is queen side castle

        Nf3g5 knight went from f3 to g5
        Nxf3g5 knight went from g4 to e2 and captured a piece
        Pxf7g8=Q pawn went from f7 to g8, captured a piece and promoted to queen

        Qb3f7+ queen went from b3 to f7 and checking
        Qf3h5# queen went from f3 to h5 and checkmate
    */
    translateFrom(color: Color, moveText: string): PGNObject {
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
            isCheckmate: false
        };
        
        if (moveText.substr(0, 5) == 'O-O-O') {
            output.isQueenSideCastle = true;
        }
        else if (moveText.substr(0, 3) == 'O-O') {
            output.isKingSideCastle = true;
        }
        else {
            output.pieceKind = <PieceKind>moveText[0];
    
            if (moveText[1] == 'x') {
                output.hasCapture = true;
                moveText = moveText[0] + moveText.substr(2);
            }
    
            let rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
            let cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            
            output.fromCol = cols.indexOf(moveText[1]);
            output.fromRow = rows.indexOf(moveText[2]);
            output.toCol = cols.indexOf(moveText[3]);
            output.toRow = rows.indexOf(moveText[4]);
    
            if (moveText.charAt(5) == '=') {
                output.isPawnPromotion = true;
                output.promotionKind = <PieceKind>moveText[6];
            }
        }

        if (moveText[moveText.length - 1] == '+') {
            output.isCheck = true;
        }
        else if (moveText[moveText.length - 1] == '#') {
            output.isCheckmate = true;
        }

        return output;
    }
}

export const BOARD_WIDTH = 430;
export const BOARD_HEIGHT = 430;
export const CELL_WIDTH = BOARD_WIDTH / 8;
export const CELL_HEIGHT = BOARD_HEIGHT / 8;

export enum PieceDirection {
    Left = 2,
    Right = 4,
    Up = 8,
    Down = 16,
    LeftUp = 32,
    RightUp = 64,
    LeftDown = 128,
    RightDown = 256,

    Sides = Left | Right | Up | Down,
    Corners = LeftUp | RightUp | LeftDown | RightDown,
    All = Sides | Corners,
}

export enum PieceKind {
    Pawn = 'P',
    Rook = 'R',
    Bishop = 'B',
    Knight = 'N',
    Queen = 'Q',
    King = 'K',
}

export interface CastlesInfo {
    canKingCastle: boolean;
    canQueenCastle: boolean;
}