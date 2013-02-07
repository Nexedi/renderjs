# files
RENDERJS		= renderjs.js
RENDERJS_MIN		= renderjs.min.js

# npm install uglify-js
UGLIFY_CMD	= $(shell which uglifyjs || echo node ~/node_modules/uglify-js/bin/uglifyjs)
# npm install jslint
LINT_CMD	= $(shell which jslint || echo node ~/node_modules/jslint/bin/jslint.js) --terse

auto: build
build: uglify

uglify: $(RENDERJS_MIN)

$(RENDERJS_MIN): $(RENDERJS)
	$(UGLIFY_CMD) "$<" > "$@"

lint: $(RENDERJS)
	$(LINT_CMD) "$<"

clean:
	rm -f $(RENDERJS_MIN)
