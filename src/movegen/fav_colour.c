#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "board.h"
#include "move.h"
#include "game.h"
#include "rules.h"
#include "fen.h"
#include "util.h"


static bool tile_is_white(unsigned index, unsigned width)
{
    bool is_white = 0 == index % 2;
    is_white = 0 == (index / width) % 2 ? is_white : !is_white;
    return is_white;
}


static unsigned can_be_taken(board_t* board, colour_t turn, unsigned index)
{
    /* will return number of pieces that can take it */
    unsigned count = 0;
    for (unsigned i = 0; i < board->width * board->height; i++)
    {
        if (i == index)
            continue;
        piece_t* p = get_piece(board, i);
        if (turn == p->colour)
            continue;
        move_t m =
        {
            .from = i,
            .to = index,
            .promotion = PIECE_TYPE_EMPTY,
        };
        if (is_move_legal(board, &m))
            count++;
    }
    return count;
}


static unsigned can_move_be_taken(board_t* board, board_t* consider_board, colour_t turn, move_t* move)
{
    if (!copy_board(consider_board, board))
    {
        raise_error(ENOMEM, "failed to copy board\n"); /* exits here */
        return 0;
    }

    /* assume given move IS legal */

    piece_t* p = get_piece(consider_board, move->from);
    set_piece(consider_board, move->to, p);
    piece_t empty = { PIECE_TYPE_EMPTY, COLOUR_NONE };
    set_piece(consider_board, move->from, &empty);

    return can_be_taken(consider_board, turn, move->to);
}


static double gen_move_value(board_t* board, board_t* consider_board, colour_t turn, move_t* move)
{
    double value = 0.;
    piece_t* p = get_piece(board, move->from);

    bool from_white = tile_is_white(move->from, board->width);

    if (PIECE_TYPE_BISHOP == p->type
        && (COLOUR_WHITE == turn) == from_white)
    {
        /* is a bishop on the wrong colour square */
        value = 10000. * (double)can_move_be_taken(board, consider_board, turn, move);
        return value;
    }

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
    board_t* consider_board = duplicate_board(board);

    for (unsigned i = 0; i < num_moves; i++)
    {
        move_t* consider_move = &moves[i];
        double new_value = gen_move_value(board, consider_board, turn, consider_move);
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
    destroy_board(consider_board);

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
    unsigned max_legal_moves = config->height * config->width * 32;
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
