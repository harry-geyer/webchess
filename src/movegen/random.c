#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "board.h"
#include "move.h"
#include "game.h"
#include "rules.h"


bool movegen_random_generator(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status)
{
    unsigned max_legal_moves = config->height * config->width * 10;
    move_t* legal_moves = malloc(sizeof(move_t) * max_legal_moves);
    int legal_count = 0;
    if (!generate_all_moves(board, turn, STATUS_CHECK == status, legal_moves, max_legal_moves, &legal_count))
    {
        return false;
    }

    if (legal_count == 0)
        return false;

    srand(time(NULL));
    int random_index = rand() % legal_count;
    memcpy(move, &legal_moves[random_index], sizeof(move_t));
    free(legal_moves);
    return true;
}
