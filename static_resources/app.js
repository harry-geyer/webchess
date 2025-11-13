import { WasmBridge } from './wasm/wasm_bridge.js';
import { Board, getPieceChar } from './ui/board.js';
import { GameState } from './state/game_state.js';
import { defaultFen } from './utils/constants.js';
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

    function showPromotionDialog(sourceSquare, targetSquare, colour = 'w') {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'promo-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const box = document.createElement('div');
            box.className = 'promo-box';
            box.tabIndex = -1;

            const title = document.createElement('div');
            title.className = 'promo-title';
            title.textContent = 'Choose promotion';

            const buttons = document.createElement('div');
            buttons.className = 'promo-buttons';

            const isWhite = colour === 'w';
            const choices = [
                { letter: 'q', symbol: getPieceChar(isWhite ? 'Q' : 'q') },
                { letter: 'r', symbol: getPieceChar(isWhite ? 'R' : 'r') },
                { letter: 'b', symbol: getPieceChar(isWhite ? 'B' : 'b') },
                { letter: 'n', symbol: getPieceChar(isWhite ? 'N' : 'n') }
            ];
            console.log(choices);

            choices.forEach(c => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'promo-btn';
                btn.dataset.promo = c.letter;
                btn.textContent = c.symbol;
                btn.style.fontFamily = 'Merida';
                btn.style.fontSize = '48px';
                btn.style.color = isWhite ? '#fff' : '#000';
                btn.addEventListener('click', () => {
                    cleanup();
                    resolve(c.letter);
                });
                buttons.appendChild(btn);
            });

            box.appendChild(title);
            box.appendChild(buttons);
            overlay.appendChild(box);
            document.body.appendChild(overlay);

            const keyHandler = (ev) => {
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                    cleanup();
                    resolve(null);
                    return;
                }
                const k = ev.key.toLowerCase();
                if (['q','r','b','n'].includes(k)) {
                    ev.preventDefault();
                    cleanup();
                    resolve(k);
                }
            };

            const outsideHandler = (ev) => {
                if (!box.contains(ev.target)) {
                    cleanup();
                    resolve(null);
                }
            };

            function cleanup() {
                document.removeEventListener('keydown', keyHandler, true);
                overlay.removeEventListener('pointerdown', outsideHandler, true);
                if (overlay.parentElement) overlay.remove();
            }

            document.addEventListener('keydown', keyHandler, true);
            overlay.addEventListener('pointerdown', outsideHandler, true);
        });
    }

    const board = new Board(
        chessboardEl,
        (uci, piece) => {
            const isPawn = piece && piece.toLowerCase() === 'p';
            const toRankChar = uci && uci.length >= 4 ? uci[3] : null;
            const toRank = toRankChar ? parseInt(toRankChar, 10) : null;
            const needsPromotion = isPawn && (toRank === 1 || toRank === 8) && uci.length === 4;

            if (needsPromotion) {
                const fromSq = uci.slice(0,2);
                const toSq = uci.slice(2,4);

                const isWhiteMove = FEN.getActiveColour(previousFEN) === 'w';
                showPromotionDialog(fromSq, toSq, isWhiteMove ? 'w' : 'b').then(promoLetter => {
                    if (!promoLetter) {
                        return;
                    }
                    const promoUci = uci + promoLetter;
                    if (wasm.applyMove(promoUci)) {
                        addMove(promoUci);
                        updateUI();
                    } else {
                        console.warn('applyMove rejected promotion move', promoUci);
                    }
                }).catch(err => {
                    console.error('promotion dialog error', err);
                });

                return false;
            }

            if (wasm.applyMove(uci)) {
                addMove(uci);
                updateUI();
                return true;
            }
            return false;
        },
        () => FEN.getActiveColour(previousFEN),
        (pos) => wasm.getAvailableMoves(pos)
    );

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
            capturedWhite.map(c => getPieceChar(c)).join('') || '-';

        document.getElementById('takenBlack').textContent =
            capturedBlack.map(c => getPieceChar(c)).join('') || '-';
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
