#include <stdlib.h>

#include "board.h"


board_t* create_board(int width, int height)
{
    board_t* b = malloc(sizeof(board_t));
    b->width = width;
    b->height = height;
    b->squares = calloc(width * height, sizeof(piece_t));
    return b;
}


void destroy_board(board_t* b)
{
    if (!b)
        return;
    free(b->squares);
    free(b);
}


piece_t get_piece(const board_t* b, int index)
{
    return b->squares[index];
}


void set_piece(board_t* b, int index, piece_t p)
{
    b->squares[index] = p;
}


void clear_board(board_t* b)
{
    int size = b->width * b->height;
    for (int i = 0; i < size; i++)
    {
        b->squares[i].type = PIECE_TYPE_EMPTY;
        b->squares[i].colour = COLOUR_NONE;
    }
}
