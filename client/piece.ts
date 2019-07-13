import * as PIXI from 'pixi.js-legacy';
import { Board } from './board';
import { Color, PieceKind, PieceDirection } from '../server/shared';

export class Piece extends PIXI.Sprite {
    
    public directions: PieceDirection = 0;
    public count: number = 0;

    public isPlayer: boolean = false;

    public kind: PieceKind;

    public row: number = 0;
    public col: number = 0;

    public board: Board = null;

    public isEnPassant: boolean = false;
    public isAdvanced: boolean = false;
    
    constructor(texture: PIXI.Texture, kind: PieceKind, directions?: PieceDirection, count?: number) {
        super(texture);

        this.anchor.set(0.5, 0.5);
        this.directions = directions;
        this.count = count;
        this.kind = kind;

        this.on('mousedown', function(event: PIXI.interaction.InteractionEvent) {
            this.emit('piecedown', event);
        });
    }

    getAvailableCells(): number[][] {
        let cells: number[][] = [];

        if (this.kind == PieceKind.King) {
            
            // cells available around the king
            for (let row = this.row - 1; row <= this.row + 1; row++) {
                for (let col = this.col - 1; col <= this.col + 1; col++) {
                    let cellPiece = this.board.getPieceIn(row, col);
                    if (cellPiece) {
                        if (this.isPlayer != cellPiece.isPlayer)
                            if (this.board.isValidCell(row, col)) 
                                cells.push([row, col]);
                    }
                    else {
                        if (this.board.isValidCell(row, col))
                            cells.push([row, col]);
                    }
                }
            }

            return cells;
        }

        if (this.kind == PieceKind.Knight) {

            for (let i = 30; i < 360; i += 360/12) {
                if (i % 90 == 0)
                    continue;

                // calculates the cells around the knight that it can move to
                let row = this.row + Math.round(Math.sin(i * Math.PI / 180) * 2);
                let col = this.col + Math.round(Math.cos(i * Math.PI / 180) * 2);

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

        if (this.kind == PieceKind.Pawn) {
            if ((this.directions & PieceDirection.Up) == PieceDirection.Up) {
                // en passant
                for (let col = this.col - 1; col <= this.col + 1; col += 2) {
                    let nearPiece = this.board.getPieceIn(this.row, col);
                    if (nearPiece && nearPiece.kind == PieceKind.Pawn && nearPiece.isEnPassant) {
                        if (nearPiece.isPlayer != this.isPlayer) {
                            cells.push([this.row - 1, col]);
                        }
                    }
                }

                for (let row = this.row - 1; row >= this.row - this.count; row--) {
                    if (row == this.row - 1) {
                        for (let i = this.col - 1; i <= this.col + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isPlayer != this.isPlayer) {
                                    if (this.board.isValidCell(row, i))
                                        cells.push([row, i]);
                                }
                            }
                        }
                    }
                    let cellPiece = this.board.getPieceIn(row, this.col);
                    if (!cellPiece) {
                        if (this.board.isValidCell(row, this.col))
                            cells.push([row, this.col]);   
                    }
                    else {
                        break;
                    }
                }
                return cells;
            }
            if ((this.directions & PieceDirection.Down) == PieceDirection.Down) {
                // en passant
                for (let col = this.col - 1; col <= this.col + 1; col += 2) {
                    let nearPiece = this.board.getPieceIn(this.row, col);
                    if (nearPiece && nearPiece.kind == PieceKind.Pawn && nearPiece.isEnPassant) {
                        if (nearPiece.isPlayer != this.isPlayer) {
                            cells.push([this.row + 1, col]);
                        }
                    }
                }

                for (let row = this.row + 1; row <= this.row + this.count; row++) {
                    if (row == this.row + 1) {
                        for (let i = this.col - 1; i <= this.col + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isPlayer != this.isPlayer) {
                                    if (this.board.isValidCell(row, i))
                                        cells.push([row, i]);
                                }
                            }
                        }
                    }
                    let cellPiece = this.board.getPieceIn(row, this.col);
                    if (!cellPiece) {
                        if (this.board.isValidCell(row, this.col))
                            cells.push([row, this.col]);   
                    }
                }
                return cells;
            }
        }

        if ((this.directions & PieceDirection.Up) == PieceDirection.Up) {
            for (let row = this.row - 1; row >= this.row - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, this.col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, this.col))
                            cells.push([row, this.col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, this.col))
                    cells.push([row, this.col]);
            }
        }

        if ((this.directions & PieceDirection.Down) == PieceDirection.Down) {
            for (let row = this.row + 1; row <= this.row + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, this.col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(row, this.col))
                            cells.push([row, this.col]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, this.col))
                    cells.push([row, this.col]);
            }
        }

        if ((this.directions & PieceDirection.Left) == PieceDirection.Left) {
            for (let col = this.col - 1; col >= this.col - this.count; col--) {
                let cellPiece = this.board.getPieceIn(this.row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(this.row, col))
                            cells.push([this.row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(this.row, col))
                    cells.push([this.row, col]);
            }
        }

        if ((this.directions & PieceDirection.Right) == PieceDirection.Right) {
            for (let col = this.col + 1; col <= this.col + this.count; col++) {
                let cellPiece = this.board.getPieceIn(this.row, col);
                if (cellPiece) {
                    if (cellPiece.isPlayer != this.isPlayer) {
                        if (this.board.isValidCell(this.row, col))
                            cells.push([this.row, col]);
                    }
                    break;
                }
                if (this.board.isValidCell(this.row, col))
                    cells.push([this.row, col]);
            }
        }

        if ((this.directions & PieceDirection.LeftUp) == PieceDirection.LeftUp) {
            let col = this.col - 1;
            for (let row = this.row - 1; row >= this.row - this.count; row--) {
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

        if ((this.directions & PieceDirection.RightUp) == PieceDirection.RightUp) {
            let col = this.col + 1;
            for (let row = this.row - 1; row >= this.row - this.count; row--) {
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

        if ((this.directions & PieceDirection.LeftDown) == PieceDirection.LeftDown) {
            let col = this.col - 1;
            for (let row = this.row + 1; row <= this.row + this.count; row++) {
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

        if ((this.directions & PieceDirection.RightDown) == PieceDirection.RightDown) {
            let col = this.col + 1;
            for (let row = this.row + 1; row <= this.row + this.count; row++) {
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