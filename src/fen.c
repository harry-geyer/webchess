#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>

#include "fen.h"
#include "move.h"


static piece_t fen_char_to_piece(char c)
{
    piece_t p;
    p.colour = isupper(c) ? COLOUR_WHITE : COLOUR_BLACK;
    switch (tolower(c))
    {
        case 'p':
            p.type = PIECE_TYPE_PAWN;
            break;
        case 'n':
            p.type = PIECE_TYPE_KNIGHT;
            break;
        case 'b':
            p.type = PIECE_TYPE_BISHOP;
            break;
        case 'r':
            p.type = PIECE_TYPE_ROOK;
            break;
        case 'q':
            p.type = PIECE_TYPE_QUEEN;
            break;
        case 'k':
            p.type = PIECE_TYPE_KING;
            break;
        default:
            p.type = PIECE_TYPE_EMPTY;
            p.colour = COLOUR_NONE;
            break;
    }
    return p;
}


static char piece_to_fen_char(piece_t p)
{
    char c = '?';
    switch (p.type)
    {
        case PIECE_TYPE_PAWN:
            c = 'p';
            break;
        case PIECE_TYPE_KNIGHT:
            c = 'n';
            break;
        case PIECE_TYPE_BISHOP:
            c = 'b';
            break;
        case PIECE_TYPE_ROOK:
            c = 'r';
            break;
        case PIECE_TYPE_QUEEN:
            c = 'q';
            break;
        case PIECE_TYPE_KING:
            c = 'k';
            break;
        case PIECE_TYPE_EMPTY:
            c = ' ';
            break;
        default:
            break;
    }
    if (p.colour == COLOUR_WHITE)
        c = toupper(c);
    return c;
}


board_t* parse_fen(const char* fen, colour_t* out_turn)
{
    int width = 8;
    int height = 8;
    board_t* b = create_board(width, height);
    int rank = 0;
    int file = 0;
    const char* p = fen;
    while (*p && rank < height && *p != ' ')
    {
        if (*p == '/')
        {
            rank++;
            file = 0;
        }
        else if (isdigit(*p))
        {
            file += *p - '0';
        }
        else
        {
            int idx = rank * width + file;
            b->squares[idx] = fen_char_to_piece(*p);
            file++;
        }
        p++;
    }
    while (*p && *p == ' ')
        p++;
    if (*p == 'w')
        *out_turn = COLOUR_WHITE;
    else if (*p == 'b')
        *out_turn = COLOUR_BLACK;
    return b;
}


int generate_fen(const board_t* b, colour_t turn, char* out_fen, int max_len)
{
    int width = b->width;
    int height = b->height;
    int pos = 0;
    for (int r = 0; r < height; r++)
    {
        int empty_count = 0;
        for (int f = 0; f < width; f++)
        {
            int idx = r * width + f;
            piece_t p = b->squares[idx];
            if (p.type == PIECE_TYPE_EMPTY)
            {
                empty_count++;
            }
            else
            {
                if (empty_count)
                {
                    pos += snprintf(out_fen + pos, max_len - pos, "%d", empty_count);
                    empty_count = 0;
                }
                char c = piece_to_fen_char(p);
                out_fen[pos++] = c;
            }
        }
        if (empty_count)
        {
            pos += snprintf(out_fen + pos, max_len - pos, "%d", empty_count);
        }
        if (r < height - 1) out_fen[pos++] = '/';
    }
    out_fen[pos++] = ' ';
    out_fen[pos++] = (turn == COLOUR_WHITE) ? 'w' : 'b';
    out_fen[pos] = '\0';
    return pos;
}


move_t uci_to_move(const board_t* b, const char* uci)
{
    move_t m;
    m.from = coords_to_index((board_t*)b, uci[0] - 'a', uci[1] - '1');
    m.to = coords_to_index((board_t*)b, uci[2] - 'a', uci[3] - '1');
    m.promotion = PIECE_TYPE_EMPTY;
    if (uci[4])
    {
        switch (uci[4])
        {
            case 'q':
                m.promotion = PIECE_TYPE_QUEEN;
                break;
            case 'r':
                m.promotion = PIECE_TYPE_ROOK;
                break;
            case 'b':
                m.promotion = PIECE_TYPE_BISHOP;
                break;
            case 'n':
                m.promotion = PIECE_TYPE_KNIGHT;
                break;
            default:
                break;
        }
    }
    return m;
}


int move_to_uci(const board_t* b, move_t* m, char* out_uci, int max_len)
{
    int from_file = m->from % b->width;
    int from_rank = b->width - m->from / b->width;
    int to_file = m->to % b->width;
    int to_rank = m->to / b->width;
    int len = snprintf(out_uci, max_len, "%c%d%c%d",
        'a' + from_file, from_rank + 1,
        'a' + to_file, to_rank + 1);
    if (m->promotion != PIECE_TYPE_EMPTY)
    {
        char promo = 'q';
        switch (m->promotion)
        {
            case PIECE_TYPE_QUEEN:
                promo = 'q';
                break;
            case PIECE_TYPE_ROOK:
                promo = 'r';
                break;
            case PIECE_TYPE_BISHOP:
                promo = 'b';
                break;
            case PIECE_TYPE_KNIGHT:
                promo = 'n';
                break;
            default:
                break;
        }
        len = strlen(out_uci);
        if (len < max_len - 1)
            out_uci[len] = promo;
        out_uci[len + 1] = '\0';
    }
    return len;
}
