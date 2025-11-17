#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


void raise_error(int err, const char* fmt, ...)
{
    errno = err;
    va_list ap;
    va_start(ap, fmt);
    fprintf(stderr, "Error [%d: %s]: ", err, strerror(err));
    vfprintf(stderr, fmt, ap);
    va_end(ap);
    fprintf(stderr, "\n");
    fflush(stderr);
    exit(err ? err : 1);
}

