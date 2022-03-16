# VARIABLES
export PROJECT_PATH=$(shell pwd)
export BINARIES=${PROJECT_PATH}/node_modules/.bin

export VERSION=1.6.0
export ID=com.crunchyroll.webos
export HOMEPAGE="https://github.com/mateussouzaweb/crunchyroll-webos"
export THUMBNAIL="https://raw.githubusercontent.com/mateussouzaweb/crunchyroll-webos/master/src/img/80px.png"

# DEV METHODS
build:
	compactor \
		--source $(PROJECT_PATH)/src/ \
		--destination $(PROJECT_PATH)/$(ID)/ \
		--progressive false \
		--exclude "lib/*.map,js/*.map" \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css"

watch:
	compactor \
		--watch \
		--source $(PROJECT_PATH)/src/ \
		--destination $(PROJECT_PATH)/$(ID)/ \
		--progressive false \
		--hashed false \
		--exclude "lib/*.map,js/*.map" \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css"

server:
	statiq --port 5000 --root $(PROJECT_PATH)/$(ID)/

develop:
	make -j 2 watch server

# TV METHODS
devices:
	$(BINARIES)/ares-setup-device -list

setup:
	$(BINARIES)/ares-setup-device

check:
	$(BINARIES)/ares-install --list

# APP METHODS
package:
	$(BINARIES)/ares-package $(PROJECT_PATH)/$(ID) \
		--no-minify \
		--outdir $(PROJECT_PATH)/bin

manifest:
	$(BINARIES)/webosbrew-gen-manifest \
		-a $(PROJECT_PATH)/src/appinfo.json \
		-p $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk \
		-o $(PROJECT_PATH)/bin/webosbrew.manifest.json \
		-i $(THUMBNAIL) -l $(HOMEPAGE)

install:
	$(BINARIES)/ares-install $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk

launch:
	$(BINARIES)/ares-launch $(ID)

inspect:
	$(BINARIES)/ares-inspect --app $(ID) --host-port 9222