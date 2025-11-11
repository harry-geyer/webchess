import os
import ctypes


def load_library():
    path = os.path.join(os.getenv("BUILD_TESTS_DIR", "build/tests"), "chess.so")
    lib_blob = ctypes.CDLL(path)
    assert lib_blob, f"library missing at {path}"
    return lib_blob


def check_expected_move(movegen, fen, expected_uci=None):
    mod = load_library()
    mod.init_game(8, 8)
    mod.set_fen(fen.encode())
    mod.set_movegen(movegen.encode())
    max_len = 10
    uci = (ctypes.c_char * max_len)()
    len_ = mod.get_best_move(uci, max_len)
    assert len_, "not written move"
    if expected_uci:
        assert uci.value == expected_uci.encode(), f"given unexpected move: {uci.value.decode()} not {expected_uci}"
