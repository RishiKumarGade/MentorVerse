# Theme Assets

## Directory Structure

```
themes/
├── batman/
│   ├── loading.png
│   ├── explaining.png
│   ├── asking.png
│   ├── praising.png
│   ├── consoling.png
│   └── focus.mp3
├── naruto/
│   ├── loading.png
│   ├── explaining.png
│   ├── asking.png
│   ├── praising.png
│   ├── consoling.png
│   └── focus.mp3
└── minimal/
    └── (no assets - uses text-based fallback)
```

## Avatar States

1. **loading** - Thinking/processing animation
2. **explaining** - Teaching/explaining mode
3. **asking** - Questioning mode
4. **praising** - Success/celebration
5. **consoling** - Encouragement/support

## Audio Files

- **focus.mp3** - Background focus music (optional)
- Should be looped and around 30 seconds to 2 minutes long
- Keep volume levels consistent across themes

## Image Requirements

- **Format**: PNG with transparency support
- **Size**: 256x256px recommended
- **Style**: Consistent with theme character
- **Background**: Transparent or theme-appropriate

## Adding New Themes

1. Create new directory under `/themes/`
2. Add required image assets
3. Add optional audio file
4. Update theme configuration in `src/store/useStore.ts`
