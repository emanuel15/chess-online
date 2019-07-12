import * as PIXI from 'pixi.js';
import { Board } from './board';
import {
    Color,
    Events,
    DataStream,
    PGN,
    PGNObject,
    PieceKind,
    BOARD_WIDTH,
    BOARD_HEIGHT
} from '../server/shared';
import { Piece } from './piece';

const app = new PIXI.Application({
    backgroundColor: 0x2c2c2c,
    width: window.innerWidth,
    height: window.innerHeight - 4,
});

document.body.appendChild(app.view);

let ws: WebSocket;

let board: Board;
let promotionWindow: PIXI.Graphics;
let promotionSprites: PIXI.Sprite[] = [];
let promotionPiece: Piece, promotionRow: number, promotionCol: number, promotionPGN: PGNObject;

let checkInfo: PIXI.Text;
let gameInfo: PIXI.Text;

let dataStream = new DataStream();
let infoEl = document.querySelector('#info');

function loadAssets() {
    app.loader.add("images/spritesheet.min.json").load(() => {
        board.createBoard(app);
        board.resetBoard(app);
        buildPromotionWindow();
        connectToServer();
    });
}

function buildPromotionWindow() {
    promotionSprites = [
        new PIXI.Sprite(app.loader.resources["images/spritesheet.min.json"].textures["queen_white"]),
        new PIXI.Sprite(app.loader.resources["images/spritesheet.min.json"].textures["knight_white"]),
        new PIXI.Sprite(app.loader.resources["images/spritesheet.min.json"].textures["bishop_white"]),
        new PIXI.Sprite(app.loader.resources["images/spritesheet.min.json"].textures["rook_white"]),
    ];

    promotionWindow = new PIXI.Graphics();
    promotionWindow.lineStyle(5);
    promotionWindow.beginFill(0x834202)
        .drawRoundedRect(-100, -50, 200, 100, 10)
    .endFill();

    let totalWidth = promotionSprites[0].width + promotionSprites[1].width + promotionSprites[2].width + promotionSprites[3].width;
    for (let i = 0; i < promotionSprites.length; i++) {
        let sprite = promotionSprites[i];
        sprite.anchor.set(0.5, 0.5);
        sprite.alpha = 0.5;
        sprite.buttonMode = true;
        sprite.interactive = true;
        promotionWindow.addChild(sprite);
        sprite.x = -totalWidth / 2 + i * sprite.width + sprite.width / 2;

        sprite.on('mouseover', function() {
            sprite.alpha = 1.0;
        });

        sprite.on('mouseout', function() {
            sprite.alpha = 0.5;
        });
    }

    let promotions = [PieceKind.Queen, PieceKind.Knight, PieceKind.Bishop, PieceKind.Rook];
    for (let i = 0; i < promotions.length; i++) {
        promotionSprites[i].on('click', function(event: PIXI.interaction.InteractionEvent) {
            promotionPGN.promotionKind = promotions[i];
            board.changePieceKind(promotionPiece, promotions[i]);
            board.placePieceIn(promotionRow, promotionCol, promotionPiece);
            board.emit('movepiece', PGN.translateInto(board.color, promotionPGN));
            hidePromotionWindow();
        });
    }
}

function showPromotionWindow() {
    app.stage.addChild(promotionWindow);
    promotionWindow.x = app.view.width / 2;
    promotionWindow.y = app.view.height / 2;
}

function hidePromotionWindow() {
    app.stage.removeChild(promotionWindow);
}

function setPromotionColor(newColor: string) {
    promotionSprites[0].texture = app.loader.resources["images/spritesheet.min.json"].textures[`queen_${newColor}`];
    promotionSprites[1].texture = app.loader.resources["images/spritesheet.min.json"].textures[`knight_${newColor}`];
    promotionSprites[2].texture = app.loader.resources["images/spritesheet.min.json"].textures[`bishop_${newColor}`];
    promotionSprites[3].texture = app.loader.resources["images/spritesheet.min.json"].textures[`rook_${newColor}`];
}

function initializeGame() {
    board = new Board();

    app.stage.addChild(board);

    board.x = (app.view.width - BOARD_WIDTH) / 2;
    board.y = (app.view.height - BOARD_HEIGHT) / 2;

    board.on('movepiece', function(moveText: string) {
        ws.send(dataStream
            .queue(Events.Move, moveText)
            .output()
        );
    });

    board.on('showpromotion', function(piece: Piece, row: number, col: number, pgn: PGNObject) {
        promotionPiece = piece;
        promotionRow = row;
        promotionCol = col;
        promotionPGN = pgn;
        setPromotionColor(board.color);
        showPromotionWindow();
    });

    board.on('check', function() {
        checkInfo.text = 'Check!';
    });

    board.on('uncheck', function() {
        checkInfo.text = '';
    });

    board.on('checkmate', function() {
        gameInfo.text = 'You lost!';
        checkInfo.text = 'Checkmate!';
    });

    board.on('youwon', function() {
        gameInfo.text = 'You won!';
    });

    checkInfo = new PIXI.Text('', {
        align: 'center',
        fill: '#e13232',
        stroke: '#000',
        strokeThickness: 2
    });
    app.stage.addChild(checkInfo);

    checkInfo.anchor.set(0.5, 0.5);
    checkInfo.x = app.view.width / 2;
    checkInfo.y = app.view.height / 2 + BOARD_HEIGHT / 2 + 50; 

    gameInfo = new PIXI.Text('', {
        align: 'center',
        fill: '#FEFEFE',
        stroke: '#000',
        strokeThickness: 2
    });
    app.stage.addChild(gameInfo);

    gameInfo.anchor.set(0.5, 0.5);
    gameInfo.x = app.view.width / 2;
    gameInfo.y = app.view.height / 2 - BOARD_HEIGHT / 2 - 60; 


    document.addEventListener('keypress', function(event) {
        if (event.key == 'c') {
            board.verifyCheck(board.color, true);
        }
    });

    loadAssets();
}

function connectToServer() {
    let host = location.origin.replace(/^http/, 'ws');
    ws = new WebSocket('ws://localhost:8000');

    ws.onopen = () => {
        console.log('Connected to server');
        infoEl.textContent = 'Searching for an opponent...';
    };

    ws.onmessage = (message) => {
        let events = message.data.split(';');

        for (let i = 0; i < events.length; i++) {
            let [event, value] = events[i].split(':');

            switch (parseInt(event)) {
                case Events.GameStart:
                    infoEl.classList.add('hidden');
                    break;
                
                case Events.Color:
                    board.color = value;
                    board.resetBoard(app);
                    break;
                
                case Events.Move:
                    board.validateMove(value);
                    break;
                
                case Events.ChangeTurn:
                    let turnColor = value;

                    board.moves++;

                    if ((board.moves % 2) != 0) {
                        board.clearPassants();
                    }

                    if (turnColor == board.color) {
                        if (!board.isInCheck) {
                            board.setActionsEnabled(true);
                        }
                        gameInfo.text = 'It\'s your turn!';
                    }
                    else {
                        board.setActionsEnabled(false);
                        gameInfo.text = `It's ${board.color == Color.Black ? 'white' : 'black' }'s turn!`;
                    }
                    break;
                
                case Events.EnemyLeave:
                    gameInfo.text = 'Your opponent abandoned the game, you won!';
                    board.setActionsEnabled(false);
                    break;
            
                default:
                    break;
            }
        }
    };

    ws.onclose = () => {
        console.log('Disconnected');
    };
}

initializeGame();
