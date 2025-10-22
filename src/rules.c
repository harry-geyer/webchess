#include <stdbool.h>
#include <stdlib.h>
#include <stdio.h>

#include "board.h"
#include "move.h"


static bool is_pawn_move_legal(board_t* board, move_t m, colour_t colour)
{
    int from_x = index_to_x(board, m.from);
    int from_y = index_to_y(board, m.from);
    int to_x   = index_to_x(board, m.to);
    int to_y   = index_to_y(board, m.to);
    int dx = to_x - from_x;
    int dy = to_y - from_y;
    int dir = (colour == COLOUR_WHITE) ? 1 : -1;
    piece_t target = board->squares[m.to];
    if (dx == 0 && dy == dir && target.type == PIECE_TYPE_EMPTY)
    {
        return true;
    }
    if (dx == 0 && dy == 2 * dir && target.type == PIECE_TYPE_EMPTY)
    {
        int start_rank = (colour == COLOUR_WHITE) ? 1 : 6;
        if (from_y == start_rank)
        {
            int intermediate_idx = coords_to_index(board, from_x, from_y + dir);
            if (board->squares[intermediate_idx].type == PIECE_TYPE_EMPTY)
            {
                return true;
            }
        }
    }
    if (abs(dx) == 1 && dy == dir && target.type != PIECE_TYPE_EMPTY && target.colour != colour)
    {
        return true;
    }
    return false;
}


bool is_bishop_move_legal(board_t* board, move_t m)
{
    int from_x = index_to_x(board, m.from);
    int from_y = index_to_y(board, m.from);
    int to_x   = index_to_x(board, m.to);
    int to_y   = index_to_y(board, m.to);
    int dx = to_x - from_x;
    int dy = to_y - from_y;
    if (abs(dx) != abs(dy))
    {
        return false;
    }
    int step_x = (dx > 0) ? 1 : -1;
    int step_y = (dy > 0) ? 1 : -1;
    int x = from_x + step_x;
    int y = from_y + step_y;
    while (x != to_x && y != to_y)
    {
        piece_t p = board->squares[coords_to_index(board, x, y)];
        if (p.type != PIECE_TYPE_EMPTY)
        {
            return false;
        }
        x += step_x;
        y += step_y;
    }
    piece_t target = board->squares[m.to];
    piece_t piece  = board->squares[m.from];
    if (target.colour == piece.colour)
    {
        return false;
    }
    return true;
}


bool is_rook_move_legal(board_t* board, move_t m)
{
    int from_x = index_to_x(board, m.from);
    int from_y = index_to_y(board, m.from);
    int to_x   = index_to_x(board, m.to);
    int to_y   = index_to_y(board, m.to);
    if (from_x != to_x && from_y != to_y)
    {
        return false;
    }
    int dx = (to_x > from_x) ? 1 : (to_x < from_x) ? -1 : 0;
    int dy = (to_y > from_y) ? 1 : (to_y < from_y) ? -1 : 0;
    int x = from_x + dx;
    int y = from_y + dy;
    while (x != to_x || y != to_y)
    {
        piece_t p = board->squares[coords_to_index(board, x, y)];
        if (p.type != PIECE_TYPE_EMPTY)
        {
            return false;
        }
        x += dx;
        y += dy;
    }
    piece_t target = board->squares[m.to];
    piece_t piece  = board->squares[m.from];

    if (target.colour == piece.colour)
    {
        return false;
    }
    return true;
}


static bool is_knight_move_legal(board_t* board, move_t m)
{
    int from_x = index_to_x(board, m.from);
    int from_y = index_to_y(board, m.from);
    int to_x   = index_to_x(board, m.to);
    int to_y   = index_to_y(board, m.to);
    int dx = abs(to_x - from_x);
    int dy = abs(to_y - from_y);
    return (dx == 1 && dy == 2) || (dx == 2 && dy == 1);
}


bool is_queen_move_legal(board_t* board, move_t m)
{
    return is_rook_move_legal(board, m) || is_bishop_move_legal(board, m);
}


bool is_king_move_legal(board_t* board, move_t m)
{
    int from_x = index_to_x(board, m.from);
    int from_y = index_to_y(board, m.from);
    int to_x   = index_to_x(board, m.to);
    int to_y   = index_to_y(board, m.to);

    int dx = abs(to_x - from_x);
    int dy = abs(to_y - from_y);

    piece_t target = board->squares[m.to];
    piece_t piece  = board->squares[m.from];

    if (target.colour == piece.colour)
    {
        return false;
    }
    if (dx <= 1 && dy <= 1)
    {
        return true;
    }
    if (dx == 2 && dy == 0)
    {
        bool king_side = (to_x > from_x);
        int rook_from_x = king_side ? board->width - 1 : 0;
        int rook_from = coords_to_index(board, rook_from_x, from_y);
        piece_t rook = board->squares[rook_from];
        if (rook.type != PIECE_TYPE_ROOK || rook.colour != piece.colour)
        {
            return false;
        }
        int step = king_side ? 1 : -1;
        for (int x = from_x + step; x != rook_from_x; x += step)
        {
            piece_t p = board->squares[coords_to_index(board, x, from_y)];
            if (p.type != PIECE_TYPE_EMPTY)
            {
                return false;
            }
        }
        return true;
    }
    return false;
}


bool is_move_legal(board_t* board, move_t m)
{
    piece_t p = board->squares[m.from];
    piece_t target = board->squares[m.to];

    if (m.from == m.to)
    {
        printf("no move\n");
        return false;
    }
    if (target.colour == p.colour)
    {
        printf("can't move ontop of own piece\n");
        return false;
    }
    switch (p.type)
    {
        case PIECE_TYPE_PAWN:
            return is_pawn_move_legal(board, m, p.colour);
        case PIECE_TYPE_ROOK:
            return is_rook_move_legal(board, m);
        case PIECE_TYPE_BISHOP:
            return is_bishop_move_legal(board, m);
        case PIECE_TYPE_KNIGHT:
            return is_knight_move_legal(board, m);
        case PIECE_TYPE_QUEEN:
            return is_queen_move_legal(board, m);
        case PIECE_TYPE_KING:
            return is_king_move_legal(board, m);
        default:
            break;
    }
    printf("invalid piece type\n");
    return false;
}

