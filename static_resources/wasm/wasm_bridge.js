export class WasmBridge {
    constructor() {
        this.Module = null;
    }

    async init() {
        return new Promise(resolve => {
            const script = document.createElement('script');
            script.src = 'chess.js';
            script.onload = () => {
                new App().then(Module => {
                    this.Module = Module;
                    Module.ccall('init_game', null, ['number','number'], [8,8]);
                    resolve(this);
                });
            };
            document.body.appendChild(script);
        });
    }

    getFEN() {
        const len = 128;
        const ptr = this.Module._malloc(len);
        const used_len = this.Module.ccall('get_fen', 'number', ['number', 'number'], [ptr, len]);
        const fenBuf = new Uint8Array(this.Module.HEAPU8.subarray(ptr, ptr + used_len));
        const fen = String.fromCharCode(...fenBuf).replace(/\0/g, '');
        this.Module._free(ptr);
        return fen;
    }

    setFEN(fen) {
        this.Module.ccall('set_fen', null, ['string'], [fen]);
    }

    applyMove(uci) {
        return this.Module.ccall('apply_move_uci', 'number', ['string'], [uci]);
    }

    getStatusText(code) {
        switch (code) {
            case 0: return 'Ongoing';
            case 1: return 'Check';
            case 2: return 'Checkmate';
            case 3: return 'Stalemate';
            default: return 'Unknown';
        }
    }

    getStatus() {
        return this.getStatusText(this.Module.ccall('get_status','number',[],[]));
    }

    reset(defaultFEN) {
        this.Module.ccall('init_game', null, ['number','number'], [8,8]);
        this.setFEN(defaultFEN);
    }

    getMovegenList() {
        const listLen = 16;
        const rowLen = 128;
        const bufSize = listLen * rowLen;
        const ptr = this.Module._malloc(bufSize);
        const count = this.Module.ccall('get_movegen_list', 'number', ['number', 'number', 'number'], [ptr, listLen, rowLen]);
        let names = [];
        for (let i = 0; i < count; i++) {
            const nameArr = new Uint8Array(this.Module.HEAPU8.subarray(ptr + i * rowLen, ptr + (i + 1) * rowLen));
            const name = String.fromCharCode(...nameArr).replace(/\0/g, '');
            if (name) names.push(name);
        }
        this.Module._free(ptr);
        return names;
    }

    setMovegen(name) {
        return !!this.Module.ccall('set_movegen', 'number', ['string'], [name]);
    }

    getMovegenName() {
        const ptr = this.Module.ccall('get_movegen_name', 'string', [], []);
        return ptr || '';
    }

    getBestMove() {
        const len = 8;
        const ptr = this.Module._malloc(len);
        const used_len = this.Module.ccall('get_best_move', 'number', ['number', 'number'], [ptr, len]);
        console.log(ptr);
        const moveBuf = new Uint8Array(this.Module.HEAPU8.subarray(ptr, ptr + used_len));
        console.log(moveBuf);
        const moveStr = String.fromCharCode(...moveBuf).replace(/\0/g, '');
        console.log(moveStr);
        this.Module._free(ptr);
        return moveStr;
    }
}
