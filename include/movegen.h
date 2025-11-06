#pragma once

#include <stdbool.h>

#include "board.h"
#include "move.h"
#include "game.h"


typedef struct
{
    const char name[128];
    bool (*generator)(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status);
} movegen_t;


bool movegen_get_move(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status);
int movegen_list(char** list, unsigned list_len, unsigned row_len);
bool movegen_set(const char* name);
const char* movegen_get(void);
