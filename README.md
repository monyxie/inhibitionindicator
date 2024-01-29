Inhibition Indicator
===

Inhibition Indicator is a Gnome Shell extension that shows the current inhibition status with a indicator icon.

## Development

`cli.js` can be used for debugging some parts of the code (because debugging Gnome Extensions is PITA). Run `cli.js` with
```bash
gjs -m src/cli.js
```

After translatable strings are changed, regenerate the pot files:
```bash
xgettext --from-code=UTF-8 --output=po/inhibitionindicator@monyxie.github.io.pot *.js
```

Only dev dependencies are defined in `package.json` for now, and there's no build step.

## TODO
Use more expressive icons (bed?)
