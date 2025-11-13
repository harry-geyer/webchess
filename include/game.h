#pragma once

#include <stdbool.h>

#include "board.h"
#include "move.h"


typedef struct
{
    int width;
    int height;
    bool allow_custom_rules;
    bool enable_castling;
    bool enable_en_passant;
} game_config_t;

typedef enum
{
    STATUS_ONGOING,
    STATUS_CHECK,
    STATUS_CHECKMATE,
    STATUS_STALEMATE
} game_status_t;


void game_init(const game_config_t* cfg);
void game_set_board(const board_t* b, colour_t turn);
board_t* game_get_board(void);
bool game_get_best_move(move_t* m);
bool game_apply_move(move_t* m);
game_status_t game_get_status(void);
colour_t game_current_turn(void);
int game_get_available_moves(unsigned index, move_t* moves, unsigned max_moves);
