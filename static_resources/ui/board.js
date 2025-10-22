import { pieceUnicode, files } from '../utils/constants.js';
import { FEN } from '../fen/fen.js';

export class Board {
    constructor(el, onMove) {
        this.el = el;
        this.onMove = onMove;
        this.draggedSquare = null;
    }

    create() {
        this.el.innerHTML = '';
        for (let r = 7; r >= 0; r--) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.classList.add('square', (r + f) % 2 === 0 ? 'white' : 'black');
                sq.dataset.rank = r;
                sq.dataset.file = f;

                sq.addEventListener('dragstart', e => this.onDragStart(e));
                sq.addEventListener('dragover', e => e.preventDefault());
                sq.addEventListener('drop', e => this.onDrop(e));

                this.el.appendChild(sq);
            }
        }
    }

    render(fen) {
        const boardPart = FEN.getBoardPart(fen);
        const ranks = FEN.getRanks(fen);
        const squares = this.el.children;
        let idx = 0;

        for (const sq of squares) {
            sq.textContent = '';
            sq.removeAttribute('data-piece');
            sq.draggable = false;
        }

        for (const rank of ranks) {
            for (const char of rank) {
                if (isNaN(char)) {
                    squares[idx].textContent = pieceUnicode[char] || '';
                    squares[idx].dataset.piece = char;
                    squares[idx].draggable = true;
                    idx++;
                } else {
                    idx += parseInt(char);
                }
            }
        }
    }

    onDragStart(e) {
        const piece = e.target.dataset.piece;
        if (!piece) return;

        this.draggedSquare = e.target;
        e.dataTransfer.setData('text/plain', '');

        const ghost = document.createElement('div');
        ghost.textContent = pieceUnicode[piece];
        ghost.style.fontSize = '44px';
        ghost.style.fontFamily = 'Arial, sans-serif';
        ghost.style.color = piece === piece.toUpperCase() ? '#fff' : '#000'; // optional, contrast
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';   // hide offscreen
        ghost.style.left = '-1000px';
        ghost.style.background = 'transparent';
        ghost.style.pointerEvents = 'none';

        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 22, 22);

        setTimeout(() => document.body.removeChild(ghost), 0);
    }

    onDrop(e) {
        e.preventDefault();
        const from = this.draggedSquare;
        const to = e.currentTarget;
        if (!from || from === to) return;

        const uci = `${files[from.dataset.file]}${parseInt(from.dataset.rank)+1}${files[to.dataset.file]}${parseInt(to.dataset.rank)+1}`;
        this.onMove(uci, from.dataset.piece);
        this.draggedSquare = null;
    }
}
