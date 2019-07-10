import * as PIXI from 'pixi.js';
import {Piece,  PieceKind } from './piece';
import { Colors } from '../server/player';
import { translateFromPGNMove, translateIntoPGNMove, PGNObject } from '../server/shared';

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
    isSelected: boolean;
    color: number;
    piece: Piece;
    graphics: PIXI.Graphics;
}

export default class Board extends PIXI.Sprite {

    static BOARD_WIDTH = 430;
    static BOARD_HEIGHT = 430;
    static CELL_WIDTH = Board.BOARD_WIDTH / 8;
    static CELL_HEIGHT = Board.BOARD_HEIGHT / 8;

    private cells: Cell[][] = [];

    private pieces: Pieces;

    private availableCells: number[][] = [];
    private attackedCells: number[][] = [];
    private selectedCell: Cell;

    private letters: PIXI.Text[] = [];

    private spriteSheet: PIXI.Spritesheet = null;

    public canKingCastle: boolean = false;
    public canQueenCastle: boolean = false;

    // private potentialCheckers: Piece[] = [];

    public moves = -1;

    constructor() {
        super();
        
        let switchColor = false;
        for (let row = 0; row < 8; row++) {
            this.cells.push([]);
            for (let col = 0; col < 8; col++) {
                this.cells[row].push({
                    color: switchColor ? 0xa76626 : 0xc2bdb9,
                    isAvailable: false,
                    isAttacked: false,
                    isSelected: false,
                    piece: null,
                    graphics: new PIXI.Graphics()
                });

                let x = -Board.CELL_WIDTH * 4 + col * Board.CELL_WIDTH;
                let y = -Board.CELL_HEIGHT * 4 + row * Board.CELL_HEIGHT;

                let cell = this.cells[row][col];

                cell.graphics
                    .beginFill(cell.color)
                        .drawRect(0, 0, Board.CELL_WIDTH, Board.CELL_HEIGHT)
                    .endFill();
                
                cell.graphics.x = x;
                cell.graphics.y = y;

                this.addChild(cell.graphics);
                switchColor = !switchColor;
            }
            switchColor = !switchColor;
        }

        this.redrawBoard();
    }

    createBoard(app: PIXI.Application) {
        let sheet = app.loader.resources["images/spritesheet.min.json"].spritesheet;

        this.spriteSheet = sheet;

        this.pieces = {
            black: {
                leftRook: new Piece(sheet.textures["rook_black"], PieceKind.Rook, Piece.SIDES, 8),
                leftKnight: new Piece(sheet.textures["knight_black"], PieceKind.Knight ,Piece.KNIGHT),
                leftBishop: new Piece(sheet.textures["bishop_black"], PieceKind.Bishop, Piece.CORNERS, 8),
                queen: new Piece(sheet.textures["queen_black"], PieceKind.Queen, Piece.ALL, 8),
                king: new Piece(sheet.textures["king_black"], PieceKind.King, Piece.ALL, 1),
                rightBishop: new Piece(sheet.textures["bishop_black"], PieceKind.Bishop, Piece.CORNERS, 8),
                rightKnight: new Piece(sheet.textures["knight_black"], PieceKind.Knight, Piece.KNIGHT),
                rightRook: new Piece(sheet.textures["rook_black"], PieceKind.Rook, Piece.SIDES, 8),
                pawn0: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn1: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn2: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn3: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn4: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn5: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn6: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn7: new Piece(sheet.textures["pawn_black"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
            },
            white: {
                leftRook: new Piece(sheet.textures["rook_white"], PieceKind.Rook, Piece.SIDES, 8),
                leftKnight: new Piece(sheet.textures["knight_white"], PieceKind.Knight, Piece.KNIGHT),
                leftBishop: new Piece(sheet.textures["bishop_white"], PieceKind.Bishop, Piece.CORNERS, 8),
                queen: new Piece(sheet.textures["queen_white"], PieceKind.Queen, Piece.ALL, 8),
                king: new Piece(sheet.textures["king_white"], PieceKind.King, Piece.ALL, 1),
                rightBishop: new Piece(sheet.textures["bishop_white"], PieceKind.Bishop, Piece.CORNERS, 8),
                rightKnight: new Piece(sheet.textures["knight_white"], PieceKind.Knight, Piece.KNIGHT),
                rightRook: new Piece(sheet.textures["rook_white"], PieceKind.Rook, Piece.SIDES, 8),
                pawn0: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn1: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn2: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn3: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn4: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn5: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn6: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
                pawn7: new Piece(sheet.textures["pawn_white"], PieceKind.Pawn, Piece.UP | Piece.PAWN, 2),
            },
        }

        for (const color in this.pieces) {
            for (const key in this.pieces[color]) {
                let piece = this.pieces[color][key];
                piece.on('piecedown', this.onPieceDown, this);
                piece.board = this;
            }
        }

        // letters
        for (let j = 0; j < 2; j++) {
            let c = 'a';
            for (let i = 0; i < 8; i++) {
                this.letters.push(new PIXI.Text(c, {
                    fill: 0xC2C2DA,
                    fontSize: 20
                }));

                let letter = this.letters[this.letters.length - 1];

                letter.anchor.set(0.5, 0.5);
                letter.x = (-Board.BOARD_WIDTH / 2) + Board.CELL_WIDTH / 2 + i * Board.CELL_WIDTH;
                letter.y = -Board.BOARD_HEIGHT / 2 - letter.height / 2 - 6 + j * (Board.BOARD_HEIGHT + letter.height + 6);
                this.addChild(letter);

                c = String.fromCharCode(c.charCodeAt(0) + 1);
            }
        }

        // numbers
        for (let j = 0; j < 2; j++) {
            let c = '8';
            for (let i = 0; i < 8; i++) {
                this.letters.push(new PIXI.Text(c, {
                    fill: 0xC2C2DA,
                    fontSize: 20
                }));

                let letter = this.letters[this.letters.length - 1];
                letter.anchor.set(0.5, 0.5);
                letter.x = -Board.BOARD_WIDTH / 2 - letter.width / 2 - 10 + j * (Board.BOARD_WIDTH + letter.width / 2 + 20);
                letter.y = -Board.BOARD_HEIGHT / 2 + i * Board.CELL_HEIGHT + Board.CELL_HEIGHT / 2;
                this.addChild(letter);

                c = String.fromCharCode(c.charCodeAt(0) - 1);
            }
        }
    }

    resetBoard(app: PIXI.Application) {
        this.canKingCastle = false;
        this.canQueenCastle = false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.cells[row][col].isAvailable = false;
                this.cells[row][col].isSelected = false;
                this.cells[row][col].isAttacked = false;
                this.cells[row][col].piece = null;
            }
        }

        if (this.color == Colors.Black) {
            let pieces = this.pieces.black;

            this.setPieceIn(7, 0, pieces.leftRook);
            this.setPieceIn(7, 1, pieces.leftKnight);
            this.setPieceIn(7, 2, pieces.leftBishop);
            this.setPieceIn(7, 3, pieces.king);
            this.setPieceIn(7, 4, pieces.queen);
            this.setPieceIn(7, 5, pieces.rightBishop);
            this.setPieceIn(7, 6, pieces.rightKnight);
            this.setPieceIn(7, 7, pieces.rightRook);

            this.addChild(pieces.leftRook, pieces.leftKnight, pieces.leftBishop, pieces.queen, pieces.king, pieces.rightBishop, pieces.rightKnight, pieces.rightRook);

            pieces = this.pieces.white;

            this.setPieceIn(0, 0, pieces.leftRook);
            this.setPieceIn(0, 1, pieces.leftKnight);
            this.setPieceIn(0, 2, pieces.leftBishop);
            this.setPieceIn(0, 3, pieces.king);
            this.setPieceIn(0, 4, pieces.queen);
            this.setPieceIn(0, 5, pieces.rightBishop);
            this.setPieceIn(0, 6, pieces.rightKnight);
            this.setPieceIn(0, 7, pieces.rightRook);

            this.addChild(pieces.leftRook, pieces.leftKnight, pieces.leftBishop, pieces.queen, pieces.king, pieces.rightBishop, pieces.rightKnight, pieces.rightRook);

            for (let i = 0; i < 8; i++) {
                let piece = this.pieces.black["pawn" + i];
                piece.directions = Piece.UP | Piece.PAWN;
                this.addChild(piece);
                this.setPieceIn(6, i, piece);
            }

            for (let i = 0; i < 8; i++) {
                let piece = this.pieces.white["pawn" + i];
                piece.directions = Piece.DOWN | Piece.PAWN;
                this.addChild(piece);
                this.setPieceIn(1, i, piece);
            }
        }
        else {
            let pieces = this.pieces.white;

            this.setPieceIn(7, 0, pieces.leftRook);
            this.setPieceIn(7, 1, pieces.leftKnight);
            this.setPieceIn(7, 2, pieces.leftBishop);
            this.setPieceIn(7, 3, pieces.queen);
            this.setPieceIn(7, 4, pieces.king);
            this.setPieceIn(7, 5, pieces.rightBishop);
            this.setPieceIn(7, 6, pieces.rightKnight);
            this.setPieceIn(7, 7, pieces.rightRook);

            this.addChild(pieces.leftRook, pieces.leftKnight, pieces.leftBishop, pieces.queen, pieces.king, pieces.rightBishop, pieces.rightKnight, pieces.rightRook);

            pieces = this.pieces.black;

            this.setPieceIn(0, 0, pieces.leftRook);
            this.setPieceIn(0, 1, pieces.leftKnight);
            this.setPieceIn(0, 2, pieces.leftBishop);
            this.setPieceIn(0, 3, pieces.queen);
            this.setPieceIn(0, 4, pieces.king);
            this.setPieceIn(0, 5, pieces.rightBishop);
            this.setPieceIn(0, 6, pieces.rightKnight);
            this.setPieceIn(0, 7, pieces.rightRook);

            this.addChild(pieces.leftRook, pieces.leftKnight, pieces.leftBishop, pieces.queen, pieces.king, pieces.rightBishop, pieces.rightKnight, pieces.rightRook);

            for (let i = 0; i < 8; i++) {
                let piece = this.pieces.white["pawn" + i];
                piece.directions = Piece.UP | Piece.PAWN;
                piece.hasMoved = false;
                this.addChild(piece);
                this.setPieceIn(6, i, piece);
            }

            for (let i = 0; i < 8; i++) {
                let piece = this.pieces.black["pawn" + i];
                piece.directions = Piece.DOWN | Piece.PAWN;
                piece.hasMoved = false;
                this.addChild(piece);
                this.setPieceIn(1, i, piece);
            }
        }

        this.resetLetters();
    }

    resetLetters() {
        // letters
        for (let j = 0; j < 2; j++) {
            let c = this.color == Colors.Black ? 'h' : 'a';
            for (let i = 0 + j * 8; i < 8 + j * 8; i++) {
                this.letters[i].text = c;

                if (this.color == Colors.Black)    
                    c = String.fromCharCode(c.charCodeAt(0) - 1);
                else
                    c = String.fromCharCode(c.charCodeAt(0) + 1);
            }
        }

        // numbers
        for (let j = 0; j < 2; j++) {
            let c = this.color == Colors.Black ? '1' : '8';
            for (let i = 16 + j * 8; i < 24 + j * 8; i++) {
                this.letters[i].text = c;

                if (this.color == Colors.Black)    
                    c = String.fromCharCode(c.charCodeAt(0) + 1);
                else
                    c = String.fromCharCode(c.charCodeAt(0) - 1);
            }
        }
    }

    redrawBoard() {

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {

                let cell = this.cells[row][col];

                if (cell.isAttacked) {
                    cell.graphics.tint = 0xFF0000;
                }
                else if (cell.isAvailable) {
                    cell.graphics.tint = 0x42fe42;
                    // cell.graphics.beginFill(0, 0.3);
                    // cell.graphics.drawCircle(Board.CELL_WIDTH / 2, Board.CELL_WIDTH / 2, 7);
                    // cell.graphics.endFill();
                }
                else if (cell.isSelected) {
                    cell.graphics.tint = 0x9662f6;
                }
                else {
                    cell.graphics.tint = 0xFFFFFF;
                }
            }
        }
    }

    clearPassants() {
        for (const color in this.pieces) {
            for (const key in this.pieces[color]) {
                this.pieces[color][key].isAdvanced = false;
                this.pieces[color][key].isEnPassant = false;
            }
        }
    }

    setActionsEnabled(isEnabled: boolean) {
        let color = this.color == Colors.White ? 'white' : 'black';
        for (const key in this.pieces[color]) {
            let piece = this.pieces[color][key];
            piece.interactive = isEnabled;
            piece.buttonMode = isEnabled;
        }
    }

    changePieceKind(piece: Piece, newKind: PieceKind) {
        piece.kind = newKind;

        let color;
        if (piece.isPlayer)
            color = this.color == Colors.Black ? 'black' : 'white';
        else
            color = this.color == Colors.Black ? 'white' : 'black';

        switch (newKind) {
            case PieceKind.Queen:
                piece.texture = this.spriteSheet.textures[`queen_${color}`];
                piece.directions = this.pieces[color].queen.directions;
                piece.count = this.pieces[color].queen.count;
                break;
            
            case PieceKind.Bishop:
                piece.texture = this.spriteSheet.textures[`bishop_${color}`];
                piece.directions = this.pieces[color].leftBishop.directions;
                piece.count = this.pieces[color].leftBishop.count;
                break;

            case PieceKind.Rook:
                piece.texture = this.spriteSheet.textures[`rook_${color}`];
                piece.directions = this.pieces[color].leftRook.directions;
                piece.count = this.pieces[color].leftRook.count;
                break;
            
            case PieceKind.Knight:
                piece.texture = this.spriteSheet.textures[`knight_${color}`];
                piece.directions = this.pieces[color].leftKnight.directions;
                piece.count = this.pieces[color].leftKnight.count;
                break;
        
            default:
                break;
        }
    }

    // verifyCheck() {
    //     let myColor = this.color == Colors.Black ? 'black' : 'white';
    //     let otherColor = this.color == Colors.Black ? 'white' : 'black';

    //     let king = this.pieces[myColor].king;
    //     let isPotentialUp = false;
    //     // checks the sides
    //     for (let i = 1; i <= 8; i++) {
    //         let upRow = king.row - i;
    //         let leftCol = king.col - i;
    //         let rightCol = king.col + i;
    //         let downRow = king.row + i;

            
    //     }
    // }

    validateMove(moveText: string) {
        let move = translateFromPGNMove(this.color == Colors.White ? Colors.Black : Colors.White, moveText);

        if (move.isKingSideCastle) {
            if (this.color == Colors.Black) {
                let leftRook = this.getPieceIn(0, 0);
                if (leftRook && leftRook.kind == PieceKind.Rook && !leftRook.hasMoved) {
                    let king = this.pieces.white.king;
                    this.cells[leftRook.row][leftRook.col].piece = null;
                    this.cells[leftRook.row][leftRook.col].isSelected = null;
                    this.cells[king.row][king.col].piece = null;
                    this.cells[king.row][king.col].isSelected = null;

                    leftRook.hasMoved =  true;
                    king.hasMoved = true;

                    this.setPieceIn(0, 2, leftRook);
                    this.setPieceIn(0, 1, king);
                }
            }
            else {
                let rightRook = this.getPieceIn(0, 7);
                if (rightRook && rightRook.kind == PieceKind.Rook && !rightRook.hasMoved) {
                    let king = this.pieces.black.king;
                    this.cells[rightRook.row][rightRook.col].piece = null;
                    this.cells[rightRook.row][rightRook.col].isSelected = null;
                    this.cells[king.row][king.col].piece = null;
                    this.cells[king.row][king.col].isSelected = null;

                    rightRook.hasMoved =  true;
                    king.hasMoved = true;

                    this.setPieceIn(0, 5, rightRook);
                    this.setPieceIn(0, 6, king);
                }
            }
            return;
        }
        else if (move.isQueenSideCastle) {
            if (this.color == Colors.Black) {
                let rightRook = this.getPieceIn(0, 7);
                if (rightRook && rightRook.kind == PieceKind.Rook && !rightRook.hasMoved) {
                    let king = this.pieces.white.king;
                    this.cells[rightRook.row][rightRook.col].piece = null;
                    this.cells[rightRook.row][rightRook.col].isSelected = null;
                    this.cells[king.row][king.col].piece = null;
                    this.cells[king.row][king.col].isSelected = null;
                    
                    rightRook.hasMoved =  true;
                    king.hasMoved = true;

                    this.setPieceIn(0, 4, rightRook);
                    this.setPieceIn(0, 5, king);
                }
            }
            else {
                let leftRook = this.getPieceIn(0, 0);
                if (leftRook && leftRook.kind == PieceKind.Rook && !leftRook.hasMoved) {
                    let king = this.pieces.black.king;
                    this.cells[leftRook.row][leftRook.col].piece = null;
                    this.cells[leftRook.row][leftRook.col].isSelected = null;
                    this.cells[king.row][king.col].piece = null;
                    this.cells[king.row][king.col].isSelected = null;

                    leftRook.hasMoved =  true;
                    king.hasMoved = true;

                    this.setPieceIn(0, 3, leftRook);
                    this.setPieceIn(0, 2, this.pieces.black.king);
                }
            }
            return;
        }

        let row = move.toRow;
        let col = move.toCol;
        let fromRow = move.fromRow;
        let fromCol = move.fromCol;

        if (this.color == Colors.Black) {
            row = 7 - row;
            col = 7 - col;
            fromRow = 7 - fromRow;
            fromCol = 7 - fromCol;
            console.log('ALO', fromRow, fromCol, row, col);
        }

        console.log(move);

        let piece = this.cells[fromRow][fromCol].piece;
        let cells = piece.getAvailableCells();

        console.log(piece, cells);

        if (piece.kind == move.pieceKind) {
            for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];
                if (row == cell[0] && col == cell[1]) {
                    
                    if (move.isPawnPromotion) {
                        this.changePieceKind(piece, move.promotionKind);
                    }

                    if (piece.kind == PieceKind.Pawn) {
                        if (!piece.hasMoved) {
                            piece.isEnPassant = true;
                        }
                        else {
                            // en passant
                            for (let j = fromCol - 1; j <= fromCol + 1; j += 2) {
                                let cellPiece = this.getPieceIn(fromRow, j);
                                if (cellPiece && cellPiece.isEnPassant) {
                                    this.removePieceFrom(fromRow, j);
                                }
                            }
                        }
                    }

                    if (move.hasCapture) {
                        this.setCellAttacked(row, col, true);
                    }
                    else {
                        this.setCellAvailable(row, col, true);
                    }

                    if (move.isCheck) {
                        if (this.color == Colors.Black) {
                            this.pieces.white.king.tint = 0xFF0000;
                        }
                        else {
                            this.pieces.black.king.tint = 0xFF0000;
                        }
                    }

                    this.placePieceIn(row, col, piece);
                    break;
                }
            }
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
        if (piece) {
            piece.x = (-Board.BOARD_WIDTH / 2) + (Board.CELL_WIDTH / 2) + col * Board.CELL_WIDTH;
            piece.y = (-Board.BOARD_HEIGHT / 2) + (Board.CELL_HEIGHT / 2) + row * Board.CELL_HEIGHT;
        }
        this.cells[row][col].piece = piece;
        piece.row = row;
        piece.col = col;
    }

    getPosFromPiece(piece: Piece): number[] {
        let output: number[] = [];
        for (let row = 0; row < this.cells.length; row++) {
            for (let col = 0; col < this.cells[row].length; col++) {
                if (this.cells[row][col].piece == piece) {
                    output[0] = row;
                    output[1] = col;
                    return output;
                }
            }
        }
    }

    setCellAttacked(row: number, col: number, attacked: boolean = true) {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
            let cell = this.cells[row][col];
            cell.isAttacked = attacked;

            if (attacked) {
                this.attackedCells.push([row, col]);
                cell.graphics.on('click', this.onCellClick, this);
                cell.graphics.buttonMode = true;
                cell.graphics.interactive = true;
            }
            else {
                cell.graphics.off('click', this.onCellClick, this);
                cell.graphics.buttonMode = false;
                cell.graphics.interactive = false;
            }
            
            this.redrawBoard();
        }
    }

    setCellAvailable(row: number, col: number, available: boolean = true) {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
            let cell = this.cells[row][col];
            cell.isAvailable = available;

            if (available) {
                this.availableCells.push([row, col]);
                cell.graphics.on('click', this.onCellClick, this);
                cell.graphics.buttonMode = true;
                cell.graphics.interactive = true;
            }
            else {
                cell.graphics.off('click', this.onCellClick, this);
                cell.graphics.buttonMode = false;
                cell.graphics.interactive = false;
            }

            this.redrawBoard();
        }
    }

    clearAvailableCells() {
        for (let i = 0; i < this.availableCells.length; i++) {
            const pos = this.availableCells[i];
            this.setCellAvailable(pos[0], pos[1], false);
        }
        this.availableCells.splice(0, this.availableCells.length);
    }

    clearAttackedCells() {
        for (let i = 0; i < this.attackedCells.length; i++) {
            const pos = this.attackedCells[i];
            this.setCellAttacked(pos[0], pos[1], false);
        }
        this.attackedCells.splice(0, this.attackedCells.length);
    }

    getRowColIn(x: number, y: number): number[] {
        return [Math.floor(y / Board.CELL_HEIGHT), Math.floor(x / Board.CELL_WIDTH)];
    }

    removePieceFrom(row: number, col: number) {
        let piece = this.getPieceIn(row, col);
        if (piece) {
            this.cells[row][col].piece = null;
            piece.parent.removeChild(piece);
        }
    }

    placePieceIn(row: number, col: number, piece: Piece): boolean {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {

            if (this.cells[row][col].isAttacked || this.cells[row][col].isAvailable) {
                let [oldRow, oldCol] = this.getPosFromPiece(piece);
                
                if (this.cells[row][col].isAvailable) {
                    let cells = piece.getAvailableCells();
                    for (let i = 0; i < cells.length; i++) {
                        let [row, col] = cells[i];
                        let cellPiece = this.getPieceIn(row, col);
                        if (cellPiece && cellPiece.kind == PieceKind.King && cellPiece.isPlayer != piece.isPlayer) {
                            cellPiece.tint = 0xFF0000;
                        }
                    }
                }
                else if (this.cells[row][col].isAttacked) {
                    let attackedPiece = this.cells[row][col].piece;
                    if (!attackedPiece) {
                        attackedPiece = this.cells[row+1][col].piece;
                        if (attackedPiece && attackedPiece.isEnPassant) {
                            // attackedPiece.parent.removeChild(attackedPiece);
                            this.removePieceFrom(row+1, col);
                        }
                    }
                    else {
                        // attackedPiece.parent.removeChild(attackedPiece);
                        this.removePieceFrom(row, col);
                    }
                }

                if (piece.kind == PieceKind.Pawn) {
                    if (Math.abs(row - oldRow) == 2) {
                        piece.isAdvanced = true;
                        for (let i = col - 1; i <= col + 1; i += 2) {
                            let cellPiece = this.getPieceIn(row, i);
                            if (cellPiece) {
                                piece.isEnPassant = true;
                                break;
                            }
                        }
                    }
                }

                this.cells[oldRow][oldCol].isSelected = false;
                this.cells[oldRow][oldCol].piece = null;
                this.setPieceIn(row, col, piece);

                this.clearAvailableCells();
                this.clearAttackedCells();

                this.redrawBoard();
                piece.hasMoved = true;
                return true;
            }
        }
        return false;
    }

    private onCellClick(event: PIXI.interaction.InteractionEvent) {
        let cell = <PIXI.Graphics>event.target;
        let pos = cell.getGlobalPosition();

        let [row, col] = this.getRowColIn((pos.x - (this.x - Board.BOARD_WIDTH / 2)), (pos.y - (this.y - Board.BOARD_HEIGHT / 2)));
        let piece = this.selectedCell.piece;

        let oldRow = piece.row;
        let oldCol = piece.col;

        let pgn: PGNObject = {
            fromCol: oldCol,
            fromRow: oldRow,
            toCol: col,
            toRow: row,
            isCheck: false,
            isCheckMate: false,
            isKingSideCastle: false,
            isQueenSideCastle: false,
            hasCapture: false,
            promotionKind: null,
            isPawnPromotion: false,
            pieceKind: piece.kind
        };

        if (this.cells[row][col].isAttacked) {
            pgn.hasCapture = true;
        }

        // pawn promotion
        if (piece.kind == PieceKind.Pawn) {
            if (row == 0) {
                pgn.isPawnPromotion = true;
                this.emit('showpromotion', piece, row, col, pgn);
                return;
            }
        }
        
        // castles
        if (piece.kind == PieceKind.King) {
            if (this.canKingCastle) {
                this.canKingCastle = false;
                if (this.color == Colors.Black) {
                    if (row == 7 && col == 1) {
                        let leftRook = this.getPieceIn(7, 0);
                        this.placePieceIn(7, 1, piece);

                        this.setCellAvailable(7, 2, true);
                        this.placePieceIn(7, 2, leftRook);

                        pgn.isKingSideCastle = true;
                        this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
                        return;
                    }
                }
                else {
                    if (row == 7 && col == 6) {
                        let rightRook = this.getPieceIn(7, 7);
                        this.placePieceIn(7, 6, piece);

                        this.setCellAvailable(7, 5, true);
                        this.placePieceIn(7, 5, rightRook);

                        pgn.isKingSideCastle = true;
                        this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
                        return;
                    }
                }
            }
            if (this.canQueenCastle) {
                this.canQueenCastle = false;
                if (this.color == Colors.Black) {
                    if (row == 7 && col == 5) {
                        let rightRook = this.getPieceIn(7, 7);
                        this.placePieceIn(7, 5, piece);

                        this.setCellAvailable(7, 4, true);
                        this.placePieceIn(7, 4, rightRook);
            
                        pgn.isQueenSideCastle = true;
                        this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
                        return;
                    }
                }
                else {
                    if (row == 7 && col == 2) {
                        let leftRook = this.getPieceIn(7, 0);
                        this.placePieceIn(7, 2, piece);

                        this.setCellAvailable(7, 3, true);
                        this.placePieceIn(7, 3, leftRook);
            
                        pgn.isQueenSideCastle = true;
                        this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
                        return;
                    }
                }
            }
        }

        this.placePieceIn(row, col, piece);

        this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
    }

    private onPieceDown(event: PIXI.interaction.InteractionEvent) {
        let piece = <Piece>event.target;
        let pos = this.getPosFromPiece(piece);

        // bring piece to front in the Z index
        piece.parent.setChildIndex(piece, piece.parent.children.length - 1);

        this.clearAvailableCells();
        this.clearAttackedCells();

        if (this.selectedCell)
            this.selectedCell.isSelected = false;
        
        this.selectedCell = this.cells[pos[0]][pos[1]];
        this.cells[pos[0]][pos[1]].isSelected = true;

        let cells = piece.getAvailableCells();

        for (let i = 0; i < cells.length; i++) {
            let [row, col] = cells[i];
            let cellPiece = this.getPieceIn(row, col);
            if (cellPiece) {
                if (cellPiece.isPlayer != piece.isPlayer) {
                    this.setCellAttacked(row, col, true);
                }
            }
            else {
                if (piece.kind == PieceKind.Pawn) {
                    // en passant stuff
                    let cellPiece = this.getPieceIn(row + 1, col);
                    if (cellPiece && cellPiece.isEnPassant) {
                        this.setCellAttacked(row, col, true);
                    }
                    else {
                        this.setCellAvailable(row, col, true);
                    }
                }
                else {
                    this.setCellAvailable(row, col, true);
                }
            }
        }

        piece.once('pieceup', this.onPieceUp, this);
    }

    private onPieceUp(event: PIXI.interaction.InteractionEvent) {
        let piece = <Piece>event.target;

        let pos = piece.getGlobalPosition();

        let [row, col] = this.getRowColIn((pos.x - (this.x - Board.BOARD_WIDTH / 2)), (pos.y - (this.y - Board.BOARD_HEIGHT / 2)));
        let oldRow = piece.row;
        let oldCol = piece.col;

        if (!this.placePieceIn(row, col, piece)) {
            //@ts-ignore
            piece.x = piece.originalPos[0];
            //@ts-ignore
            piece.y = piece.originalPos[1];
        }
        else {
            let pgn: PGNObject = {
                fromCol: oldCol,
                fromRow: oldRow,
                toCol: col,
                toRow: row,
                isCheck: false,
                isCheckMate: false,
                isKingSideCastle: false,
                isQueenSideCastle: false,
                hasCapture: false,
                promotionKind: null,
                isPawnPromotion: false,
                pieceKind: piece.kind
            };
    
            if (this.cells[row][col].isAttacked) {
                pgn.hasCapture = true;
            }

            this.emit('movepiece', translateIntoPGNMove(this.color, pgn));
        }
    }

    
    private _color : Colors;
    public get color() : Colors {
        return this._color;
    }
    public set color(v : Colors) {
        let currentColor = this.color == Colors.Black ? 'black' : 'white';
        let newColor = v == Colors.Black ? 'black' : 'white';

        for (const key in this.pieces[currentColor]) {
            let piece = this.pieces[currentColor][key];
            piece.isPlayer = false;
            piece.buttonMode = false
            piece.interactive = false;

            let otherPiece = this.pieces[newColor][key];
            otherPiece.isPlayer = true;
            otherPiece.buttonMode = true;
            otherPiece.interactive = true;
        }

        this._color = v;
    }
}