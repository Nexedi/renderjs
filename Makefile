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

${TESTDIR}/shared/test/%.html.ok: ${TESTDIR}/shared/test/%.html ${TESTDIR}/shared/test/qunit/%.js ${TESTDIR}/shared/js/%.js

test/index.html.ok: test/index.html
	$(PHANTOMJS_CMD) ./test/run-qunit.js $<
	@sleep 1
	touch $@

test: test/index.html.ok
doc:
	$(YUIDOC_CMD) .
clean:
	rm -f $(RENDERJS_MIN)
