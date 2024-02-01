Inhibition Indicator
===

Inhibition Indicator is a Gnome Shell extension that shows the current inhibition status with a indicator icon.

## Development

`cli.js` can be used for debugging some parts of the code (because debugging Gnome Extensions is PITA). Run `cli.js` with
```bash
gjs -m cli.js
```

After translatable strings are changed, regenerate the pot files:
```bash
xgettext --from-code=UTF-8 --output=po/inhibitionindicator@monyxie.github.io.pot inhibitionindicator@monyxie.github.io/**/*.js
```

Dev installation
```bash
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$(pwd)/inhibitionindicator@monyxie.github.io" ~/.local/share/gnome-shell/extensions
# gnome-extensions enable inhibitionindicator@monyxie.github.io
```

For now, only dev dependencies are defined in `package.json`, and there's no build step.
This project is GPL so there's a restriction on the licenses of the dependencies.
We don't want code of non-compatible licenses make it into the release.

## TODO
- Create a build script
