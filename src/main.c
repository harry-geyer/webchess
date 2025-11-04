#include <stdio.h>
#include <string.h>
#include <emscripten.h>

#include "game.h"
#include "fen.h"
#include "movegen.h"


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
int get_best_move(char* out_uci, int max_len)
{
    board_t* b = game_get_board();
    move_t m;
    if (!game_get_best_move(&m))
    {
        printf("failed to get best move\n");
        return 0;
    }
    int len = move_to_uci(b, &m, out_uci, max_len);
    printf("getting best move: %.*s\n", len, out_uci);
    return len;
}


EMSCRIPTEN_KEEPALIVE
int get_movegen_list(char* buffer, unsigned list_len, unsigned row_len)
{
    int len = movegen_list(&buffer, list_len, row_len);
    printf("getting movegen list:");
    for (unsigned i = 0; i < len; i++)
    {
        printf("%s ", &buffer[i * row_len]);
    }
    printf("\n");
    return len;
}


EMSCRIPTEN_KEEPALIVE
bool set_movegen(const char* name)
{
    printf("setting movegen name: %s\n", name);
    return movegen_set(name);
}


EMSCRIPTEN_KEEPALIVE
const char* get_movegen_name(void)
{
    const char* name = movegen_get();
    printf("getting movegen name: %s\n", name);
    return name;
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
    if (!game_apply_move(&m))
    {
        return false;
    }
    return true;
}
