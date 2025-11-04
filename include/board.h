#pragma once


typedef enum
{
    PIECE_TYPE_EMPTY = 0,
    PIECE_TYPE_PAWN,
    PIECE_TYPE_KNIGHT,
    PIECE_TYPE_BISHOP,
    PIECE_TYPE_ROOK,
    PIECE_TYPE_QUEEN,
    PIECE_TYPE_KING
} piece_type_t;

typedef enum
{
    COLOUR_NONE = 0,
    COLOUR_WHITE,
    COLOUR_BLACK
} colour_t;

typedef struct
{
    piece_type_t type;
    colour_t colour;
} piece_t;

typedef struct
{
    int width;
    int height;
    piece_t* squares;
} board_t;


board_t* create_board(int width, int height);
void destroy_board(board_t* b);
piece_t* get_piece(const board_t* b, int index);
void set_piece(board_t* b, int index, piece_t* p);
void clear_board(board_t* b);
