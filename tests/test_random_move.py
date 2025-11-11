import ctypes

from util import check_expected_move, default_fen


def test_move_gen():
    check_expected_move("random", default_fen)
