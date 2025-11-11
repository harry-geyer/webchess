PROJ_DIR?=.

SRC_DIR:=$(PROJ_DIR)/src
LIB_DIR:=$(PROJ_DIR)/libs
INC_DIR:=$(PROJ_DIR)/include
BUILD_DIR:=$(PROJ_DIR)/build
OBJ_DIR:=$(BUILD_DIR)/objs
WEBROOT:=$(BUILD_DIR)/webroot
STATIC_RESOURCE_DIR:=$(PROJ_DIR)/static_resources
TEST_DIR:=$(PROJ_DIR)/tests
TEST_BUILD_DIR:=$(BUILD_DIR)/tests

WCC:=emcc
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

LIB:=$(TEST_BUILD_DIR)/chess.so
LIB_OBJS:=$(patsubst $(SRC_DIR)/%.c,$(TEST_BUILD_DIR)/objs/%.o,$(SRCS))
TESTS:=$(shell find $(TEST_DIR) -type f -name "*.py")

default: all

all: $(WASM) $(ASSETS) $(TEST_BUILD_DIR)/.coverage_complete

clean:
	rm -rf $(BUILD_DIR)

serve: default
	python3 -m http.server -d $(WEBROOT)

test: $(LIB) $(TESTS)
	pytest --rootdir=$(TEST_BUILD_DIR) -v $(TEST_DIR)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(@D)
	$(WCC) -c -o $@ $(CFLAGS) -D__TO_WEBASM__ $<

$(WASM): $(OBJS)
	@mkdir -p $(@D)
	$(WCC) -o $@ -s WASM=1 $(EMCCFLAGS) $^

$(ASSETS): $(WEBROOT)/%: $(STATIC_RESOURCE_DIR)/%
	@mkdir -p $(@D)
	cp $< $@

$(TEST_BUILD_DIR)/objs/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(@D)
	$(CC) -fPIC -fprofile-arcs -ftest-coverage -c -o $@ $(CFLAGS) $<

$(LIB): $(LIB_OBJS)
	@mkdir -p $(@D)
	$(CC) -shared -o $@ $(CFLAGS) $^ -lgcov

$(TEST_BUILD_DIR)/coverage.info: test
	@mkdir -p $(@D)
	lcov --capture --directory $(TEST_BUILD_DIR)/objs --output-file $@

$(WEBROOT)/coverage/gcov.css: $(TEST_BUILD_DIR)/coverage.info $(TEST_DIR)/gcov.css
	@mkdir -p $(@D)
	genhtml $(TEST_BUILD_DIR)/coverage.info --output-directory $(WEBROOT)/coverage/

$(TEST_BUILD_DIR)/.coverage_complete: $(WEBROOT)/coverage/gcov.css $(TEST_DIR)/gcov.css
	cat $(TEST_DIR)/gcov.css >> $(WEBROOT)/coverage/gcov.css
	@touch $@

.PHONY: all clean serve test
