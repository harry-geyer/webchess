#include <stdlib.h>
#include <string.h>

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


bool copy_board(board_t* new_b, board_t* b)
{
    if (new_b->height != b->height
        || new_b->width != b->width)
    {
        return false;
    }
    unsigned mem_squares_size = sizeof(piece_t) * new_b->height * new_b->width;
    memcpy(new_b->squares, b->squares, mem_squares_size);
    return true;
}


board_t* duplicate_board(board_t* b)
{
    board_t* board = malloc(sizeof(board_t));
    board->height = b->height;
    board->width = b->width;
    unsigned mem_squares_size = sizeof(piece_t) * board->height * board->width;
    board->squares = malloc(mem_squares_size);
    memcpy(board->squares, b->squares, mem_squares_size);
    return board;
}


piece_t* get_piece(const board_t* b, int index)
{
    return &b->squares[index];
}


void set_piece(board_t* b, int index, piece_t* p)
{
    memcpy(&b->squares[index], p, sizeof(piece_t));
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
