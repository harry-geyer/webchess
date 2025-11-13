#pragma once

#include <stdbool.h>

#include "board.h"
#include "move.h"


bool is_pawn_last_rank(board_t* board, move_t* m, colour_t colour);
bool is_move_legal(board_t* board, move_t* m);
bool is_in_check(board_t* board, colour_t colour);
int generate_moves(board_t* board, unsigned index, bool in_check, move_t* moves, int max_moves);
bool generate_all_moves(board_t* board, colour_t colour, bool in_check, move_t* moves, int max_moves, int* move_count);
bool would_move_release_check(board_t* board, move_t* m);
bool has_legal_moves(board_t* board, colour_t colour);
