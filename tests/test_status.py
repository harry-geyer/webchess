import pytest

from util import STATUS, check_status, default_fen


ongoing_fens = [
        default_fen,
    ]

check_fens = [
        "4k3/4q3/8/8/8/8/8/4K3 w",
        "4k3/8/8/8/8/8/4Q3/4K3 b",
    ]

stalemate_fens = [
        "4k3/8/8/8/8/1q6/8/K7 w",
        "7k/8/6Q1/8/8/8/8/4K3 b",
    ]

checkmate_fens = [
        "4k3/8/8/8/8/1q6/2n5/K7 w",
        "7k/5N2/6Q1/8/8/8/8/4K3 b",
        "rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w",  # fool's mate
        "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b"  # scholar's mate
    ]


@pytest.mark.parametrize("fen", ongoing_fens)
def test_ongoing(fen):
    assert STATUS.ONGOING == check_status(fen), "status should be ongoing"

@pytest.mark.parametrize("fen", check_fens)
def test_check(fen):
    assert STATUS.CHECK == check_status(fen), "status should be check"

@pytest.mark.parametrize("fen", stalemate_fens)
def test_stalemate(fen):
    assert STATUS.STALEMATE == check_status(fen), "status should be stalemate"

@pytest.mark.parametrize("fen", checkmate_fens)
def test_checkmate(fen):
    assert STATUS.CHECKMATE == check_status(fen), "status should be checkmate"
