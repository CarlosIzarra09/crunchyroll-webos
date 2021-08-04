# Crunchyroll - WebOS TV App

Unofficial WebOS TV App for Crunchyroll.\
The last Crunchyroll app you will ever need!

## Usage - For Everyone

Just open the browser on your WebOS TV, then navigate to <https://tv.mateussouzaweb.com>.

Add to favorites and enjoy!

PRO-TIP: You can use this mode in almost any device of any brand that has a browser and that is not iOS and iPadOS because of limitations that Apple defined on such devices.

## Usage - For Developers

This method will install Crunchyroll as TV App, but is recommended only for developers:

- Install Compactor (<https://github.com/mateussouzaweb/compactor/>)
- Install Statiq (<https://github.com/mateussouzaweb/statiq/>)
- Install WebOS SDK (<https://webostv.developer.lge.com/sdk/installation/>)
- Enable TV for Testing (<https://webostv.developer.lge.com/develop/app-test/>)
- Clone this repository, then run the following code to install the App:

```bash
# Build from SRC
make build

# Create App for TV
make app_build
make app_install

# Launch or inspect
make app_launch
make app_inspect
```

Developer Mode is enabled only for 50 hours, so you will need to renew developer session every 50 hours to keep using Crunchyroll as app... :(

If you want to develop changes on the project, use the ``develop`` command to open a static web server and watch changes / build while you develop:

```bash
# This command creates a static web server available on your desktop
# You can test it direct from the browser
make develop
```

## Support

Support me for future versions for Samsung, Android TV, ChromeCast and Others.

## Know Bugs

- Select dropdown does not trigger with LG TV Controller in arrow navigation mode.
