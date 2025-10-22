PROJ_DIR?=.

SRC_DIR:=$(PROJ_DIR)/src
LIB_DIR:=$(PROJ_DIR)/libs
INC_DIR:=$(PROJ_DIR)/include
BUILD_DIR:=$(PROJ_DIR)/build
OBJ_DIR:=$(BUILD_DIR)/objs
WEBROOT:=$(BUILD_DIR)/webroot
STATIC_RESOURCE_DIR:=$(PROJ_DIR)/static_resources

CC:=emcc
CFLAGS:=-O3 -Wall -Werror -pedantic
CFLAGS+=-I$(INC_DIR) -I$(LIB_DIR)
EMCCFLAGS:= --bind \
            -s ASSERTIONS=1 \
            -s MODULARIZE=1 \
            -s EXPORT_NAME="App" \
            -s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
            -s INLINING_LIMIT=1 \
            -s NO_EXIT_RUNTIME=1 \
            -s EXPORTED_FUNCTIONS="['_malloc','_free']" \
            -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'

SRCS:=$(shell find $(SRC_DIR) -type f -name "*.c")
OBJS:=$(patsubst $(SRC_DIR)/%.c,$(OBJ_DIR)/%.o,$(SRCS))
ASSET_SRCS:=$(shell find $(STATIC_RESOURCE_DIR) -type f)
ASSETS:=$(patsubst $(STATIC_RESOURCE_DIR)/%,$(WEBROOT)/%,$(ASSET_SRCS))
WASM:=$(WEBROOT)/chess.js

default: all

all: $(WASM) $(ASSETS)

clean:
	rm -rf $(BUILD_DIR)

serve: default
	python3 -m http.server -d $(WEBROOT)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(@D)
	$(CC) -c -o $@ $(CFLAGS) $<

$(WASM): $(OBJS)
	@mkdir -p $(@D)
	$(CC) -o $@ -s WASM=1 $(EMCCFLAGS) $^

$(ASSETS): $(WEBROOT)/%: $(STATIC_RESOURCE_DIR)/%
	@mkdir -p $(@D)
	cp $< $@

.PHONY: all clean serve
