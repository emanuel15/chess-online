import * as PIXI from 'pixi.js';
import Board from './board';
import { Colors } from '../server/player';

export enum PieceKind {
    Pawn = 'P',
    Rook = 'R',
    Bishop = 'B',
    Knight = 'N',
    Queen = 'Q',
    King = 'K',
}

export class Piece extends PIXI.Sprite {

    static LEFT = 2;
    static RIGHT = 4;
    static UP = 8;
    static DOWN = 16;
    static LEFT_UP = 32;
    static RIGHT_UP = 64;
    static LEFT_DOWN = 128;
    static RIGHT_DOWN = 256;
    static KNIGHT = 512;
    static PAWN = 1024;
    
    static SIDES = Piece.LEFT | Piece.RIGHT | Piece.UP | Piece.DOWN;
    static CORNERS = Piece.LEFT_UP | Piece.RIGHT_UP | Piece.LEFT_DOWN | Piece.RIGHT_DOWN;
    static ALL = Piece.SIDES | Piece.CORNERS;

    private isDragging = false;
    
    public directions: number = 0;
    public count: number = 0;

    public isPlayer: boolean = false;

    public kind: PieceKind;

    public row: number = 0;
    public col: number = 0;

    public board: Board = null;

    private attackers: Piece[] = [];
    private attacking: Piece[] = [];

    public isEnPassant: boolean = false;
    public isAdvanced: boolean = false;
    
    constructor(texture: PIXI.Texture, kind: PieceKind, directions?: number, count?: number) {
        super(texture);

        this.anchor.set(0.5, 0.5);
        this.directions = directions;
        this.count = count;
        this.kind = kind;

        this.on('mousedown', function(event: PIXI.interaction.InteractionEvent) {
            this.isDragging = true;
            this.originalPos = [this.x, this.y];
            this.emit('piecedown', event);
        });

        this.on('mousemove', function(event: PIXI.interaction.InteractionEvent) {
            if (this.isDragging) {
                let pos = event.data.getLocalPosition(this.parent);
                this.x = pos.x;
                this.y = pos.y;
            }
        });

        this.on('mouseup', this.onMouseUp);
        this.on('mouseupoutside', this.onMouseUp);
    }

    private onMouseUp(event: PIXI.interaction.InteractionEvent) {
        this.isDragging = false;
        this.emit('pieceup', event);
    }

    getAvailableCells(): number[][] {
        let cells: number[][] = [];
        let pos = [this.row, this.col];

        if (this.kind == PieceKind.King && !this.hasMoved) {
            
            let canKingCastle = true;
            if (this.board.color == Colors.Black) {
                let leftRook = this.board.getPieceIn(7, 0);
                if (leftRook && leftRook.kind == PieceKind.Rook && !leftRook.hasMoved) {
                    for (let col = 1; col <= 2; col++) {
                        if (this.board.getPieceIn(7, col)) {
                            canKingCastle = false;
                            break;
                        }
                    }
                    if (canKingCastle) {
                        this.board.canKingCastle = true;
                        cells.push([7, 1]);
                    }
                }
            }
            else {
                let rightRook = this.board.getPieceIn(7, 7);
                if (rightRook && rightRook.kind == PieceKind.Rook && !rightRook.hasMoved) {
                    for (let col = 5; col <= 6; col++) {
                        if (this.board.getPieceIn(7, col)) {
                            canKingCastle = false;
                            break;
                        }
                    }
                    if (canKingCastle) {
                        this.board.canKingCastle = true;
                        cells.push([7, 6]);
                    }
                }
            }

            let canQueenCastle = true;
            if (this.board.color == Colors.Black) {
                let rightRook = this.board.getPieceIn(7, 7);
                if (rightRook && rightRook.kind == PieceKind.Rook && !rightRook.hasMoved) {
                    for (let col = 4; col <= 6; col++) {
                        if (this.board.getPieceIn(7, col)) {
                            canQueenCastle = false;
                            break;
                        }
                    }
                    if (canQueenCastle) {
                        this.board.canQueenCastle = true;
                        cells.push([7, 5]);
                    }
                }
            }
            else {
                let leftRook = this.board.getPieceIn(7, 0);
                if (leftRook && leftRook.kind == PieceKind.Rook && !leftRook.hasMoved) {
                    for (let col = 1; col <= 3; col++) {
                        if (this.board.getPieceIn(7, col)) {
                            canQueenCastle = false;
                            break;
                        }
                    }
                    if (canQueenCastle) {
                        this.board.canQueenCastle = true;
                        cells.push([7, 2]);
                    }
                }
            }
        }

        if ((this.directions & Piece.KNIGHT) == Piece.KNIGHT) {

            for (let i = 30; i < 360; i += 360/12) {
                if (i % 90 == 0)
                    continue;

                // calculates the cells around the knight that it can move to
                let row = pos[0] + Math.round(Math.sin(i * Math.PI / 180) * 2);
                let col = pos[1] + Math.round(Math.cos(i * Math.PI / 180) * 2);

                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                }
                else {
                    if (this.board.isValidCell(row, col))
                        cells.push([row, col]);
                }
            }
            return cells;
        }

        if ((this.directions & Piece.PAWN) == Piece.PAWN) {
            if ((this.directions & Piece.UP) == Piece.UP) {
                // en passant
                for (let col = pos[1] - 1; col <= pos[1] + 1; col += 2) {
                    let nearPiece = this.board.getPieceIn(pos[0], col);
                    if (nearPiece && nearPiece.kind == PieceKind.Pawn && nearPiece.isEnPassant) {
                        if (nearPiece.isPlayer != this.isPlayer) {
                            cells.push([pos[0] - 1, col]);
                        }
                    }
                }

                for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                    if (row == pos[0] - 1) {
                        for (let i = pos[1] - 1; i <= pos[1] + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isPlayer != this.isPlayer) {
                                    if (this.board.isValidCell(row, i))
                                        cells.push([row, i]);
                                }
                            }
                        }
                    }
                    let cellPiece = this.board.getPieceIn(row, pos[1]);
                    if (!cellPiece) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);   
                    }
                    else {
                        break;
                    }
                }
                return cells;
            }
            if ((this.directions & Piece.DOWN) == Piece.DOWN) {
                // en passant
                for (let col = pos[1] - 1; col <= pos[1] + 1; col += 2) {
                    let nearPiece = this.board.getPieceIn(pos[0], col);
                    if (nearPiece && nearPiece.kind == PieceKind.Pawn && nearPiece.isEnPassant) {
                        if (nearPiece.isPlayer != this.isPlayer) {
                            cells.push([pos[0] + 1, col]);
                        }
                    }
                }

                for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                    if (row == pos[0] + 1) {
                        for (let i = pos[1] - 1; i <= pos[1] + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isPlayer != this.isPlayer) {
                                    if (this.board.isValidCell(row, i))
                                        cells.push([row, i]);
                                }
                            }
                        }
                    }
                    let cellPiece = this.board.getPieceIn(row, pos[1]);
                    if (!cellPiece) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);   
                    }
                }
                return cells;
            }
        }

        if ((this.directions & Piece.UP) == Piece.UP) {
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, pos[1]);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, pos[1]))
                    cells.push([row, pos[1]]);
            }
        }

        if ((this.directions & Piece.DOWN) == Piece.DOWN) {
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, pos[1]);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, pos[1]))
                    cells.push([row, pos[1]]);
            }
        }

        if ((this.directions & Piece.LEFT) == Piece.LEFT) {
            for (let col = pos[1] - 1; col >= pos[1] - this.count; col--) {
                let cellPiece = this.board.getPieceIn(pos[0], col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(pos[0], col))
                            cells.push([pos[0], col]);
                    }
                    break;
                }
                if (this.board.isValidCell(pos[0], col))
                    cells.push([pos[0], col]);
            }
        }

        if ((this.directions & Piece.RIGHT) == Piece.RIGHT) {
            for (let col = pos[1] + 1; col <= pos[1] + this.count; col++) {
                let cellPiece = this.board.getPieceIn(pos[0], col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(pos[0], col))
                            cells.push([pos[0], col]);
                    }
                    break;
                }
                if (this.board.isValidCell(pos[0], col))
                    cells.push([pos[0], col]);
            }
        }

        if ((this.directions & Piece.LEFT_UP) == Piece.LEFT_UP) {
            let col = pos[1] - 1;
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, col))
                    cells.push([row, col]);
                col--;
            }
        }

        if ((this.directions & Piece.RIGHT_UP) == Piece.RIGHT_UP) {
            let col = pos[1] + 1;
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, col))
                    cells.push([row, col]);
                col++;
            }
        }

        if ((this.directions & Piece.LEFT_DOWN) == Piece.LEFT_DOWN) {
            let col = pos[1] - 1;
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, col))
                    cells.push([row, col]);
                col--;
            }
        }

        if ((this.directions & Piece.RIGHT_DOWN) == Piece.RIGHT_DOWN) {
            let col = pos[1] + 1;
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, col))
                    cells.push([row, col]);
                col++;
            }
        }

        return cells;
    }

    private _hasMoved : boolean = false;
    public get hasMoved() : boolean {
        return this._hasMoved;
    }
    public set hasMoved(v : boolean) {
        this._hasMoved = v;
        if (!v) {
            switch (this.kind) {
                case PieceKind.Pawn:
                    this.count = 2;
                    break;
            
                default:
                    break;
            }
        }
        else {
            switch (this.kind) {
                case PieceKind.Pawn:
                    this.count = 1;
                    break;
            
                default:
                    break;
            }
        }
    }
}