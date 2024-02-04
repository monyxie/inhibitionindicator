Inhibition Indicator
===

Inhibition Indicator is a Gnome Shell extension that shows the current inhibition status with a indicator icon.

## Development

Dev installation
```bash
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$(pwd)/inhibitionindicator@monyxie.github.io" ~/.local/share/gnome-shell/extensions
# gnome-extensions enable inhibitionindicator@monyxie.github.io
```

Compile schemas
```bash
glib-compile-schemas inhibitionindicator@monyxie.github.io/schemas
```

`cli.js` can be used for debugging some parts of the code (because debugging Gnome Extensions is PITA). Run `cli.js` with
```bash
gjs -m cli.js
```

After translatable strings are changed, regenerate the pot files:
```bash
xgettext --from-code=UTF-8 --output=po/inhibitionindicator@monyxie.github.io.pot inhibitionindicator@monyxie.github.io/**/*.js
```

Pack the extension for distribution
```bash
gnome-extensions pack inhibitionindicator@monyxie.github.io --extra-source=lib.js --extra-source=assets/
```

For now, only dev dependencies are defined in `package.json`, and there's no build step.
This project is GPL so there's a restriction on the licenses of the dependencies.
We don't want code of non-compatible licenses make it into the release.

Read the [review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html#general-guidelines)
before submitting for review on [EGO](https://extensions.gnome.org/).
