#include <stdlib.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

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


static void realise_game_status(void)
{
    bool in_check = is_in_check(current_board, current_turn);
    bool can_move = has_legal_moves(current_board, current_turn);
    game_status_t status = STATUS_ONGOING;
    if (in_check)
    {
        status = can_move ? STATUS_CHECK : STATUS_CHECKMATE;
    }
    else if (!can_move)
    {
        status = STATUS_STALEMATE;
    }
    current_status = status;
}


void game_set_board(const board_t* b, colour_t turn)
{
    if (!current_board)
        return;
    memcpy(current_board->squares, b->squares, b->width * b->height * sizeof(piece_t));

    current_turn = turn;
    realise_game_status();
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
    return movegen_get_move(&config, current_board, current_turn, m, current_status);
}


bool game_apply_move(move_t* m)
{
    piece_t* p = get_piece(current_board, m->from);
    if (p->type == PIECE_TYPE_EMPTY)
    {
        printf("couldn't get piece\n");
        return false;
    }
    if (STATUS_CHECKMATE == current_status
        || STATUS_STALEMATE == current_status)
    {
        printf("end of game\n");
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
    if (STATUS_CHECK == current_status
        && !would_move_release_check(current_board, m))
    {
        printf("need to release check\n");
        return false;
    }
    set_piece(current_board, m->to, p);
    piece_t empty = { PIECE_TYPE_EMPTY, COLOUR_NONE };
    set_piece(current_board, m->from, &empty);

    current_turn = (current_turn == COLOUR_WHITE) ? COLOUR_BLACK : COLOUR_WHITE;
    realise_game_status();
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
