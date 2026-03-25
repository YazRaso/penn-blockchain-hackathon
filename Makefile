# Agent Storage SDK docs + TSDoc quality gates

.PHONY: help run test clean docs-setup tsdoc-lint docs-generate docs-build docs-serve clean-docs

TMP_RUN_DIR := .tmp-run
TEST_FILES := tests/integration/test_AgentStorage_primitives.ts tests/integration/test_synapase.ts

help:
	@echo "Available targets:"
	@echo "  make run FILE=...  - Bundle a TypeScript file with esbuild and run with node"
	@echo "  make test          - Run the test suite"
	@echo "  make clean         - Remove temporary bundle output"
	@echo "  make docs-setup    - Install local tooling for docs + linting"
	@echo "  make tsdoc-lint    - Validate TSDoc syntax and require docs on exported symbols"
	@echo "  make docs-generate - Generate API markdown from src/ using TypeDoc"
	@echo "  make docs-build    - Build MkDocs site"
	@echo "  make docs-serve    - Serve MkDocs locally"
	@echo "  make clean-docs    - Remove generated API docs and site output"

run:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make run FILE=path/to/file.ts"; \
		exit 1; \
	fi
	@if grep -Eq "from ['\"]vitest['\"]" "$(FILE)"; then \
		npx vitest run "$(FILE)"; \
	else \
		mkdir -p $(TMP_RUN_DIR); \
		base="$$(basename "$(FILE)")"; \
		name="$${base%.*}"; \
		out="$(TMP_RUN_DIR)/$${name}.mjs"; \
		npx esbuild "$(FILE)" --bundle --platform=node --format=esm --target=node22 --outfile="$$out" && node "$$out"; \
	fi

test:
	@set -e; \
	for file in $(TEST_FILES); do \
		echo "Running $$file"; \
		$(MAKE) run FILE="$$file"; \
	done

clean:
	rm -rf $(TMP_RUN_DIR)

docs-setup:
	npm install --save-dev eslint@^8 @typescript-eslint/parser eslint-plugin-tsdoc eslint-plugin-jsdoc typedoc typedoc-plugin-markdown
	python3 -m pip install --user mkdocs mkdocs-material

tsdoc-lint:
	npx eslint --config .eslintrc.docs.cjs --ext .ts src --max-warnings=0

docs-generate: tsdoc-lint
	npx typedoc --options typedoc.json

docs-build: docs-generate
	python3 -m mkdocs build --strict

docs-serve: docs-generate
	python3 -m mkdocs serve

clean-docs:
	rm -rf docs/api site
