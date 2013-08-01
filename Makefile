# files
RENDERJS = renderjs.js
RENDERJS_MIN = renderjs.min.js
BUILDDIR = tmp

include config.mk

all: external lint test build doc

#########################################
# Download external lib
#########################################
# Download all external libs
external: lib/sinon/sinon.js \
     lib/sinon/sinon-qunit.js \
     lib/jquery/jquery.js \
     lib/jschannel/jschannel.js \
     lib/require/require.js \
     lib/qunit/qunit.js \
     lib/qunit/qunit.css \
     lib/jio/jio.js \
     lib/jio/md5.js \
     lib/jio/complex_queries.js \
     lib/jio/localstorage.js

lib/sinon/sinon.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://sinonjs.org/releases/sinon-1.7.3.js

lib/sinon/sinon-qunit.js:
	@mkdir -p $(@D)
	# curl -s -o $@ http://sinonjs.org/releases/sinon-qunit-1.0.0.js
	curl -s -o $@ https://raw.github.com/jfromaniello/jmail/master/scripts/Tests/sinon-qunit-1.0.0.js

lib/jquery/jquery.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://code.jquery.com/jquery-2.0.3.js

lib/jschannel/jschannel.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://mozilla.github.io/jschannel/src/jschannel.js

lib/require/require.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://requirejs.org/docs/release/2.1.8/comments/require.js

lib/qunit/qunit.%:
	@mkdir -p $(@D)
	curl -s -o $@ http://code.jquery.com/qunit/qunit-1.12.0$(suffix $@)

lib/jio/jio.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://git.erp5.org/gitweb/jio.git/blob_plain/refs/heads/master:/jio.js

lib/jio/md5.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://git.erp5.org/gitweb/jio.git/blob_plain/refs/heads/master:/lib/md5/md5.js

lib/jio/localstorage.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://git.erp5.org/gitweb/jio.git/blob_plain/refs/heads/master:/src/jio.storage/localstorage.js

lib/jio/complex_queries.js:
	@mkdir -p $(@D)
	curl -s -o $@ http://git.erp5.org/gitweb/jio.git/blob_plain/refs/heads/master:/complex_queries.js

$(RENDERJS_MIN): $(RENDERJS)
	$(UGLIFY_CMD) "$<" > "$@"

${BUILDDIR}/$(RENDERJS).lint: $(RENDERJS) test/renderjs_test.js
	@mkdir -p $(@D)
	$(LINT_CMD) "$(RENDERJS)"
	$(LINT_CMD) "test/renderjs_test.js"
	touch $@

${BUILDDIR}/index.html.ok: test/index.html
	$(PHANTOMJS_CMD) ./test/run-qunit.js $<
	@mkdir -p $(@D)
	@sleep 1
	touch $@

build: $(RENDERJS_MIN)
test: ${BUILDDIR}/index.html.ok
lint: ${BUILDDIR}/$(RENDERJS).lint
doc:
	$(YUIDOC_CMD) .
clean:
	rm -rf $(RENDERJS_MIN) ${BUILDDIR} lib/sinon lib/jquery lib/jschannel lib/qunit lib/jio lib/require
