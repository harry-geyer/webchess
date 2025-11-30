import pytest

def pytest_html_report_title(report):
    report.title = "Webchess"

@pytest.fixture
def order():
    return [
            "test_status",
            "test_available_moves",
            "test_apply_move",
            "test_promotion",
            "test_movegen",
            "test_random",
            "test_fav_colour",
        ]
