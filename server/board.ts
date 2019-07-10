import { Colors } from './player';
import {Piece,  PieceKind } from './piece';
import { translateFromPGNMove, PGNObject, translateIntoPGNMove } from './shared';

interface PieceList {
    leftRook: Piece;
    leftKnight: Piece;
    leftBishop: Piece;
    queen: Piece;
    king: Piece;
    rightBishop: Piece;
    rightKnight: Piece;
    rightRook: Piece;
    pawn0: Piece;
    pawn1: Piece;
    pawn2: Piece;
    pawn3: Piece;
    pawn4: Piece;
    pawn5: Piece;
    pawn6: Piece;
    pawn7: Piece;
    [key: string]: Piece;
}

interface Pieces {
    white: PieceList;
    black: PieceList;
    [key: string]: PieceList;
}

interface Cell {
    isAvailable: boolean;
    isAttacked: boolean;
    piece: Piece;
}

export default class Board {
    static BOARD_WIDTH = 430;
    static BOARD_HEIGHT = 430;
    static CELL_WIDTH = Board.BOARD_WIDTH / 8;
    static CELL_HEIGHT = Board.BOARD_HEIGHT / 8;

    private cells: Cell[][] = [];

    private pieces: Pieces;

    public canKingCastle: boolean = false;
    public canQueenCastle: boolean = false;

    private moves = 0;

    constructor() {
        this.createBoard();
        this.resetBoard();
    }

    createBoard() {
        for (let row = 0; row < 8; row++) {
            this.cells.push([]);
            for (let col = 0; col < 8; col++) {
                this.cells[row].push({
                    isAvailable: false,
                    isAttacked: false,
                    piece: null
                });
            }
        }

        this.pieces = {
            black: {
                leftRook: new Piece(PieceKind.Rook, Piece.SIDES, 8),
                leftKnight: new Piece(PieceKind.Knight ,Piece.KNIGHT),
                leftBishop: new Piece(PieceKind.Bishop, Piece.CORNERS, 8),
                queen: new Piece(PieceKind.Queen, Piece.ALL, 8),
                king: new Piece(PieceKind.King, Piece.ALL, 1),
                rightBishop: new Piece(PieceKind.Bishop, Piece.CORNERS, 8),
                rightKnight: new Piece(PieceKind.Knight, Piece.KNIGHT),
                rightRook: new Piece(PieceKind.Rook, Piece.SIDES, 8),
                pawn0: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn1: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn2: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn3: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn4: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn5: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn6: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
                pawn7: new Piece(PieceKind.Pawn, Piece.DOWN | Piece.PAWN, 2),
            },
            white: {
                leftRook: new Piece(PieceKind.Rook, Piece.SIDES, 8),
                leftKnight: new Piece(PieceKind.Knight, Piece.KNIGHT),
                leftBishop: new Piece(PieceKind.Bishop, Piece.CORNERS, 8),
                queen: new Piece(PieceKind.Queen, Piece.ALL, 8),
                king: new Piece(PieceKind.King, Piece.ALL, 1),
                rightBishop: new Piece(PieceKind.Bishop, Piece.CORNERS, 8),
                rightKnight: new Piece(PieceKind.Knight, Piece.KNIGHT),
                rightRook: new Piece(PieceKind.Rook, Piece.SIDES, 8),
                pawn0: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn1: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn2: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn3: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn4: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn5: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn6: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn7: new Piece(PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
            },
        }

        for (const color in this.pieces) {
            for (const key in this.pieces[color]) {
                let piece = this.pieces[color][key];
                piece.board = this;
                if (color == 'white') {
                    piece.isWhite = true;
                }
            }
        }
    }

    resetBoard() {
        this.canKingCastle = false;
        this.canQueenCastle = false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.cells[row][col].isAvailable = false;
                this.cells[row][col].isAttacked = false;
                this.cells[row][col].piece = null;
            }
        }
        
        let pieces = this.pieces.white;
        this.setPieceIn(7, 0, pieces.leftRook);
        this.setPieceIn(7, 1, pieces.leftKnight);
        this.setPieceIn(7, 2, pieces.leftBishop);
        this.setPieceIn(7, 3, pieces.queen);
        this.setPieceIn(7, 4, pieces.king);
        this.setPieceIn(7, 5, pieces.rightBishop);
        this.setPieceIn(7, 6, pieces.rightKnight);
        this.setPieceIn(7, 7, pieces.rightRook);

        pieces = this.pieces.black;
        this.setPieceIn(0, 0, pieces.leftRook);
        this.setPieceIn(0, 1, pieces.leftKnight);
        this.setPieceIn(0, 2, pieces.leftBishop);
        this.setPieceIn(0, 3, pieces.queen);
        this.setPieceIn(0, 4, pieces.king);
        this.setPieceIn(0, 5, pieces.rightBishop);
        this.setPieceIn(0, 6, pieces.rightKnight);
        this.setPieceIn(0, 7, pieces.rightRook);

        for (let i = 0; i < 8; i++) {
            let piece = this.pieces.white["pawn" + i];
            this.setPieceIn(6, i, piece);
        }

        for (let i = 0; i < 8; i++) {
            let piece = this.pieces.black["pawn" + i];
            this.setPieceIn(1, i, piece);
        }
    }

    isValidCell(row: number, col: number): boolean {
        return (row >= 0 && row <= 7 && col >= 0 && col <= 7);
    }

    getPieceIn(row: number, col: number): Piece {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7)
            return this.cells[row][col].piece;
        
        return null;
    }

    setPieceIn(row: number, col: number, piece: Piece) {
        this.cells[row][col].piece = piece;
        piece.row = row;
        piece.col = col;
    }

    changePieceKind(piece: Piece, newKind: PieceKind) {
        piece.kind = newKind;

        let color = piece.isWhite ? 'white' : 'black';

        switch (newKind) {
            case PieceKind.Queen:
                piece.directions = this.pieces[color].queen.directions;
                piece.count = this.pieces[color].queen.count;
                break;
            
            case PieceKind.Bishop:
                piece.directions = this.pieces[color].leftBishop.directions;
                piece.count = this.pieces[color].leftBishop.count;
                break;
            
            case PieceKind.Rook:
                piece.directions = this.pieces[color].leftRook.directions;
                piece.count = this.pieces[color].leftRook.count;
                break;
            
            case PieceKind.Knight:
                piece.directions = this.pieces[color].leftKnight.directions;
                piece.count = this.pieces[color].leftKnight.count;
                break;
        
            default:
                break;
        }
    }
    
    validateCastles(color: Colors, moveText: string): boolean {
        let move = translateFromPGNMove(color, moveText);

        if (move.isKingSideCastle) {
            this.pieces[color == Colors.Black ? 'black' : 'white'].king.getAvailableCells();
            if (this.canKingCastle) {
                if (color == Colors.Black) {
                    let king = this.pieces.black.king;
                    let rightRook = this.getPieceIn(0, 7);
                    if (rightRook && !rightRook.hasMoved && rightRook.kind == PieceKind.Rook) {
                        if (!king.hasMoved) {
                            king.hasMoved = true;

                            let canKingCastle = true;
                            for (let col = 5; col <= 6; col++) {
                                let piece = this.getPieceIn(0, col);
                                if (piece) {
                                    canKingCastle = false;
                                    break;
                                }
                            }

                            if (canKingCastle) {
                                this.cells[king.row][king.col].piece = null;
                                this.cells[rightRook.row][rightRook.col].piece = null;

                                this.setPieceIn(0, 6, king);
                                this.setPieceIn(0, 5, rightRook);
                                return true;
                            }
                        }
                    }
                }
                else {
                    let king = this.pieces.white.king;
                    let rightRook = this.getPieceIn(7, 7);
                    if (rightRook && !rightRook.hasMoved && rightRook.kind == PieceKind.Rook) {
                        if (!king.hasMoved) {
                            king.hasMoved = true;

                            let canKingCastle = true;
                            for (let col = 5; col <= 6; col++) {
                                let piece = this.getPieceIn(7, col);
                                if (piece) {
                                    canKingCastle = false;
                                    break;
                                }
                            }

                            if (canKingCastle) {
                                this.cells[king.row][king.col].piece = null;
                                this.cells[rightRook.row][rightRook.col].piece = null;

                                this.setPieceIn(7, 6, king);
                                this.setPieceIn(7, 5, rightRook);
                                return true;
                            }
                        }
                    }
                }
            }
        }
        else if (move.isQueenSideCastle) {
            this.pieces[color == Colors.Black ? 'black' : 'white'].king.getAvailableCells();
            console.log(this.canQueenCastle);
            if (this.canQueenCastle) {
                if (color == Colors.Black) {
                    let king = this.pieces.black.king;
                    let leftRook = this.getPieceIn(0, 0);
                    if (leftRook && !leftRook.hasMoved && leftRook.kind == PieceKind.Rook) {
                        if (!king.hasMoved) {
                            console.log('QUEEN BLACK');
                            king.hasMoved = true;

                            let canQueenCastle = true;
                            for (let col = 1; col <= 3; col++) {
                                let piece = this.getPieceIn(0, col);
                                if (piece) {
                                    canQueenCastle = false;
                                    break;
                                }
                            }

                            if (canQueenCastle) {
                                this.cells[king.row][king.col].piece = null;
                                this.cells[leftRook.row][leftRook.col].piece = null;

                                this.setPieceIn(0, 2, king);
                                this.setPieceIn(0, 3, leftRook);
                                return true;
                            }
                        }
                    }
                }
                else {
                    let king = this.pieces.white.king;
                    let leftRook = this.getPieceIn(7, 0);
                    if (leftRook && !leftRook.hasMoved && leftRook.kind == PieceKind.Rook) {
                        if (!king.hasMoved) {
                            king.hasMoved = true;
                            
                            console.log('QUEEN WHITE');

                            let canQueenCastle = true;
                            for (let col = 1; col <= 3; col++) {
                                let piece = this.getPieceIn(7, col);
                                if (piece) {
                                    canQueenCastle = false;
                                    break;
                                }
                            }

                            if (canQueenCastle) {
                                this.cells[king.row][king.col].piece = null;
                                this.cells[leftRook.row][leftRook.col].piece = null;

                                this.setPieceIn(7, 2, king);
                                this.setPieceIn(7, 3, leftRook);
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    clearPassants() {
        for (const color in this.pieces) {
            for (const key in this.pieces[color]) {
                this.pieces[color][key].isAdvanced = false;
                this.pieces[color][key].isEnPassant = false;
            }
        }
    }

    validateMove(color: Colors, moveText: string): boolean {
        let move = translateFromPGNMove(color, moveText);

        if (moveText == 'O-O' || moveText == 'O-O-O')
            return this.validateCastles(color, moveText);
        
        if (!this.isValidCell(move.fromRow, move.fromCol) || !this.isValidCell(move.fromRow, move.fromCol))
            return false;

        let piece = this.cells[move.fromRow][move.fromCol].piece;
        if (piece) {
            let cells = piece.getAvailableCells();
            if (piece.kind == move.pieceKind) {
                if (piece.kind == PieceKind.Pawn) {
                    // en passant stuff
                    if (!piece.hasMoved) {
                        piece.hasMoved = true;
                        
                        if (Math.abs(move.toRow - move.fromRow) == 2) {
                            piece.isAdvanced = true;
                            for (let i = move.toCol - 1; i <= move.toCol + 1; i += 2) {
                                let cellPiece = this.getPieceIn(move.toRow, i);
                                if (cellPiece) {
                                    piece.isEnPassant = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                for (let i = 0; i < cells.length; i++) {
                    let cell = cells[i];
                    if (move.toRow == cell[0] && move.toCol == cell[1]) {
                        if (move.isPawnPromotion) {
                            if (move.pieceKind == PieceKind.Pawn && move.promotionKind) {
                                this.changePieceKind(piece, move.promotionKind);
                                this.cells[move.fromRow][move.fromCol].piece = null;
                                this.setPieceIn(move.toRow, move.toCol, piece);
                            }
                        }
                        else {
                            if (piece.kind == PieceKind.Pawn) {
                                // en passant stuff
                                let cellPiece = this.getPieceIn(move.toRow + 1, move.toCol);
                                if (cellPiece && cellPiece.isEnPassant) {
                                    this.cells[move.toRow + 1][move.toCol].piece = null;
                                }
                            }
                            this.cells[move.fromRow][move.fromCol].piece = null;
                            this.setPieceIn(move.toRow, move.toCol, piece);
                        }

                        this.moves++;
                        if ((this.moves % 2) != 0) {
                            this.clearPassants();
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }
}