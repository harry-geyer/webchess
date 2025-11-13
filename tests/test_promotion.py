import pytest

import ctypes

from util import load_library, default_fen


move_set = [
    ("rnbqkbnr/ppp3Pp/8/3p4/8/8/PPP1PPPP/RNBQKBNR w", "g7h8q", "rnbqkbnQ/ppp4p/8/3p4/8/8/PPP1PPPP/RNBQKBNR b"),
    ("rnbqkbnr/ppp3Pp/8/3p4/8/8/PPP1PPPP/RNBQKBNR w", "g7h8b", "rnbqkbnB/ppp4p/8/3p4/8/8/PPP1PPPP/RNBQKBNR b"),
    ("rnbqkbnr/ppp3Pp/8/3p4/8/8/PPP1PPPP/RNBQKBNR w", "g7h8n", "rnbqkbnN/ppp4p/8/3p4/8/8/PPP1PPPP/RNBQKBNR b"),
    ("rnbqkbnr/ppp3Pp/8/3p4/8/8/PPP1PPPP/RNBQKBNR w", "g7h8r", "rnbqkbnR/ppp4p/8/3p4/8/8/PPP1PPPP/RNBQKBNR b"),
]


@pytest.mark.parametrize("start_fen,move,end_fen", move_set)
def test_promotion(start_fen, move, end_fen):
    mod = load_library()
    mod.init_game(8, 8)
    mod.set_fen(start_fen.encode())
    assert mod.apply_move_uci(move.encode()), f"move {move} is reported invalid"
    max_len = 128
    fen = (ctypes.c_char * max_len)()
    len_ = mod.get_fen(fen, max_len)
    assert len_, "not given fen back"
    assert fen.value.decode() == end_fen, "does not match end fen"
