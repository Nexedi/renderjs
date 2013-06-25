# npm install uglify-js
UGLIFY_CMD	= $(shell which uglifyjs || echo node ~/node_modules/uglify-js/bin/uglifyjs)
# npm install jslint
LINT_CMD	= $(shell which jslint || echo node ~/node_modules/jslint/bin/jslint.js) --terse
YUIDOC_CMD      = $(shell which yuidoc)
