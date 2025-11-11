import { pieceGlyphs, files } from '../utils/constants.js';
import { FEN } from '../fen/fen.js';

export function getPieceChar(pieceSymbol) {
    return pieceGlyphs[pieceSymbol] || '';
}

export class Board {
    constructor(el, onMove) {
        this.el = el;
        this.onMove = onMove;
        this.draggedPieceEl = null;
        this.startSquare = null;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    create() {
        this.el.innerHTML = '';
        for (let r = 7; r >= 0; r--) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.classList.add('square', (r + f) % 2 === 0 ? 'white' : 'black');
                sq.dataset.rank = r;
                sq.dataset.file = f;

                if (r === 0) sq.dataset.fileLetter = 'abcdefgh'[f];
                if (f === 0) sq.dataset.rankNumber = (r + 1).toString();

                sq.addEventListener('pointerdown', e => this.onPointerDown(e));

                this.el.appendChild(sq);
            }
        }
    }

    render(fen) {
        const ranks = FEN.getRanks(fen);
        const squares = this.el.children;
        let idx = 0;

        for (const sq of squares) {
            sq.textContent = '';
            sq.removeAttribute('data-piece');
        }

        for (const rank of ranks) {
            for (const char of rank) {
                if (isNaN(char)) {
                    const glyph = getPieceChar(char);
                    const pieceEl = document.createElement('div');
                    pieceEl.classList.add('piece');
                    pieceEl.textContent = glyph;
                    pieceEl.dataset.piece = char;

                    squares[idx].appendChild(pieceEl);
                    squares[idx].dataset.piece = char;
                    idx++;
                } else {
                    idx += parseInt(char, 10);
                }
            }
        }
    }

    onPointerDown(e) {
        const pieceEl = e.target.closest('.piece');
        if (!pieceEl) return;

        this.startSquare = pieceEl.parentElement;
        const piece = pieceEl.dataset.piece;

        const ghost = document.createElement('div');
        ghost.classList.add('piece');
        ghost.textContent = getPieceChar(piece);

        ghost.style.position = 'absolute';
        ghost.style.zIndex = 1000;
        ghost.style.pointerEvents = 'none';
        ghost.style.fontSize = window.getComputedStyle(pieceEl).fontSize;
        ghost.style.fontFamily = '"Merida", Arial, sans-serif';
        ghost.style.lineHeight = '1';
        ghost.style.padding = '0';
        ghost.style.userSelect = 'none';
        ghost.style.color = piece === piece.toUpperCase() ? '#fff' : '#000';

        document.body.appendChild(ghost);
        this.draggedPieceEl = ghost;

        const rect = pieceEl.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        this.moveAt(e.clientX, e.clientY);

        const moveHandler = e => this.moveAt(e.clientX, e.clientY);
        const upHandler = e => this.onPointerUp(e, moveHandler, upHandler, piece);

        document.addEventListener('pointermove', moveHandler);
        document.addEventListener('pointerup', upHandler);
    }

    moveAt(clientX, clientY) {
        if (!this.draggedPieceEl) return;
        this.draggedPieceEl.style.left = clientX - this.offsetX + 'px';
        this.draggedPieceEl.style.top = clientY - this.offsetY + 'px';
    }

    onPointerUp(e, moveHandler, upHandler, piece) {
        document.removeEventListener('pointermove', moveHandler);
        document.removeEventListener('pointerup', upHandler);

        const targetSq = document.elementFromPoint(e.clientX, e.clientY)?.closest('.square');

        if (targetSq && targetSq !== this.startSquare) {
            const uci = `${files[this.startSquare.dataset.file]}${parseInt(this.startSquare.dataset.rank, 10)+1}${files[targetSq.dataset.file]}${parseInt(targetSq.dataset.rank, 10)+1}`;
            const valid = this.onMove(uci, piece);
        }

        if (this.draggedPieceEl) {
            this.draggedPieceEl.remove();
            this.draggedPieceEl = null;
        }

        this.startSquare = null;
    }
}
