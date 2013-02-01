# files
RENDERJS		= renderjs.js
RENDERJS_MIN		= renderjs.min.js

# npm install uglify-js
UGLIFY_CMD	= $(shell which uglifyjs || echo node ~/node_modules/uglify-js/bin/uglifyjs)

auto: build
build: uglify

uglify:
	$(UGLIFY_CMD) "$(RENDERJS)" > "$(RENDERJS_MIN)"

clean:
	find -name '*~' -delete

