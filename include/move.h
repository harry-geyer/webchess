#pragma once

#include "board.h"


typedef struct
{
    int from;
    int to;
    piece_type_t promotion;
} move_t;


static inline int index_to_x(board_t* board, int idx)
{
    return idx % board->width;
}


static inline int index_to_y(board_t* board, int idx)
{
    return board->height - 1 - (idx / board->width);
}


static inline int coords_to_index(board_t* board, int x, int y)
{
    return (board->height - 1 - y) * board->width + x;
}
