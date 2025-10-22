var script = document.createElement('script');

script.setAttribute('src', 'chess.js');

var defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

script.onload = function () {
    var app = new App().then(Module => {
        const chessboardEl = document.getElementById('chessboard');
        const statusEl = document.getElementById('status');
        const resetBtn = document.getElementById('resetBtn');

        const files = ['a','b','c','d','e','f','g','h'];
        let selectedSquare = null;

        const pieceUnicode = {
            'P': '♙','N':'♘','B':'♗','R':'♖','Q':'♕','K':'♔',
            'p': '♟','n':'♞','b':'♝','r':'♜','q':'♛','k':'♚'
        };

        function createBoard() {
            chessboardEl.innerHTML = '';
            for (let r=7;r>=0;r--) {
                for (let f=0;f<8;f++) {
                    const sq=document.createElement('div');
                    sq.classList.add('square');
                    sq.classList.add((r+f)%2===0?'white':'black');
                    sq.dataset.rank=r;
                    sq.dataset.file=f;
                    sq.addEventListener('click', onSquareClick);
                    chessboardEl.appendChild(sq);
                }
            }
        }

        function renderBoard(fen) {
            const boardPart = fen.split(' ')[0];
            const ranks = boardPart.split('/');
            const squares = chessboardEl.children;
            let idx = 0;

            // 🔧 Clear all squares first
            for (let i = 0; i < squares.length; i++) {
                squares[i].textContent = '';
            }

            // Now fill in with current FEN positions
            for (const rank of ranks) {
                for (const char of rank) {
                    if (isNaN(char)) {
                        squares[idx].textContent = pieceUnicode[char] || '';
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
            Module.ccall('get_fen', null, ['number', 'number'], [ptr, len]);
            const fenBuf = new Uint8Array(Module.HEAPU8.subarray(ptr, ptr + len));
            const fen = String.fromCharCode(...fenBuf).replace(/\0/g, '');
            Module._free(ptr);
            renderBoard(fen);
            const status = Module.ccall('get_status','number',[],[]);
            let statusText = '';
            switch (status) {
                case 0: statusText = 'Ongoing'; break;
                case 1: statusText = 'Check'; break;
                case 2: statusText = 'Checkmate'; break;
                case 3: statusText = 'Stalemate'; break;
            }
            statusEl.textContent=`Status: ${statusText}`;
        }

        function onSquareClick(e){
            const sq=e.currentTarget;
            if(!selectedSquare){ selectedSquare=sq; sq.style.outline='2px solid red'; }
            else {
                const from=selectedSquare; const to=sq;
                const uci=`${files[from.dataset.file]}${parseInt(from.dataset.rank)+1}${files[to.dataset.file]}${parseInt(to.dataset.rank)+1}`;
                Module.ccall('apply_move_uci', null, ['string'], [uci]);
                updateBoard();
                selectedSquare.style.outline='';
                selectedSquare=null;
            }
        }

        resetBtn.addEventListener('click', ()=>{
            Module.ccall('init_game', null, ['number','number'], [8,8]);
            updateBoard();
        });

        createBoard();
        Module.ccall('init_game', null, ['number','number'], [8,8]);
        Module.ccall('set_fen', null, ['string'], [defaultFen]);
        updateBoard();
    });
};

document.body.appendChild(script);
