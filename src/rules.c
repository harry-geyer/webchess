#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "board.h"
#include "move.h"
#include "util.h"


static bool is_pawn_last_rank(board_t* board, move_t* m)
{
    piece_t* p = get_piece(board, m->from);
    if (PIECE_TYPE_PAWN != p->type)
        return false;
    int to_y = index_to_y(board, m->to);
    int last_rank = (p->colour == COLOUR_WHITE) ? board->height - 1 : 0;
    return to_y == last_rank;
}


static bool is_pawn_move_legal(board_t* board, move_t* m, colour_t colour)
{
    int from_x = index_to_x(board, m->from);
    int from_y = index_to_y(board, m->from);
    int to_x   = index_to_x(board, m->to);
    int to_y   = index_to_y(board, m->to);
    int dx = to_x - from_x;
    int dy = to_y - from_y;
    int dir = (colour == COLOUR_WHITE) ? 1 : -1;
    if (is_pawn_last_rank(board, m)
        && (m->promotion == PIECE_TYPE_EMPTY
            || m->promotion == PIECE_TYPE_PAWN
            || m->promotion == PIECE_TYPE_KING))
    {
        return false;
    }
    piece_t* target = get_piece(board, m->to);
    if (dx == 0 && dy == dir && target->type == PIECE_TYPE_EMPTY)
    {
        return true;
    }
    if (dx == 0 && dy == 2 * dir && target->type == PIECE_TYPE_EMPTY)
    {
        int start_rank = (colour == COLOUR_WHITE) ? 1 : board->height - 2;
        if (from_y == start_rank)
        {
            int intermediate_idx = coords_to_index(board, from_x, from_y + dir);
            if (board->squares[intermediate_idx].type == PIECE_TYPE_EMPTY)
            {
                return true;
            }
        }
    }
    if (abs(dx) == 1 && dy == dir && target->type != PIECE_TYPE_EMPTY && target->colour != colour)
    {
        return true;
    }
    return false;
}


static bool is_bishop_move_legal(board_t* board, move_t* m)
{
    int from_x = index_to_x(board, m->from);
    int from_y = index_to_y(board, m->from);
    int to_x   = index_to_x(board, m->to);
    int to_y   = index_to_y(board, m->to);
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
        piece_t* p = get_piece(board, coords_to_index(board, x, y));
        if (p->type != PIECE_TYPE_EMPTY)
        {
            return false;
        }
        x += step_x;
        y += step_y;
    }
    piece_t* target = get_piece(board, m->to);
    piece_t* piece = get_piece(board, m->from);
    if (target->colour == piece->colour)
    {
        return false;
    }
    return true;
}


static bool is_rook_move_legal(board_t* board, move_t* m)
{
    int from_x = index_to_x(board, m->from);
    int from_y = index_to_y(board, m->from);
    int to_x   = index_to_x(board, m->to);
    int to_y   = index_to_y(board, m->to);
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
        piece_t* p = get_piece(board, coords_to_index(board, x, y));
        if (p->type != PIECE_TYPE_EMPTY)
        {
            return false;
        }
        x += dx;
        y += dy;
    }
    piece_t* target = get_piece(board, m->to);
    piece_t* piece = get_piece(board, m->from);

    if (target->colour == piece->colour)
    {
        return false;
    }
    return true;
}


static bool is_knight_move_legal(board_t* board, move_t* m)
{
    int from_x = index_to_x(board, m->from);
    int from_y = index_to_y(board, m->from);
    int to_x   = index_to_x(board, m->to);
    int to_y   = index_to_y(board, m->to);
    int dx = abs(to_x - from_x);
    int dy = abs(to_y - from_y);
    return (dx == 1 && dy == 2) || (dx == 2 && dy == 1);
}


static bool is_queen_move_legal(board_t* board, move_t* m)
{
    return is_rook_move_legal(board, m) || is_bishop_move_legal(board, m);
}


static bool is_king_move_legal(board_t* board, move_t* m)
{
    int from_x = index_to_x(board, m->from);
    int from_y = index_to_y(board, m->from);
    int to_x   = index_to_x(board, m->to);
    int to_y   = index_to_y(board, m->to);

    int dx = abs(to_x - from_x);
    int dy = abs(to_y - from_y);

    piece_t* target = get_piece(board, m->to);
    piece_t* piece = get_piece(board, m->from);

    if (target->colour == piece->colour)
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
        piece_t* rook = get_piece(board, rook_from);
        if (rook->type != PIECE_TYPE_ROOK || rook->colour != piece->colour)
        {
            return false;
        }
        int step = king_side ? 1 : -1;
        for (int x = from_x + step; x != rook_from_x; x += step)
        {
            piece_t* p = get_piece(board, coords_to_index(board, x, from_y));
            if (p->type != PIECE_TYPE_EMPTY)
            {
                return false;
            }
        }
        return true;
    }
    return false;
}


bool is_move_legal(board_t* board, move_t* m)
{
    piece_t* p = get_piece(board, m->from);
    piece_t* target = get_piece(board, m->to);

    if (m->from == m->to)
    {
        return false;
    }
    if (target->colour == p->colour)
    {
        return false;
    }
    switch (p->type)
    {
        case PIECE_TYPE_PAWN:
            return is_pawn_move_legal(board, m, p->colour);
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
    return false;
}


static bool is_square_attacked(board_t* board, int sq_index, colour_t by_colour)
{
    for (int i = 0; i < board->width * board->height; i++)
    {
        piece_t* p = get_piece(board, i);
        if (p->type == PIECE_TYPE_EMPTY || p->colour != by_colour)
            continue;

        move_t m = { .from = i, .to = sq_index, .promotion = PIECE_TYPE_EMPTY };
        if (is_move_legal(board, &m))
            return true;
    }
    return false;
}


int find_king(board_t* board, colour_t colour)
{
    for (int i = 0; i < board->width * board->height; i++)
    {
        piece_t* p = get_piece(board, i);
        if (p->type == PIECE_TYPE_KING && p->colour == colour)
            return i;
    }
    return -1;
}


bool is_in_check(board_t* board, colour_t colour)
{
    int king_sq = find_king(board, colour);
    if (king_sq < 0)
        return false;
    return is_square_attacked(board, king_sq, (colour == COLOUR_WHITE) ? COLOUR_BLACK : COLOUR_WHITE);
}


bool would_move_release_check(board_t* board, board_t* consider_board, move_t* m)
{
    if (!copy_board(consider_board, board))
    {
        raise_error(ENOMEM, "failed to copy board\n"); /* exits here */
        return false;
    }

    piece_t* p = get_piece(board, m->from);
    set_piece(consider_board, m->to, p);
    piece_t empty = { PIECE_TYPE_EMPTY, COLOUR_NONE };
    set_piece(consider_board, m->from, &empty);

    colour_t colour = consider_board->squares[m->to].colour;
    bool in_check = is_in_check(consider_board, colour);
    return !in_check;
}


int generate_moves(board_t* board, unsigned index, bool in_check, move_t* moves, int max_moves)
{
    if (0 >= max_moves)
        return 0;

    int count = 0;
    board_t* consider_board = duplicate_board(board);
    for (int j = 0; j < board->width * board->height; j++)
    {
        move_t m =
        {
            .from = index,
            .to = j,
            .promotion = PIECE_TYPE_EMPTY,
        };
        if (is_move_legal(board, &m)
            && (!in_check || would_move_release_check(board, consider_board, &m)))
        {
            if (is_pawn_last_rank(board, &m))
            {
#define __GENERATE_MOVES_ADD_MOVE(_m)                                   \
                if (count < max_moves)                                  \
                {                                                       \
                    memcpy(&moves[count++], &_m, sizeof(move_t));       \
                }                                                       \
                else                                                    \
                {                                                       \
                    break;                                              \
                }
                m.promotion = PIECE_TYPE_ROOK;
                __GENERATE_MOVES_ADD_MOVE(m)
                m.promotion = PIECE_TYPE_KNIGHT;
                __GENERATE_MOVES_ADD_MOVE(m)
                m.promotion = PIECE_TYPE_BISHOP;
                __GENERATE_MOVES_ADD_MOVE(m)
                m.promotion = PIECE_TYPE_QUEEN;
                __GENERATE_MOVES_ADD_MOVE(m)
            }
            else
            {
                __GENERATE_MOVES_ADD_MOVE(m)
            }
        }
    }
    destroy_board(consider_board);
    return count;
}


bool generate_all_moves(board_t* board, colour_t colour, bool in_check, move_t* moves, int max_moves, int* move_count)
{
    int count = 0;
    for (int i = 0; i < board->width * board->height; i++)
    {
        piece_t* p = get_piece(board, i);
        if (p->type == PIECE_TYPE_EMPTY || p->colour != colour)
            continue;
        count += generate_moves(board, i, in_check, &moves[count], max_moves - count);
    }
    *move_count = count;
    return count > 0;
}


static bool would_move_cause_check(board_t* board, board_t* consider_board, move_t* m)
{
    return !would_move_release_check(board, consider_board, m);
}


bool has_legal_moves(board_t* board, colour_t colour)
{
    board_t* consider_board = duplicate_board(board);
    for (int from = 0; from < board->width * board->height; from++)
    {
        piece_t* p = get_piece(board, from);
        if (p->type == PIECE_TYPE_EMPTY || p->colour != colour)
            continue;
        for (int to = 0; to < board->width * board->height; to++)
        {
            move_t m = { .from = from, .to = to, .promotion = PIECE_TYPE_EMPTY };
            if (!is_move_legal(board, &m))
                continue;

            if (COLOUR_NONE == would_move_cause_check(board, consider_board, &m))
            {
                destroy_board(consider_board);
                return true;
            }
        }
    }
    destroy_board(consider_board);
    return false;
}
