#pragma once

#include <errno.h>
#include <stdarg.h>


#define PRINTF_LIKE(fmtarg, firstvararg) __attribute__((format(printf, fmtarg, firstvararg)))

PRINTF_LIKE(2, 3)
void raise_error(int err, const char* fmt, ...);

