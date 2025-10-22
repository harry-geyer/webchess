#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "game.h"
#include "fen.h"


EMSCRIPTEN_KEEPALIVE
void init_game(int width, int height)
{
    printf("initialising game\n");
    game_config_t cfg = {width, height, true, true, true};
    game_init(&cfg);
}


EMSCRIPTEN_KEEPALIVE
void set_fen(const char* fen)
{
    printf("setting fen: '%s'\n", fen);
    colour_t turn = COLOUR_NONE;
    board_t* b = parse_fen(fen, &turn);
    game_set_board(b, turn);
    destroy_board(b);
}


EMSCRIPTEN_KEEPALIVE
int get_fen(char* out_fen, int max_len)
{
    board_t* b = game_get_board();
    colour_t turn = game_current_turn();
    int len = generate_fen(b, turn, out_fen, max_len);
    printf("getting fen: '%.*s'\n", max_len, out_fen);
    return len;
}


EMSCRIPTEN_KEEPALIVE
void get_best_move(char* out_uci, int max_len)
{
    move_t m = game_get_best_move();
    move_to_uci(m, out_uci, max_len);
    printf("getting best move: %.*s\n", max_len, out_uci);
}


EMSCRIPTEN_KEEPALIVE
int get_status(void)
{
    printf("getting status\n");
    return (int)game_get_status();
}


EMSCRIPTEN_KEEPALIVE
bool apply_move_uci(const char* uci)
{
    printf("move uci: '%s'\n", uci);
    board_t* b = game_get_board();
    move_t m = uci_to_move(b, uci);
    if (!game_apply_move(m))
    {
        return false;
    }
    return true;
}
