export const GameState = {
    save({ fen, moveHistory, capturedWhite, capturedBlack, previousFEN, moveGen }) {
        localStorage.setItem('chessGameState', JSON.stringify({
            fen, moveHistory, capturedWhite, capturedBlack, previousFEN, moveGen, timestamp: Date.now()
        }));
    },
    load() {
        const data = localStorage.getItem('chessGameState');
        if (!data) return null;
        try { return JSON.parse(data); } catch { return null; }
    }
};
