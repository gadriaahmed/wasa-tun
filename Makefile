.PHONY: dev build stop status logs ping smoke build-legacy-ui build-react-ui

dev:
	./bin/dev.sh

build:
	./bin/build.sh -b true -p development

build-legacy-ui:
	./bin/build-legacy-ui.sh

build-react-ui:
	./bin/build-react-ui.sh

stop:
	./bin/ui-react-dev.sh stop || true
	./bin/compose.sh down

status:
	./bin/compose.sh ps

logs:
	./bin/compose.sh logs -f wasabi

ping:
	@curl -sf http://localhost:8088/api/v1/ping && echo

smoke:
	./bin/smoke-test.sh
