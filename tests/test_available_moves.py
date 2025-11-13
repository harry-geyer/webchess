import pytest

import ctypes

from util import load_library, default_fen


move_set = [
    (default_fen, "a2", ("a2a3", "a2a4")),
    (default_fen, "b1", ("b1a3", "b1c3")),
    (default_fen, "b7", ("b7b6", "b7b5")),
]


@pytest.mark.parametrize("start_fen,piece,expected", move_set)
def test_available_moves(start_fen, piece, expected):
    mod = load_library()
    mod.init_game(8, 8)
    mod.set_fen(start_fen.encode())
    max_len = 128
    moves = (ctypes.c_char * max_len)()
    len_ = mod.get_available_moves_uci(piece.encode(), moves, max_len)
    move_set = set(moves.value.decode().split(","))
    missing_moves = move_set - set(expected)
    extra_moves = set(expected) - move_set
    assert len(missing_moves) == 0, f"Missing moves: {missing_moves}"
    assert len(extra_moves) == 0, f"Extra moves: {extra_moves}"
