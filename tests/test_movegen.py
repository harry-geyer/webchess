import ctypes

from util import load_library


def test_move_gen():
    mod = load_library()
    list_len = 16
    row_len = 128
    max_len = list_len * row_len
    generator_buf = (ctypes.c_char * max_len)()
    num_generators = mod.get_movegen_list(generator_buf, list_len, row_len)
    assert num_generators, "No generators returned"
    expected_generators = [
            "random",
            "fav_colour",
        ]
    generator_list = generator_buf.value.decode().split(" ")
    assert set(expected_generators) - set(generator_list), "missing expected generators"
    for gen in generator_list:
        assert mod.set_movegen(gen.encode()), f"failed setting generator: {gen}"
        mod.get_movegen_name.restype = ctypes.c_char_p
        assert mod.get_movegen_name() == gen.encode(), f"after setting gen to {gen}, didn't stick"
