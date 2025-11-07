#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "board.h"
#include "move.h"
#include "game.h"
#include "rules.h"


static bool tile_is_white(unsigned index, unsigned width)
{
    bool is_white = 0 == index % 2;
    is_white = 0 == (index / width) % 2 ? is_white : !is_white;
    return is_white;
}


static double gen_move_value(board_t* board, colour_t turn, move_t* move)
{
    double value = 0.;
    bool from_white = tile_is_white(move->from, board->width);
    bool to_white = tile_is_white(move->to, board->width);
    if (COLOUR_WHITE == turn)
    {
        value = (3 * !!from_white - 1) + (2 * !to_white - 1);
    }
    else if (COLOUR_BLACK == turn)
    {
        value = (3 * !from_white - 1) + (2 * !!to_white - 1);
    }
    return value;
}


static move_t* select_move(board_t* board, colour_t turn, move_t* moves, unsigned num_moves)
{
    srand(time(NULL));

    unsigned* fav_moves_index = malloc(sizeof(unsigned) * num_moves);
    unsigned num_fav_moves = 0;

    double fav_move_value = 0.;

    for (unsigned i = 0; i < num_moves; i++)
    {
        move_t* consider_move = &moves[i];
        double new_value = gen_move_value(board, turn, consider_move);
        if (!num_fav_moves)
        {
            fav_moves_index[num_fav_moves++] = i;
            fav_move_value = new_value;
        }
        else if (new_value > fav_move_value)
        {
            num_fav_moves = 0;
            fav_moves_index[num_fav_moves++] = i;
            fav_move_value = new_value;
        }
        else if (new_value == fav_move_value)
        {
            fav_moves_index[num_fav_moves++] = i;
        }
    }

    if (!num_fav_moves)
    {
        /* no moves */
        return NULL;
    }

    /* from same weighted moves, select randomly */
    unsigned index_index = 0;
    if (num_fav_moves > 1)
    {
        index_index = rand() % num_fav_moves;
    }
    unsigned index = fav_moves_index[index_index];
    move_t* move = &moves[index];
    free(fav_moves_index);

    return move;
}


bool movegen_fav_colour_generator(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status)
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

    move_t* move_l_ptr = select_move(board, turn, legal_moves, legal_count);
    if (!move_l_ptr)
        return false;

    memcpy(move, move_l_ptr, sizeof(move_t));
    free(legal_moves);
    return true;
}
