var script = document.createElement('script');

script.setAttribute('src', 'chess.js');

var defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

script.onload = function () {
    var app = new App().then(Module => {
        const chessboardEl = document.getElementById('chessboard');
        const statusEl = document.getElementById('status');
        const resetBtn = document.getElementById('resetBtn');
        const moveListEl = document.getElementById('moveList');
        let moveHistory = [];
        let capturedWhite = [];
        let capturedBlack = [];
        let previousBoard = defaultFen.split(' ')[0];
        let draggedSquare = null;

        const files = ['a','b','c','d','e','f','g','h'];
        let selectedSquare = null;

        const pieceUnicode = {
            'P': '♙','N':'♘','B':'♗','R':'♖','Q':'♕','K':'♔',
            'p': '♟','n':'♞','b':'♝','r':'♜','q':'♛','k':'♚'
        };

        function createBoard() {
            chessboardEl.innerHTML = '';
            for (let r = 7; r >= 0; r--) {
                for (let f = 0; f < 8; f++) {
                    const sq = document.createElement('div');
                    sq.classList.add('square');
                    sq.classList.add((r + f) % 2 === 0 ? 'white' : 'black');
                    sq.dataset.rank = r;
                    sq.dataset.file = f;

                    sq.addEventListener('dragstart', onDragStart);
                    sq.addEventListener('dragover', onDragOver);
                    sq.addEventListener('drop', onDrop);

                    chessboardEl.appendChild(sq);
                }
            }
        }

        function renderBoard(fen) {
            const boardPart = fen.split(' ')[0];
            const ranks = boardPart.split('/');
            const squares = chessboardEl.children;
            let idx = 0;

            for (let i = 0; i < squares.length; i++) {
                squares[i].textContent = '';
                squares[i].draggable = false;
            }

            for (const rank of ranks) {
                for (const char of rank) {
                    if (isNaN(char)) {
                        squares[idx].textContent = pieceUnicode[char] || '';
                        squares[idx].draggable = true;
                        squares[idx].dataset.piece = char;
                        idx++;
                    } else {
                        idx += parseInt(char);
                    }
                }
            }
        }

        function updateBoard(){
            const len = 128;
            const ptr = Module._malloc(len);
            const used_len = Module.ccall('get_fen', 'number', ['number', 'number'], [ptr, len]);
            const fenBuf = new Uint8Array(Module.HEAPU8.subarray(ptr, ptr + used_len));
            const fen = String.fromCharCode(...fenBuf).replace(/\0/g, '');
            Module._free(ptr);
            renderBoard(fen);
            updateCapturedPieces(fen);
            const status = Module.ccall('get_status','number',[],[]);
            let statusText = '';
            switch (status) {
                case 0: statusText = 'Ongoing'; break;
                case 1: statusText = 'Check'; break;
                case 2: statusText = 'Checkmate'; break;
                case 3: statusText = 'Stalemate'; break;
            }
            statusEl.textContent=`Status: ${statusText}`;

            const turnIndicatorEl = document.getElementById('turnIndicator');
            const activeColor = fen.split(' ')[1]; // 'w' or 'b'
            turnIndicatorEl.textContent = activeColor === 'w' ? 'White to play' : 'Black to play';

            saveGameState(fen, moveHistory, capturedWhite, capturedBlack, previousBoard);
        }

        function renderMoveList() {
            moveListEl.innerHTML = '';
            for (let i = 0; i < moveHistory.length; i++) {
                const moveText = document.createElement('div');
                const moveNumber = Math.floor(i / 2) + 1;
                const isWhiteMove = i % 2 === 0;
                moveText.textContent = isWhiteMove
                    ? `${moveNumber}. ${moveHistory[i]}`
                    : `... ${moveHistory[i]}`;
                moveListEl.prepend(moveText);
            }
            moveListEl.scrollTop = moveListEl.scrollHeight;
        }

        function updateCapturedPieces(fen) {
            const boardPart = fen.split(' ')[0];
            const ranks = boardPart.split('/');
            const currentPieces = [];

            for (const rank of ranks) {
                for (const char of rank) {
                    if (isNaN(char)) currentPieces.push(char);
                }
            }

            const prevRanks = previousBoard.split('/');
            const prevPieces = [];
            for (const rank of prevRanks) {
                for (const char of rank) {
                    if (isNaN(char)) prevPieces.push(char);
                }
            }

            for (const piece of prevPieces) {
                const idx = currentPieces.indexOf(piece);
                if (idx !== -1) currentPieces.splice(idx, 1);
                else {
                    if (piece === piece.toUpperCase()) capturedWhite.push(piece);
                    else capturedBlack.push(piece);
                }
            }

            previousBoard = boardPart;

            let whiteText = capturedWhite.map(c => pieceUnicode[c] || '').join(' ');
            document.getElementById('takenWhite').textContent = whiteText.length ? whiteText : "-";

            let blackText = capturedBlack.map(c => pieceUnicode[c] || '').join(' ');
            document.getElementById('takenBlack').textContent = blackText.length ? blackText : "-";
        }

        function onSquareClick(e) {
            const sq = e.currentTarget;

            if (!selectedSquare) {
                selectedSquare = sq;
                sq.style.outline = '2px solid red';
            } else {
                const from = selectedSquare;
                const to = sq;
                const piece = from.textContent;
                const uci = `${files[from.dataset.file]}${parseInt(from.dataset.rank) + 1}${files[to.dataset.file]}${parseInt(to.dataset.rank) + 1}`;
                const isValid = Module.ccall('apply_move_uci', 'number', ['string'], [uci]);
                if (isValid) {
                    moveHistory.push(uci + piece);
                    renderMoveList();
                    updateBoard();
                } else {
                    from.style.outline = '2px solid red';
                    to.style.outline = '';
                }
                selectedSquare.style.outline = '';
                selectedSquare = null;
            }
        }

        function saveGameState(fen, moveHistory, capturedWhite, capturedBlack, previousBoard) {
            const gameState = {
                fen,
                moveHistory,
                capturedWhite,
                capturedBlack,
                previousBoard,
                timestamp: Date.now()
            };
            localStorage.setItem('chessGameState', JSON.stringify(gameState));
        }

        function loadGameState() {
            const saved = localStorage.getItem('chessGameState');
            if (!saved) return null;
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved game:", e);
                return null;
            }
        }

        function onDragStart(e) {
            if (!e.target.dataset.piece) return;
            draggedSquare = e.target;
            e.dataTransfer.setData('text/plain', '');

            const dragImage = document.createElement('div');
            dragImage.style.fontSize = '44px';
            dragImage.style.fontFamily = 'Arial';
            dragImage.style.color = e.target.style.color || (e.target.classList.contains('white') ? '#000' : '#fff');
            dragImage.textContent = e.target.dataset.piece ? pieceUnicode[e.target.dataset.piece] : '';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);

            e.dataTransfer.setDragImage(dragImage, 18, 18);
            setTimeout(() => document.body.removeChild(dragImage), 0);
        }

        function onDragOver(e) {
            e.preventDefault();
        }

        function onDrop(e) {
            e.preventDefault();
            const from = draggedSquare;
            const to = e.currentTarget;

            if (!from || from === to) return;

            const files = ['a','b','c','d','e','f','g','h'];
            const uci = `${files[from.dataset.file]}${parseInt(from.dataset.rank)+1}${files[to.dataset.file]}${parseInt(to.dataset.rank)+1}`;
            const isValid = Module.ccall('apply_move_uci', 'number', ['string'], [uci]);

            if (isValid) {
                moveHistory.push(uci + (from.dataset.piece || ''));
                renderMoveList();
                updateBoard();
            }

            draggedSquare = null;
        }

        resetBtn.addEventListener('click', () => {
            Module.ccall('init_game', null, ['number','number'], [8,8]);
            moveHistory = [];
            capturedWhite = [];
            capturedBlack = [];
            previousBoard = '';
            Module.ccall('set_fen', null, ['string'], [defaultFen]);
            renderMoveList();
            updateBoard();
        });

        createBoard();
        Module.ccall('init_game', null, ['number','number'], [8,8]);

        const savedState = loadGameState();
        if (savedState) {
            const fen = savedState.fen;
            Module.ccall('set_fen', null, ['string'], [fen]);
            moveHistory = savedState.moveHistory || [];
            capturedWhite = savedState.capturedWhite || [];
            capturedBlack = savedState.capturedBlack || [];
            previousBoard = savedState.previousBoard || defaultFen;
            renderMoveList();
            updateBoard();
        } else {
            Module.ccall('set_fen', null, ['string'], [defaultFen]);
            updateBoard();
        }
    });
};

document.body.appendChild(script);
