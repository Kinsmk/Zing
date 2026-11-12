# Zinga Language - Brand Guidelines

## Overview

Zinga is a modern, bilingual (French/English) programming language designed for simplicity, expressiveness, and performance. This document outlines the official brand guidelines for using Zinga's logo, colors, and visual identity.

## Logo

### Primary Logo

The primary logo consists of:
- **Symbol**: A geometric design combining "Z" and "N" letters
- **Wordmark**: "Zinga" in bold, modern typography
- **Tagline**: "The Bilingual Programming Language"

**Usage**:
- Use the primary logo as the default representation
- Maintain proper spacing around the logo
- Do not alter the logo's proportions

### Logo Variations

#### 1. Full Logo (Horizontal)
```
[Z+N Symbol] Zinga
The Bilingual Programming Language
```
- **File**: `logo.svg`
- **Minimum Width**: 200px
- **Use Case**: Primary usage on websites, documentation, presentations

#### 2. Logo with Symbol Only
```
[Z+N Symbol] Zinga
```
- **File**: `logo.svg` (without tagline)
- **Minimum Width**: 150px
- **Use Case**: When space is limited but text is still readable

#### 3. Icon Only
```
[Z+N Symbol]
```
- **File**: `icon.svg`
- **Minimum Size**: 32x32px
- **Use Case**: Favicons, app icons, small spaces

#### 4. Dark Mode Logo
- **File**: `logo-dark.svg` (to be created)
- **Colors**: Inverted color scheme for dark backgrounds
- **Use Case**: Dark mode interfaces, dark backgrounds

### Clear Space

Maintain a minimum clear space around the logo equal to half the height of the "Zinga" text.

```
+--------------------------+
|                          |
|    [Clear Space]         |
|    +------------+        |
|    |            |        |
|    |   LOGO     |        |
|    |            |        |
|    +------------+        |
|    [Clear Space]         |
|                          |
+--------------------------+
```

### Minimum Size

| Logo Type | Minimum Width | Minimum Height | Use Case |
|-----------|---------------|-----------------|----------|
| Full Logo | 200px | 80px | Standard usage |
| Logo + Symbol | 150px | 60px | Limited space |
| Icon Only | 32px | 32px | Favicons, icons |
| Large Display | 500px | 200px | Presentations, banners |

### Incorrect Usage

❌ **Do NOT**:
- Stretch or distort the logo
- Change the colors of the logo
- Add shadows or effects not in the original design
- Rotate the logo
- Place the logo on busy or low-contrast backgrounds
- Use the logo in a way that suggests endorsement without permission

## Color Palette

See [palette.md](palette.md) for the complete color specifications.

### Primary Colors
- **Indigo**: `#4F46E5` (Primary brand color)
- **Purple**: `#7C3AED` (Secondary brand color)
- **Cyan**: `#06B6D4` (Accent color)
- **Blue**: `#3B82F6` (Accent color)

### Neutral Colors
- **Dark Slate**: `#1F2937` (Primary text)
- **Black**: `#111827` (Backgrounds)
- **White**: `#FFFFFF` (Backgrounds)

## Typography

### Primary Typeface
- **Font Family**: Inter (recommended)
- **Fallback**: system-ui, -apple-system, sans-serif
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)

### Usage

| Element | Font Size | Weight | Line Height | Color |
|---------|-----------|--------|-------------|-------|
| Heading 1 | 48px | 700 | 1.2 | `#1F2937` |
| Heading 2 | 36px | 700 | 1.25 | `#1F2937` |
| Heading 3 | 24px | 700 | 1.3 | `#1F2937` |
| Body Text | 16px | 400 | 1.5 | `#374151` |
| Small Text | 14px | 400 | 1.4 | `#6B7280` |
| Code | 14px | 500 | 1.5 | `#1F2937` |

## Applications

### VS Code Extension

**Icon Requirements**:
- **Format**: PNG
- **Sizes**: 128x128, 256x256, 512x512
- **Background**: Transparent
- **File**: `icon.png`

**Theme Colors**:
- **Activity Bar**: `#4F46E5`
- **Status Bar**: `#1F2937`
- **Title Bar**: `#111827`

### GitHub Repository

**Banner**:
- **Size**: 1280x640px
- **Format**: PNG or SVG
- **Background**: Gradient from `#4F46E5` to `#7C3AED`

**README Header**:
```markdown
# Zinga

![Zinga Logo](assets/branding/logo.svg)

The Bilingual Programming Language
```

### Documentation

**Header**:
- Use the full logo at the top of each page
- Background: White or `#F9FAFB`
- Link to homepage

**Code Blocks**:
- Background: `#1F2937`
- Text: `#D1D5DB`
- Border: `#374151`

### Website

**Hero Section**:
- Use the full logo with large size
- Background: Gradient or solid color
- Call-to-action buttons in primary color

**Navigation**:
- Background: White or `#111827` (dark mode)
- Text: `#1F2937` or `#F9FAFB` (dark mode)
- Hover: Primary color with reduced opacity

## File Formats

### Logo Files

| File | Format | Size | Use Case |
|------|--------|------|----------|
| `logo.svg` | SVG | Scalable | Primary logo (vector) |
| `logo.png` | PNG | 1024x1024 | High-resolution logo |
| `logo-512.png` | PNG | 512x512 | Medium-resolution logo |
| `logo-256.png` | PNG | 256x256 | Small logo |
| `logo-128.png` | PNG | 128x128 | Thumbnail logo |
| `icon.svg` | SVG | Scalable | Icon (vector) |
| `icon.png` | PNG | 1024x1024 | High-resolution icon |
| `icon-512.png` | PNG | 512x512 | Medium-resolution icon |
| `icon-256.png` | PNG | 256x256 | Small icon |
| `icon-128.png` | PNG | 128x128 | Thumbnail icon |
| `icon-64.png` | PNG | 64x64 | Favicon |
| `icon-32.png` | PNG | 32x32 | Small favicon |
| `icon-16.png` | PNG | 16x16 | Tiny favicon |

### Color Files

| File | Format | Content |
|------|--------|---------|
| `palette.md` | Markdown | Color specifications |
| `palette.json` | JSON | Color palette in JSON format |
| `palette.css` | CSS | CSS variables for colors |

## Accessibility

### Color Contrast

Ensure all text has sufficient contrast with its background:

- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text (18.66px+)**: Minimum 3:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio

### Testing Tools

Use these tools to verify accessibility:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)

## Third-Party Usage

### Permissions

- **Personal/Non-commercial**: Free to use with attribution
- **Commercial**: Contact for permission
- **Modification**: Not allowed without permission

### Attribution

When using Zinga's logo or brand assets, include the following attribution:

```
Zinga is a trademark of the Zinga Language Project.
```

Or include a link to the official website:

```markdown
[Zinga Language](https://github.com/Kinsmk/Zing)
```

## Contact

For questions about brand usage, contact:
- **GitHub**: [Kinsmk/Zing](https://github.com/Kinsmk/Zing)
- **Issues**: Open an issue on GitHub

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial brand guidelines |
