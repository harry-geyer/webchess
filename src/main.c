#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "game.h"
#include "fen.h"


static colour_t current_turn = COLOUR_WHITE;


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
    board_t* b = parse_fen(fen, &current_turn);
    game_set_board(b);
    destroy_board(b);
}


EMSCRIPTEN_KEEPALIVE
void get_fen(char* out_fen, int max_len)
{
    board_t* b = game_get_board();
    generate_fen(b, current_turn, out_fen, max_len);
    printf("getting fen: '%.*s'\n", max_len, out_fen);
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
void apply_move_uci(const char* uci)
{
    printf("move uci: '%s'\n", uci);
    board_t* b = game_get_board();
    move_t m = uci_to_move(b, uci);
    if (game_apply_move(m))
    {
        printf("successful move\n");
    }
    else
    {
        printf("failed move\n");
    }
}
