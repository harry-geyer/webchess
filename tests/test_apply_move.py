import ctypes

import pytest

from util import STATUS, load_library, default_fen, fools_mate_fen, scholars_mate_fen


move_set = [
        (default_fen, ("a2a4", "a7a5"), "rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w", STATUS.ONGOING),
        (default_fen, ("f2f3", "e7e6", "g2g4", "d8h4"), fools_mate_fen, STATUS.CHECKMATE),
        (default_fen, ("e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"), scholars_mate_fen, STATUS.CHECKMATE),
    ]

@pytest.mark.parametrize("start_fen,moves,end_fen,status", move_set)
def test_move(start_fen, moves, end_fen, status):
    mod = load_library()
    mod.init_game(8, 8)
    mod.set_fen(start_fen.encode())
    for m in moves:
        assert mod.apply_move_uci(m.encode()), f"move {m} is reported invalid"
    max_len = 128
    fen = (ctypes.c_char * max_len)()
    len_ = mod.get_fen(fen, max_len)
    assert len_, "not given fen back"
    assert fen.value.decode() == end_fen, "does not match end fen"
    status_enum = mod.get_status()
    assert STATUS(status_enum) == status, "doesn't end with the correct status"
