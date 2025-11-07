import { pieceGlyphs, files } from '../utils/constants.js';
import { FEN } from '../fen/fen.js';

export function getPieceChar(pieceSymbol) {
    return pieceGlyphs[pieceSymbol] || '';
}

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

                if (r === 0) {
                    sq.dataset.fileLetter = 'abcdefgh'[f];
                }

                if (f === 0) {
                    sq.dataset.rankNumber = (r + 1).toString();
                }

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
                    const glyph = getPieceChar(char);
                    squares[idx].innerHTML = '';
                    const pieceEl = document.createElement('div');
                    pieceEl.classList.add('piece');
                    pieceEl.textContent = glyph;
                    pieceEl.dataset.piece = char;
                    squares[idx].appendChild(pieceEl);

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
        ghost.textContent = getPieceChar(piece);
        ghost.style.fontSize = '44px';
        ghost.style.fontFamily = '"Merida", Arial, sans-serif';
        ghost.style.color = piece === piece.toUpperCase() ? '#fff' : '#000';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        ghost.style.background = 'transparent';
        ghost.style.pointerEvents = 'none';
        ghost.style.lineHeight = '1';
        ghost.style.padding = '0';

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
