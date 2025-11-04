#include <stdlib.h>
#include <stdbool.h>
#include <stdio.h>

#include "game.h"
#include "rules.h"
#include "movegen.h"


static board_t* current_board = NULL;
static game_config_t config;
static colour_t current_turn = COLOUR_WHITE;
static game_status_t current_status = STATUS_ONGOING;


void game_init(const game_config_t* cfg)
{
    config = *cfg;
    if (current_board)
    {
        destroy_board(current_board);
    }
    current_board = create_board(cfg->width, cfg->height);
    current_turn = COLOUR_WHITE;
    current_status = STATUS_ONGOING;
}


void game_set_board(const board_t* b, colour_t turn)
{
    if (!current_board)
        return;
    int size = b->width * b->height;
    for (int i = 0; i < size; i++)
    {
        current_board->squares[i] = b->squares[i];
    }
    current_turn = turn;
}


board_t* game_get_board(void)
{
    return current_board;
}


bool game_get_best_move(move_t* m)
{
    m->from = 0;
    m->to = 0;
    m->promotion = PIECE_TYPE_EMPTY;
    return movegen_get_move(&config, current_board, current_turn, m, &current_status);
}


bool game_apply_move(move_t* m)
{
    piece_t* p = get_piece(current_board, m->from);
    if (p->type == PIECE_TYPE_EMPTY)
    {
        printf("couldn't get piece\n");
        return false;
    }
    if (p->colour != current_turn)
    {
        printf("not right colour's turn\n");
        return false;
    }
    if (!is_move_legal(current_board, m))
    {
        printf("illegal move\n");
        return false;
    }
    set_piece(current_board, m->to, p);
    piece_t empty = { PIECE_TYPE_EMPTY, COLOUR_NONE };
    set_piece(current_board, m->from, &empty);
    current_turn = (current_turn == COLOUR_WHITE) ? COLOUR_BLACK : COLOUR_WHITE;
    return true;
}


game_status_t game_get_status(void)
{
    return current_status;
}


colour_t game_current_turn(void)
{
    return current_turn;
}
