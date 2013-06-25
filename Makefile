# files
RENDERJS = renderjs.js
RENDERJS_MIN = renderjs.min.js

include config.mk

auto: build
build: uglify

uglify: $(RENDERJS_MIN)

$(RENDERJS_MIN): $(RENDERJS)
	$(UGLIFY_CMD) "$<" > "$@"

lint: $(RENDERJS)
	$(LINT_CMD) "$<"

doc:
	$(YUIDOC_CMD) .
clean:
	rm -f $(RENDERJS_MIN)
