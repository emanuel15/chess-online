import {Piece} from './piece';
import { Color, PGN, PieceKind, PieceDirection } from './shared';

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

interface Pool {
    white: Piece[];
    black: Piece[];
    [key: string]: Piece[];
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

    private alivePieces: Pool;
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
                leftRook: new Piece(PieceKind.Rook, PieceDirection.Sides, 8),
                leftKnight: new Piece(PieceKind.Knight ,0),
                leftBishop: new Piece(PieceKind.Bishop, PieceDirection.Corners, 8),
                queen: new Piece(PieceKind.Queen, PieceDirection.All, 8),
                king: new Piece(PieceKind.King, PieceDirection.All, 1),
                rightBishop: new Piece(PieceKind.Bishop, PieceDirection.Corners, 8),
                rightKnight: new Piece(PieceKind.Knight, 0),
                rightRook: new Piece(PieceKind.Rook, PieceDirection.Sides, 8),
                pawn0: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn1: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn2: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn3: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn4: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn5: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn6: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
                pawn7: new Piece(PieceKind.Pawn, PieceDirection.Down, 2),
            },
            white: {
                leftRook: new Piece(PieceKind.Rook, PieceDirection.Sides, 8),
                leftKnight: new Piece(PieceKind.Knight, 0),
                leftBishop: new Piece(PieceKind.Bishop, PieceDirection.Corners, 8),
                queen: new Piece(PieceKind.Queen, PieceDirection.All, 8),
                king: new Piece(PieceKind.King, PieceDirection.All, 1),
                rightBishop: new Piece(PieceKind.Bishop, PieceDirection.Corners, 8),
                rightKnight: new Piece(PieceKind.Knight, 0),
                rightRook: new Piece(PieceKind.Rook, PieceDirection.Sides, 8),
                pawn0: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn1: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn2: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn3: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn4: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn5: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn6: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
                pawn7: new Piece(PieceKind.Pawn, PieceDirection.Up, 2),
            },
        }

        this.alivePieces = {
            white: [],
            black: []
        };

        for (const color in this.pieces) {
            for (const key in this.pieces[color]) {
                let piece = this.pieces[color][key];
                piece.board = this;
                if (color == 'white') {
                    piece.isWhite = true;
                }
                this.alivePieces[color].push(piece);
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
    
    validateCastles(color: Color, moveText: string): boolean {
        let move = PGN.translateFrom(color, moveText);

        if (move.isKingSideCastle) {
            this.pieces[color].king.getAvailableCells();
            if (this.canKingCastle) {
                if (color == Color.Black) {
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
            this.pieces[color].king.getAvailableCells();
            if (this.canQueenCastle) {
                if (color == Color.Black) {
                    let king = this.pieces.black.king;
                    let leftRook = this.getPieceIn(0, 0);
                    if (leftRook && !leftRook.hasMoved && leftRook.kind == PieceKind.Rook) {
                        if (!king.hasMoved) {
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
        for (const color in this.alivePieces) {
            for (let piece of this.alivePieces[color]) {
                piece.isAdvanced = false;
                piece.isEnPassant = false;
            }
        }
    }

    verifyCheck(color: Color): any {
        let enemyColor = color == Color.White ? Color.Black : Color.White;
        let king = this.pieces[color].king;
        let kingCells = king.getAvailableCells();

        let nearAttackedCells: number[][] = [];
        let checkCells: number[][] = [];

        let piecesAttacking: Piece[] = [];

        for (let piece of this.alivePieces[enemyColor]) {
            if (piece.kind == PieceKind.King)
                continue;
            
            let cells = piece.getAvailableCells();

            // verify how many and which pieces are attacking the king
            for (let i = 0; i < cells.length; i++) {
                let [row, col] = cells[i];
                if (row == king.row && col == king.col) {
                    let canBreak = false;

                    // get the cells in the same direction as the king
                    for (let j = i - 1; j >= 0; j--) {
                        let [prevRow, prevCol] = cells[j];
                        checkCells.push([prevRow, prevCol]);

                        for (let r = prevRow - 1; r <= prevRow + 1; r++) {
                            for (let c = prevCol - 1; c <= prevCol + 1; c++) {
                                if (r == piece.row && c == piece.col) {
                                    canBreak = true;
                                    break;
                                }
                            }
                            if (canBreak)
                                break;
                        }
                        if (canBreak)
                            break;
                    }

                    piecesAttacking.push(piece);
                }
            }

            // verify which cells the king can't go to
            for (let j = 0; j < kingCells.length; j++) {
                let [kingRow, kingCol] = kingCells[j];
                for (let u = 0; u < cells.length; u++) {
                    let [attackRow, attackCol] = cells[u];
                    if (kingRow == attackRow && kingCol == attackCol) {
                        nearAttackedCells.push([kingRow, kingCol]);
                    }
                }
            }
        }

        let isInCheck = piecesAttacking.length > 0;
        let isCheckmate = false;

        // console.log('Is in check: ', isInCheck);
        if (isInCheck) {
            // this.emit('check');

            // remove the cells that are being attacked from the list the king can go to
            for (let i = kingCells.length - 1; i >= 0; i--) {
                let [kingRow, kingCol] = kingCells[i];
                for (let j = 0; j < nearAttackedCells.length; j++) {
                    let [checkRow, checkCol] = nearAttackedCells[j];
                    if (kingRow == checkRow && kingCol == checkCol) {
                        kingCells.splice(i, 1);
                    }
                }
            }

            // double check, king must move
            if (piecesAttacking.length > 1) {
                // no cells available, it's a checkmate
                if (kingCells.length == 0) {
                    isCheckmate = true;
                    // console.log('checkmate');
                }
            }
            else {
                let attacker = piecesAttacking[0];

                // checks if the attacking piece can be captured by the king
                for (let i = 0; i < kingCells.length; i++) {
                    let [kingRow, kingCol] = kingCells[i];
                    // piece is near the king
                    if (attacker.row == kingRow && attacker.col == kingCol) {
                        for (let piece of this.alivePieces[enemyColor]) {
                            if (piece.kind == PieceKind.King || piece === attacker)
                                continue;
                            
                            let cells = piece.getAvailableCells(true);
                            let [lastRow, lastCol] = cells[cells.length - 1];

                            if (lastRow == attacker.row && lastCol == attacker.col) {
                                // enemy piece is defending the attacker,
                                // the king can move or a friendly piece can capture the attacker
                                kingCells.splice(i, 1);
                                // console.log('Defensor: ', piece.kind);
                                break;
                            }
                        }
                        break;
                    }
                }

                // if king can't move
                if (kingCells.length == 0) {

                    // check if the attacker can be captured
                    let canCapture = false;

                    for (let piece of this.alivePieces[color]) {
                        if (piece.kind == PieceKind.King)
                            continue;
                        
                        let cells = piece.getAvailableCells();
                        for (let i = 0; i < cells.length; i++) {
                            let [cellRow, cellCol] = cells[i];

                            // friendly piece can capture the attacker
                            if (cellRow == attacker.row && cellCol == attacker.col) {
                                canCapture = true;
                                break;
                            }
                        }

                        if (canCapture)
                            break;
                    }

                    // console.log('Can capture: ', canCapture);

                    // neither the king nor a friendly piece can capture the attacker
                    if (!canCapture) {
                        // check if it's possible to cover the check
                        let canCover = false;

                        for (let piece of this.alivePieces[color]) {
                            if (piece.kind == PieceKind.King)
                                continue;
                            
                            let cells = piece.getAvailableCells();
                            if (cells.length > 0) {
                                for (let i = 0; i < cells.length; i++) {
                                    let [row, col] = cells[i];
                                    for (let j = 0; j < checkCells.length; j++) {
                                        let [attackRow, attackCol] = checkCells[j];
                                        if (attackRow == row && attackCol == col) {
                                            canCover = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        // console.log('Can cover: ', canCover);
                        // if can't cover it's a CHECKMATE
                        if (!canCover)
                            isCheckmate = true;
                            // this.emit('checkmate');
                            // console.log('checkmate');
                    }
                }
            }

            // console.log('Attacked cells: ', checkCells);
            // console.log('Pieces attacking: ', piecesAttacking);
            // console.log('Near attacked cells: ', nearAttackedCells);
            // console.log('Available cells: ', kingCells);
        }

        return {
            available: kingCells,
            isInCheck: isInCheck,
            isCheckmate: isCheckmate,
        }
    }

    validateMove(color: Color, moveText: string): boolean {
        let move = PGN.translateFrom(color, moveText);

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
                        
                        let checkState = this.verifyCheck(color == Color.Black ? Color.White : Color.Black);
                        console.log(checkState.isCheckmate, move.isCheckMate);
                        if (move.isCheck && checkState.isInCheck) {
                            return true;
                        }
                        else if (move.isCheckMate && checkState.isCheckmate) {
                            console.log('mate com tomates');
                            return true;
                        }
                        else {
                            move.isCheck = false;
                            move.isCheckMate = false;
                            moveText = PGN.translateInto(color, move);
                        }
                        
                        return true;
                    }
                }
            }
        }
        return false;
    }
}