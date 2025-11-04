#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "board.h"
#include "move.h"
#include "game.h"
#include "rules.h"


bool movegen_random_generator(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t* status)
{
    unsigned max_legal_moves = config->height * config->width * 10;
    move_t* legal_moves = malloc(sizeof(move_t) * max_legal_moves);
    int legal_count = 0;
    srand(time(NULL));

    for (int from = 0; from < board->width * board->height; from++)
    {
        piece_t* p = get_piece(board, from);
        if (p->colour != turn)
            continue;

        for (int to = 0; to < board->width * board->height; to++)
        {
            if (from == to)
                continue;

            move_t m;
            m.from = from;
            m.to = to;
            m.promotion = PIECE_TYPE_EMPTY;

            if (is_move_legal(board, &m))
            {
                memcpy(&legal_moves[legal_count++], &m, sizeof(move_t));
                if (legal_count >= max_legal_moves)
                    break;
            }
        }
    }

    if (legal_count == 0)
        return false;

    int random_index = rand() % legal_count;
    memcpy(move, &legal_moves[random_index], sizeof(move_t));
    free(legal_moves);
    return true;
}
