#pragma once

#include "board.h"
#include "move.h"


board_t* parse_fen(const char* fen, colour_t* out_turn);
int generate_fen(const board_t* b, colour_t turn, char* out_fen, int max_len);
move_t uci_to_move(const board_t* b, const char* uci);
int move_to_uci(const board_t* b, move_t* m, char* out_uci, int max_len);
