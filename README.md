Webchess
========

This is a chess engine written in C, it is compiled into webassembly
with emscripten and natively for the unit tests.
As the GUI is in the browser, it is designed with HTML, CSS and (vanilla)
Javascript.

Building
--------

Requirements:

 - emscripten
 - lcov

Python requirements:

 - pytest
 - pytest-html
 - coverage

It is recommended that you use python virtual environments, so start
by:

    python3 -m venv .env
    source .env/bin/activate

Then install the python dependancies:

    pip3 install pytest pytest-html coverage

Now build the webroot:

    make

The directory `build/webroot/` will be the root of the page. I recommend
using a proper webserver, such as nginx or apache2 for hosting, but for
development you can use:

    make serve

In the directory, there are two subdirectories, which you make want to
remove if not in development. I like to have it public. `tests/` and
`coverage/`, these show the generated status of the tests and how much
coverage the tests had on the engine.

Move Generators
---------------

There are currently two move generators, which will be built into bot
opponents:

 - Random - Select a random move out of the list of available moves.
 - Favourite colour - Try to put all my pieces on my own colour square.

I have ideas for more, including: "Protect the President", try to get the
king in the centre of the board, but keeping him surrounded by pieces;
and "The Slavic Push", involving pushing pawns, prioritising taking high
value pieces.

License: see License file.

