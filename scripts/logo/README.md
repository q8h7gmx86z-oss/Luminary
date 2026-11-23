# Logo assets

`assets/logo/source-artwork.png` is the original artwork. To rebuild every icon:

```bash
python3 scripts/logo/recolor.py assets/logo/source-artwork.png navy.png   # plum ground to Mimi Bright navy
python3 scripts/logo/make.py                                              # writes out/: icons, splash, favicon
```

Then copy the files from `out/` into `assets/` (and `logo-256.png`, `luminary-logo-navy.png` into `assets/logo/`).
