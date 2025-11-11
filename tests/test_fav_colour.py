import ctypes

from util import check_expected_move


def test_select_colour():
    fen = "r1b1k1n1/1p1n1p1r/p1p1p1p1/2Pq3p/2pQ3P/P1P1PPP1/1P1N3R/R1B1K1N1 w"
    check_expected_move("fav_colour", fen, "f3f4")

def test_sacrafice_bishop():
    fen = "rnbqkbnr/pppp1ppp/4p3/8/8/4P3/PPPP1PPP/RNBQKBNR w"
    check_expected_move("fav_colour", fen, "f1a6")
