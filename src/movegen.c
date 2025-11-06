#include <stdbool.h>
#include <string.h>

#include "movegen.h"
#include "board.h"
#include "move.h"
#include "game.h"

#include "movegen/random.h"
#include "movegen/fav_colour.h"


#define MOVEGEN(_name)          { # _name , movegen_ ## _name ## _generator }


static const movegen_t move_generators[] =
{
    MOVEGEN(random),
    MOVEGEN(fav_colour),
};
static const movegen_t* move_generator = &move_generators[0];


bool movegen_get_move(game_config_t* config, board_t* board, colour_t turn, move_t* move, game_status_t status)
{
    return move_generator->generator(config, board, turn, move, status);
}


int movegen_list(char** list, unsigned list_len, unsigned row_len)
{
    unsigned len = sizeof(move_generators) / sizeof(move_generators[0]);
    if (list_len < len)
    {
        len = list_len;
    }
    for (unsigned i = 0; i < len; i++)
    {
        strncpy(list[i], move_generators[i].name, row_len);
    }
    return len;
}


bool movegen_set(const char* name)
{
    unsigned len = sizeof(move_generators) / sizeof(move_generators[0]);
    for (unsigned i = 0; i < len; i++)
    {
        if (0 == strcmp(name, move_generators[i].name))
        {
            move_generator = &move_generators[i];
            return true;
        }
    }
    return false;
}


const char* movegen_get(void)
{
    return move_generator->name;
}
