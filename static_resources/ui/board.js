import { pieceGlyphs, files } from '../utils/constants.js';
import { FEN } from '../fen/fen.js';

export function getPieceChar(pieceSymbol) {
    return pieceGlyphs[pieceSymbol] || '';
}

export class Board {
    constructor(el, onMove, getTurn, getMovesFor) {
        this.el = el;
        this.onMove = onMove;
        this.getMovesFor = (typeof getMovesFor === 'function') ? getMovesFor : null;

        this.draggedPieceEl = null;
        this.startSquare = null;
        this.offsetX = 0;
        this.offsetY = 0;

        this._pointerDownX = 0;
        this._pointerDownY = 0;
        this._moved = false;
        this._moveThreshold = 8;

        this._selectedSquare = null;

        if (!getTurn) {
            this.getTurn = () => null;
        } else if (typeof getTurn === 'function') {
            this.getTurn = () => {
                const v = getTurn();
                if (v === 'w' || v === 'b') return v;
                if (v === true || v === 'white' || v === 'W') return 'w';
                if (v === false || v === 'black' || v === 'B') return 'b';
                return null;
            };
        } else if (typeof getTurn === 'object' && typeof getTurn.getTurn === 'function') {
            this.getTurn = () => {
                const v = getTurn.getTurn();
                if (v === 'w' || v === 'b') return v;
                if (v === true || v === 'white' || v === 'W') return 'w';
                if (v === false || v === 'black' || v === 'B') return 'b';
                return null;
            };
        } else {
            this.getTurn = () => null;
        }
    }

    create() {
        this.el.innerHTML = '';
        for (let r = 7; r >= 0; r--) {
            for (let f = 0; f < 8; f++) {
                const sq = document.createElement('div');
                sq.classList.add('square', (r + f) % 2 === 0 ? 'white' : 'black');
                sq.dataset.rank = r.toString();
                sq.dataset.file = f.toString();

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
            const hints = sq.querySelectorAll('.hint, .hint-dot, .hint-capture, .hint-wrapper');
            hints.forEach(h => h.remove());
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
        const targetSq = e.target.closest('.square');

        if (!pieceEl) {
            this.clearHighlights();
            return;
        }

        this._pointerDownX = e.clientX;
        this._pointerDownY = e.clientY;
        this._moved = false;

        this.startSquare = pieceEl.parentElement;
        const piece = pieceEl.dataset.piece;
        const pieceIsWhite = piece === piece.toUpperCase();
        const turn = this.getTurn();
        if (turn && (turn === 'w') !== pieceIsWhite) {
            pieceEl.classList.add('deny-pick');
            setTimeout(() => pieceEl.classList.remove('deny-pick'), 200);
            this.startSquare = null;
            return;
        }

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
        ghost.style.color = pieceIsWhite ? '#fff' : '#000';
        document.body.appendChild(ghost);
        this.draggedPieceEl = ghost;

        const rect = pieceEl.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;
        this.moveAt(e.clientX, e.clientY);

        if (this.getMovesFor) {
            const fileIdx = parseInt(this.startSquare.dataset.file, 10);
            const rankIdx = parseInt(this.startSquare.dataset.rank, 10);
            const pos = `${files[fileIdx]}${rankIdx + 1}`;
            try {
                const moves = this.getMovesFor(pos) || [];
                this.highlightMoves(moves);
            } catch (err) {
                console.error('getMovesFor threw:', err);
            }
        }

        const moveHandler = ev => {
            const dx = ev.clientX - this._pointerDownX;
            const dy = ev.clientY - this._pointerDownY;
            if (!this._moved && Math.hypot(dx, dy) > this._moveThreshold) this._moved = true;
            this.moveAt(ev.clientX, ev.clientY);
        };
        const upHandler = ev => this.onPointerUp(ev, moveHandler, upHandler, piece);

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

        if (this.startSquare && targetSq === this.startSquare && !this._moved) {
            if (this._selectedSquare === this.startSquare) {
                this.clearHighlights();
            } else if (this.getMovesFor) {
                const fileIdx = parseInt(this.startSquare.dataset.file, 10);
                const rankIdx = parseInt(this.startSquare.dataset.rank, 10);
                const pos = `${files[fileIdx]}${rankIdx + 1}`;
                try {
                    const moves = this.getMovesFor(pos) || [];
                    this.highlightMoves(moves);
                    this._selectedSquare = this.startSquare; // now mark as selected (click confirmed)
                } catch (err) {
                    console.error('getMovesFor threw:', err);
                }
            }
        }
        else if (targetSq && targetSq !== this.startSquare) {
            const uci = `${files[this.startSquare.dataset.file]}${parseInt(this.startSquare.dataset.rank, 10)+1}${files[targetSq.dataset.file]}${parseInt(targetSq.dataset.rank, 10)+1}`;
            try {
                this.onMove(uci, piece);
            } catch (err) {
                console.error('onMove callback error:', err);
            }
        }
        else if (targetSq && !targetSq.querySelector('.piece')) {
            this.clearHighlights();
        }

        if (this.draggedPieceEl) {
            this.draggedPieceEl.remove();
            this.draggedPieceEl = null;
        }

        this.startSquare = null;
        this._moved = false;
    }

    clearHighlights() {
        const hints = this.el.querySelectorAll('.square .hint-wrapper');
        hints.forEach(h => h.remove());
        this._selectedSquare = null;
    }

    highlightMoves(moves = []) {
        this.clearHighlights();

        for (const mv of moves) {
            if (!mv || mv.length < 4) continue;
            const dst = mv.slice(2, 4);
            const fileLetter = dst[0];
            const rankChar = dst[1];

            const fileIdx = files.indexOf(fileLetter);
            const rankIdx = parseInt(rankChar, 10) - 1;
            if (fileIdx < 0 || isNaN(rankIdx) || rankIdx < 0 || rankIdx > 7) continue;

            const sq = this.el.querySelector(`.square[data-file="${fileIdx}"][data-rank="${rankIdx}"]`);
            if (!sq) continue;

            const wrapper = document.createElement('div');
            wrapper.classList.add('hint-wrapper');

            if (sq.dataset.piece) {
                const cap = document.createElement('div');
                cap.classList.add('hint-capture');
                ['tl','tr','bl','br'].forEach(cn => {
                    const sp = document.createElement('span');
                    sp.classList.add('corner', cn);
                    cap.appendChild(sp);
                });
                wrapper.appendChild(cap);
            } else {
                const dot = document.createElement('div');
                dot.classList.add('hint-dot');
                wrapper.appendChild(dot);
            }

            sq.appendChild(wrapper);
        }
    }
}
