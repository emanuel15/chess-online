import {Piece} from './piece';
import { Color, PGN, PieceKind, PieceDirection, CastlesInfo } from './shared';

interface CheckInfo {
    available: number[][];
    isInCheck: boolean;
    isCheckmate: boolean;
    piecesAttacking: Piece[];
    checkCells: number[][];
}

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

    private cells: Cell[][] = [];

    private alivePieces: Pool;
    private pieces: Pieces;

    public isInCheck: boolean = false;
    private kingMustMove: boolean = false;
    private allowedToMove: number[] = [];

    private moves = 0;

    public isCheckmate: boolean = false;

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
        if (piece) {
            piece.row = row;
            piece.col = col;
        }
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
    
    getCastlesInfo(color: Color): CastlesInfo {
        let king = this.pieces[color].king;

        // king has already been moved, can't castle
        if (king.hasMoved) {
            return {
                canKingCastle: false,
                canQueenCastle: false
            }
        }
        
        let kingRow = king.row;
        let kingCol = king.col;
        
        let rookRow = 0;
        let rookCol = 7;
        let fromCol = 5;
        let toCol = 6;

        let canKingCastle = true;
        let canQueenCastle = true;

        // right rook
        if (color == Color.Black) {
            rookRow = 0;
        }
        else {
            rookRow = 7;
        }

        let rook = this.getPieceIn(rookRow, rookCol);
        if (rook && !rook.hasMoved && rook.kind == PieceKind.Rook) {
            for (let col = fromCol; col <= toCol; col++) {
                let piece = this.getPieceIn(kingRow, col);
                if (piece) {
                    canKingCastle = false;
                    break;
                }
                else {
                    // check if the king can go without getting checked

                    this.setPieceIn(kingRow, col, king);

                    let checkInfo = this.verifyCheck(color, false, false);
                    
                    // returns the king back
                    this.setPieceIn(kingRow, kingCol, king);

                    // sets the col's piece back to null
                    this.cells[kingRow][col].piece = null;

                    if (checkInfo.isInCheck) {
                        canKingCastle = false;
                        break;
                    }
                }
            }
        }
        else {
            canKingCastle = false;
        }

        // checks if can queen side castle
        rookCol = 0;
        fromCol = 1;
        toCol = 3;

        rook = this.getPieceIn(rookRow, rookCol);
        if (rook && !rook.hasMoved && rook.kind == PieceKind.Rook) {
            for (let col = fromCol; col <= toCol; col++) {
                let piece = this.getPieceIn(kingRow, col);
                if (piece) {
                    canQueenCastle = false;
                    break;
                }
                else {
                    // don't need to check the last col in queen side
                    if (col == fromCol)
                        continue;

                    // check if the king can go without getting checked

                    this.setPieceIn(kingRow, col, king);

                    let checkInfo = this.verifyCheck(color, false, false);
                    
                    // returns the king back
                    this.setPieceIn(kingRow, kingCol, king);

                    // sets the col's piece back to null
                    this.cells[kingRow][col].piece = null;

                    if (checkInfo.isInCheck) {
                        canQueenCastle = false;
                        break;
                    }
                }
            }
        }
        else {
            canQueenCastle = false;
        }

        return {
            canKingCastle: canKingCastle,
            canQueenCastle: canQueenCastle
        }
    }

    clearPassants() {
        for (const color in this.alivePieces) {
            for (let piece of this.alivePieces[color]) {
                piece.isAdvanced = false;
                piece.isEnPassant = false;
            }
        }
    }

    verifyCheck(color: Color, checkNear: boolean = false, change: boolean = true): CheckInfo {
        let enemyColor = color == Color.White ? Color.Black : Color.White;
        let king = this.pieces[color].king;
        let kingCells = king.getAvailableCells();

        let checkCells: number[][] = [];
        let piecesAttacking: Piece[] = [];

        if (change) {
            this.allowedToMove.splice(0, this.allowedToMove.length);
        }

        for (let piece of this.alivePieces[enemyColor]) {
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
        }

        let isInCheck = piecesAttacking.length > 0;
        let isCheckmate = false;
        let canCapture = false;
        let canCover = false;

        if (isInCheck) {

            // double check, king must move
            if (piecesAttacking.length > 1) {
                if (change)
                    this.kingMustMove = true;
                
                // no cells available, it's a checkmate
                if (kingCells.length == 0) {
                    if (change) {
                        isCheckmate = true;
                    }
                }
                else {
                    if (change)
                        this.allowedToMove.push(this.alivePieces[color].indexOf(king));
                }
            }
            else {
                if (change) {
                    this.kingMustMove = false;
                    this.allowedToMove.push(this.alivePieces[color].indexOf(king));
                }
                
                let attacker = piecesAttacking[0];

                // check if the attacker can be captured by other piece
                for (let piece of this.alivePieces[color]) {
                    if (piece.kind == PieceKind.King)
                        continue;
                    
                    let cells = piece.getAvailableCells();
                    for (let i = 0; i < cells.length; i++) {
                        let [cellRow, cellCol] = cells[i];

                        // friendly piece can capture the attacker
                        if (cellRow == attacker.row && cellCol == attacker.col) {
                            if (change) {
                                let index = this.alivePieces[color].indexOf(piece);
                                if (this.allowedToMove.indexOf(index) == -1) {
                                    this.allowedToMove.push(index);
                                }
                            }
                            canCapture = true;
                        }
                    }
                }

                // check if it's possible to cover the check
                for (let piece of this.alivePieces[color]) {
                    if (piece.kind == PieceKind.King)
                        continue;
                    
                    let cells = piece.getAvailableCells();
                    for (let i = 0; i < cells.length; i++) {
                        let [row, col] = cells[i];
                        for (let j = 0; j < checkCells.length; j++) {
                            let [attackRow, attackCol] = checkCells[j];
                            if (attackRow == row && attackCol == col) {
                                if (change) {
                                    let index = this.alivePieces[color].indexOf(piece);
                                    if (this.allowedToMove.indexOf(index) == -1) {
                                        this.allowedToMove.push(index);
                                    }
                                }
                                canCover = true;
                            }
                        }
                    }
                }
            }
        }

        if (checkNear) {
            let oldRow = king.row;
            let oldCol = king.col;

            for (let i = kingCells.length - 1; i >= 0; i--) {
                let [kingRow, kingCol] = kingCells[i];

                this.cells[oldRow][oldCol].piece = null;

                let oldPiece = this.cells[kingRow][kingCol].piece;
                this.setPieceIn(kingRow, kingCol, king);

                let checkInfo = this.verifyCheck(color, false, false);

                if (checkInfo.isInCheck || checkInfo.isCheckmate) {
                    kingCells.splice(i, 1);
                }

                this.cells[kingRow][kingCol].piece = null;
                this.setPieceIn(oldRow, oldCol, king);

                if (oldPiece)
                    this.setPieceIn(kingRow, kingCol, oldPiece);
            }
        }

        if (change) {
            if (kingCells.length == 0)
                this.allowedToMove.splice(0, 1);
        }

        if (isInCheck && !canCover && !canCapture && kingCells.length == 0) {
            isCheckmate = true;
        }

        return {
            available: kingCells,
            checkCells: checkCells,
            isInCheck: isInCheck,
            isCheckmate: isCheckmate,
            piecesAttacking: piecesAttacking
        }
    }

    printVisualRepresentation() {
        for (let row = 0; row < this.cells.length; row++) {
            let str: string[] = [];
            for (let col = 0; col < this.cells[row].length; col++) {
                if (this.cells[row][col].piece)
                    str.push(this.cells[row][col].piece.kind);
                else
                    str.push(' ');
            }
            console.log(`[${str.join('|')}]`);
        }
    }

    validateMove(color: Color, moveText: string): boolean {
        let move = PGN.translateFrom(color, moveText);

        if (move.isKingSideCastle || move.isQueenSideCastle) {
            let castlesInfo = this.getCastlesInfo(color);
            
            let king = this.pieces[color].king;
            let rookRow = 0;
            let rookCol = 0;
            let newKingCol = 0;
            let newRookCol = 0;

            if (castlesInfo.canKingCastle && move.isKingSideCastle) {
                if (color == Color.Black) {
                    rookRow = 0;
                    rookCol = 7;
                    newKingCol = 6;
                    newRookCol = 5;
                }
                else {
                    rookRow = 7;
                    rookCol = 7;
                    newKingCol = 6;
                    newRookCol = 5;
                }
            }
            else if (castlesInfo.canQueenCastle && move.isQueenSideCastle) {
                if (color == Color.Black) {
                    rookRow = 0;
                    rookCol = 0;
                    newKingCol = 2;
                    newRookCol = 3;
                }
                else {
                    rookRow = 7;
                    rookCol = 0;
                    newKingCol = 2;
                    newRookCol = 3;
                }
            }

            let rook = this.getPieceIn(rookRow, rookCol);

            this.cells[king.row][king.col].piece = null;
            this.cells[rookRow][rookCol].piece = null;

            this.setPieceIn(king.row, newKingCol, king);
            this.setPieceIn(rookRow, newRookCol, rook);

            // check if the castles is a check or checkmate
            let checkState = this.verifyCheck(color == Color.Black ? Color.White : Color.Black, true);
            this.isCheckmate = checkState.isCheckmate;

            this.printVisualRepresentation();

            if (move.isCheck) {
                if (checkState.isInCheck)
                    return true;
                
                return false;
            }
            else if (move.isCheckmate) {
                if (checkState.isCheckmate)
                    return true;
                return false;
            }

            return true;
        }
        
        if (!this.isValidCell(move.fromRow, move.fromCol) || !this.isValidCell(move.fromRow, move.fromCol))
            return false;

        let piece = this.cells[move.fromRow][move.fromCol].piece;
        if (piece) {
            let cells;

            if (piece.kind == PieceKind.King) {
                let checkState = this.verifyCheck(piece.isWhite ? Color.White : Color.Black);
                cells = checkState.available;
            }
            else {
                cells = piece.getAvailableCells();
            }
            
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
                        let oldPiece = this.cells[move.toRow][move.toCol].piece;

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
                        
                        let checkState = this.verifyCheck(color == Color.Black ? Color.White : Color.Black, true);
                        this.isCheckmate = checkState.isCheckmate;
                        
                        // this.printVisualRepresentation();
                        if (move.isCheck) {
                            if (checkState.isInCheck)
                                return true;

                            // if the move is invalid, return things back
                            this.setPieceIn(move.fromRow, move.fromCol, piece);
                            this.setPieceIn(move.toRow, move.toCol, oldPiece);
                            
                            return false;
                        }
                        else if (move.isCheckmate) {
                            if (checkState.isCheckmate)
                                return true;
                            
                            // if the move is invalid, return things back
                            this.setPieceIn(move.fromRow, move.fromCol, piece);
                            this.setPieceIn(move.toRow, move.toCol, oldPiece);
                            
                            return false;
                        }

                        return true;
                    }
                }
            }
        }
        return false;
    }
}