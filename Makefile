# files
RENDERJS		= renderjs.js
RENDERJS_MIN		= renderjs.min.js

# npm install uglify-js
UGLIFY_CMD	= $(shell which uglifyjs || echo node ~/node_modules/uglify-js/bin/uglifyjs)
LINT_CMD	= $(shell which jslint || echo node ~/node_modules/jslint/bin/jslint.js) --terse

auto: build
build: uglify

uglify:
	$(UGLIFY_CMD) "$(RENDERJS)" > "$(RENDERJS_MIN)"

lint:
	$(LINT_CMD) $(RENDERJS)

clean:
	find -name '*~' -delete
	find -name 'renderjs.min.js' -delete

