# Extension Icons

Create the following icon files for the extension:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

These should be the SquareFt logo in blue with white "S".

For now, you can use any placeholder or convert logo1.png to these sizes using:

```bash
# Using ImageMagick (if installed)
convert ../../../public/logo1.png -resize 16x16 icon16.png
convert ../../../public/logo1.png -resize 48x48 icon48.png
convert ../../../public/logo1.png -resize 128x128 icon128.png
```

Or use an online tool like https://www.iloveimg.com/resize-image
