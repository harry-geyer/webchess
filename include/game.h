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
void game_set_board(const board_t* b);
board_t* game_get_board(void);
move_t game_get_best_move(void);
bool game_apply_move(move_t m);
game_status_t game_get_status(void);
