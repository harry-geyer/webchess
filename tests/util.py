import os
import ctypes
import enum


default_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w"


class STATUS(enum.Enum):
    ONGOING = 0
    CHECK = 1
    CHECKMATE = 2
    STALEMATE = 3


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

def check_status(fen):
    mod = load_library()
    mod.init_game(8, 8)
    mod.set_fen(fen.encode())
    max_len = 128
    fen_r = (ctypes.c_char * max_len)()
    len_ = mod.get_fen(fen_r, max_len)
    assert len_, "not given fen back"
    assert fen_r.value.decode() == fen, "does not match set fen"

    status_enum = mod.get_status()
    return STATUS(status_enum)
