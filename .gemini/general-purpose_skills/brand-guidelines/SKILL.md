---
name: brand-guidelines
description: Apply Anthropic brand identity and styling with official colors, typography, and visual elements. Use for presentations, documents, or assets needing brand consistency. Triggers on requests for "brand styling", "corporate identity", or "Anthropic branding".
---

# Anthropic Brand Styling

## Brand Guidelines

### Colors

**Main Colors:**
- Dark: `#141413` - Primary text and dark backgrounds
- Light: `#faf9f5` - Light backgrounds and text on dark
- Mid Gray: `#b0aea5` - Secondary elements
- Light Gray: `#e8e6dc` - Subtle backgrounds

**Accent Colors:**
- Orange: `#d97757` - Primary accent
- Blue: `#6a9bcc` - Secondary accent
- Green: `#788c5d` - Tertiary accent

### Typography

- **Headings**: Poppins (with Arial fallback)
- **Body Text**: Lora (with Georgia fallback)

## Application

### Smart Font Application
- Poppins for headings (24pt and larger)
- Lora for body text
- Automatic fallback if fonts unavailable

### Color Application
- Use RGB values via RGBColor class
- Maintain color fidelity across systems
- Non-text shapes use accent colors (cycling through orange, blue, green)
