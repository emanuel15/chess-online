import Board from './board';
import { PieceKind, PieceDirection } from './shared';

export class Piece {
    
    public directions: number = 0;
    public count: number = 0;

    public isWhite: boolean = false;

    public kind: PieceKind;

    public row: number = 0;
    public col: number = 0;

    public board: Board = null;
    
    public isAdvanced: boolean = false;
    public isEnPassant: boolean = false;

    constructor(kind: PieceKind, directions?: number, count?: number) {
        this.directions = directions;
        this.count = count;
        this.kind = kind;
    }

    getAvailableCells(getLastPiece: boolean = false): number[][] {
        let cells: number[][] = [];
        let pos = [this.row, this.col];

        if (this.kind == PieceKind.King) {

            // cells available around the king
            for (let row = this.row - 1; row <= this.row + 1; row++) {
                for (let col = this.col - 1; col <= this.col + 1; col++) {
                    let cellPiece = this.board.getPieceIn(row, col);
                    if (cellPiece) {
                        if (this.isWhite != cellPiece.isWhite)
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
                let row = pos[0] + Math.round(Math.sin(i * Math.PI / 180) * 2);
                let col = pos[1] + Math.round(Math.cos(i * Math.PI / 180) * 2);

                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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
                for (let col = pos[1] - 1; col <= pos[1] + 1; col += 2) {
                    let nearPiece = this.board.getPieceIn(pos[0], col);
                    if (nearPiece && nearPiece.kind == PieceKind.Pawn && nearPiece.isEnPassant) {
                        if (nearPiece.isWhite != this.isWhite) {
                            cells.push([pos[0] - 1, col]);
                        }
                    }
                }

                for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                    if (row == pos[0] - 1) {
                        for (let i = pos[1] - 1; i <= pos[1] + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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
            if ((this.directions & PieceDirection.Down) == PieceDirection.Down) {
                for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                    if (row == pos[0] + 1) {
                        for (let i = pos[1] - 1; i <= pos[1] + 1; i += 2) {
                            let cellPiece = this.board.getPieceIn(row, i);
                            if (cellPiece) {
                                if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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

        if ((this.directions & PieceDirection.Up) == PieceDirection.Up) {
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, pos[1]);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, pos[1]))
                    cells.push([row, pos[1]]);
            }
        }

        if ((this.directions & PieceDirection.Down) == PieceDirection.Down) {
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, pos[1]);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
                        if (this.board.isValidCell(row, pos[1]))
                            cells.push([row, pos[1]]);
                    }
                    break;
                }
                if (this.board.isValidCell(row, pos[1]))
                    cells.push([row, pos[1]]);
            }
        }

        if ((this.directions & PieceDirection.Left) == PieceDirection.Left) {
            for (let col = pos[1] - 1; col >= pos[1] - this.count; col--) {
                let cellPiece = this.board.getPieceIn(pos[0], col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
                        if (this.board.isValidCell(pos[0], col))
                            cells.push([pos[0], col]);
                    }
                    break;
                }
                if (this.board.isValidCell(pos[0], col))
                    cells.push([pos[0], col]);
            }
        }

        if ((this.directions & PieceDirection.Right) == PieceDirection.Right) {
            for (let col = pos[1] + 1; col <= pos[1] + this.count; col++) {
                let cellPiece = this.board.getPieceIn(pos[0], col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
                        if (this.board.isValidCell(pos[0], col))
                            cells.push([pos[0], col]);
                    }
                    break;
                }
                if (this.board.isValidCell(pos[0], col))
                    cells.push([pos[0], col]);
            }
        }

        if ((this.directions & PieceDirection.LeftUp) == PieceDirection.LeftUp) {
            let col = pos[1] - 1;
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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
            let col = pos[1] + 1;
            for (let row = pos[0] - 1; row >= pos[0] - this.count; row--) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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
            let col = pos[1] - 1;
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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
            let col = pos[1] + 1;
            for (let row = pos[0] + 1; row <= pos[0] + this.count; row++) {
                let cellPiece = this.board.getPieceIn(row, col);
                if (cellPiece) {
                    if (cellPiece.isWhite != this.isWhite || getLastPiece) {
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