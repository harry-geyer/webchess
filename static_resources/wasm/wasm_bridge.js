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
}
