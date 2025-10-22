export class FEN {
    static getActiveColour(fen) {
        if (!fen) throw new Error("FEN string is required");
        const parts = fen.split(' ');
        if (parts.length < 2) throw new Error("Invalid FEN format");
        const colour = parts[1];
        if (colour !== 'w' && colour !== 'b') throw new Error("Invalid active colour in FEN");
        return colour;
    }

    static getBoardPart(fen) {
        return fen.split(' ')[0];
    }

    static getRanks(fen) {
        return this.getBoardPart(fen).split('/');
    }

    static getSquareMap(fen) {
        const files = ['a','b','c','d','e','f','g','h'];
        const ranks = this.getRanks(fen);
        const squareMap = {};
        for (let r = 0; r < 8; r++) {
            let fIdx = 0;
            for (const char of ranks[r]) {
                if (isNaN(char)) {
                    const square = files[fIdx] + (8 - r);
                    squareMap[square] = char;
                    fIdx++;
                } else {
                    fIdx += parseInt(char);
                }
            }
        }
        return squareMap;
    }

    static isStartingPosition(fen) {
        const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        return fen === defaultFen;
    }
}
