import { WasmBridge } from './wasm/wasm_bridge.js';
import { Board } from './ui/board.js';
import { GameState } from './state/game_state.js';
import { defaultFen, pieceUnicode } from './utils/constants.js';
import { FEN } from './fen/fen.js';

(async function initApp() {
    const wasm = await new WasmBridge().init();

    const chessboardEl = document.getElementById('chessboard');
    const statusEl = document.getElementById('status');
    const resetBtn = document.getElementById('resetBtn');
    const moveListEl = document.getElementById('moveList');
    const moveListContainerEl = moveListEl.parentElement;

    const movegenSelect = document.getElementById('movegenSelect');
    const getMoveBtn = document.getElementById('getMoveBtn');

    let moveHistory = [];
    let capturedWhite = [];
    let capturedBlack = [];
    let previousFEN = defaultFen;
    let moveGen = '';

    const board = new Board(chessboardEl, (uci, piece) => {
        if (wasm.applyMove(uci)) {
            addMove(uci + piece);
            updateUI();
        }
    });

    function updateCapturedPieces(fen) {
        const boardPart = FEN.getBoardPart(fen);
        const ranks = FEN.getRanks(fen);
        const currentPieces = [];

        for (const rank of ranks) {
            for (const char of rank) {
                if (isNaN(char)) currentPieces.push(char);
            }
        }

        const prevRanks = FEN.getRanks(previousFEN);
        const prevPieces = [];
        for (const rank of prevRanks) {
            for (const char of rank) {
                if (isNaN(char)) prevPieces.push(char);
            }
        }

        for (const piece of prevPieces) {
            const idx = currentPieces.indexOf(piece);
            if (idx !== -1) {
                currentPieces.splice(idx, 1);
            } else {
                if (piece === piece.toUpperCase()) capturedWhite.push(piece);
                else capturedBlack.push(piece);
            }
        }

        previousFEN = fen;

        document.getElementById('takenWhite').textContent =
            capturedWhite.map(c => pieceUnicode[c] || '').join(' ') || '-';

        document.getElementById('takenBlack').textContent =
            capturedBlack.map(c => pieceUnicode[c] || '').join(' ') || '-';
    }

    function updateTurnIndicator(fen) {
        const activeColour = FEN.getActiveColour(fen);
        const turnIndicatorEl = document.getElementById('turnIndicator');
        if (!turnIndicatorEl) return;

        turnIndicatorEl.textContent = activeColour === 'w' ? 'White to play' : 'Black to play';
    }

    function updateUI() {
        const fen = wasm.getFEN();
        board.render(fen);
        updateCapturedPieces(fen);
        GameState.save({ fen, moveHistory, capturedWhite, capturedBlack, previousFEN, moveGen });
        updateTurnIndicator(fen);
        statusEl.textContent = `Status: ${wasm.getStatus()}`;
    }

    function makeMoveDiv(i) {
        const moveNumber = Math.floor(i / 2) + 1;
        const isWhiteMove = (i % 2) === 0;
        const d = document.createElement('div');
        d.textContent = isWhiteMove
            ? `${moveNumber}. ${moveHistory[i]}`
            : `... ${moveHistory[i]}`;
        return d;
    }

    function renderMoveList() {
        moveListEl.innerHTML = '';
        for (let i = 0; i < moveHistory.length; i++) {
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;

            const moveDiv = document.createElement('div');
            moveDiv.textContent = isWhiteMove
                ? `${moveNumber}. ${moveHistory[i]}`
                : `... ${moveHistory[i]}`;

            moveListEl.appendChild(moveDiv);
        }
        moveListEl.parentElement.scrollTop = moveListEl.parentElement.scrollHeight;
    }

    function addMove(move) {
        moveHistory.push(move);
        const i = moveHistory.length - 1;
        const moveNumber = Math.floor(i / 2) + 1;
        const isWhiteMove = i % 2 === 0;
        const moveDiv = document.createElement('div');
        moveDiv.textContent = isWhiteMove
            ? `${moveNumber}. ${move}`
            : `... ${move}`;
        moveListEl.appendChild(moveDiv);
        const container = moveListEl.parentElement;
        container.scrollTop = container.scrollHeight;
    }

    resetBtn.addEventListener('click', () => {
        wasm.reset(defaultFen);
        moveHistory = [];
        capturedWhite = [];
        capturedBlack = [];
        previousFEN = defaultFen;
        updateUI();
        renderMoveList();
    });

    board.create();

    const movegens = wasm.getMovegenList();
    movegens.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        movegenSelect.appendChild(opt);
    });

    const saved = GameState.load();
    if (saved) {
        wasm.setFEN(saved.fen);
        moveHistory = saved.moveHistory;
        capturedWhite = saved.capturedWhite;
        capturedBlack = saved.capturedBlack;
        previousFEN = saved.previousFEN;
        moveGen = saved.moveGen;
        if (movegens.includes(moveGen)) {
            wasm.setMovegen(moveGen);
            movegenSelect.value = moveGen;
        } else {
            if (movegens.length > 0) {
                moveGen = movegens[0];
                wasm.setMovegen(moveGen);
                movegenSelect.value = moveGen;
            }
        }
    } else {
        wasm.setFEN(defaultFen);
        if (movegens.length > 0) {
            moveGen = movegens[0];
            wasm.setMovegen(moveGen);
            movegenSelect.value = moveGen;
        }
    }

    movegenSelect.addEventListener('change', () => {
        moveGen = movegenSelect.value;
        wasm.setMovegen(moveGen);
    });

    getMoveBtn.addEventListener('click', () => {
        const bestMove = wasm.getBestMove();
        if (bestMove && wasm.applyMove(bestMove)) {
            addMove(bestMove);
            updateUI();
        }
    });

    updateUI();
    renderMoveList();
})();
