# files
RENDERJS = renderjs.js
RENDERJS_MIN = renderjs.min.js
BUILDDIR = tmp

include config.mk

all: lint test build doc

$(RENDERJS_MIN): $(RENDERJS)
	$(UGLIFY_CMD) "$<" > "$@"

${BUILDDIR}/$(RENDERJS).lint: $(RENDERJS)
	@mkdir -p $(@D)
	$(LINT_CMD) "$<"
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
	rm -rf $(RENDERJS_MIN) ${BUILDDIR}
