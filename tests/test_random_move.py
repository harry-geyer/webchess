import ctypes

from util import check_expected_move


default_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


def test_move_gen():
    check_expected_move("random", default_fen)
