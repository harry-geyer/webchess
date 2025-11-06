#pragma once

#include <stdbool.h>

#include "board.h"
#include "move.h"
#include "game.h"


bool movegen_random_generator(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status);
