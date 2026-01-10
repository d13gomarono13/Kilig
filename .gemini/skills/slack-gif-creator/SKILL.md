---
name: slack-gif-creator
description: Create animated GIFs optimized for Slack including emoji GIFs and message GIFs. Use for creating animations, emoji reactions, or visual content for Slack. Triggers on requests to "create GIF", "make Slack emoji", or "animate for Slack".
---

# Slack GIF Creator

Create animated GIFs optimized for Slack.

## Slack Requirements

| Type | Dimensions | FPS | Colors | Duration |
|------|------------|-----|--------|----------|
| Emoji | 128x128 | 10-30 | 48-128 | <3 sec |
| Message | 480x480 | 10-30 | 48-128 | - |

## Core Workflow

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # Draw animation using PIL primitives
    builder.add_frame(frame)

builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

## Animation Concepts

- **Shake/Vibrate**: Offset with `sin()` oscillation
- **Pulse/Heartbeat**: Scale with sine wave
- **Bounce**: Use `easing='bounce_out'`
- **Spin/Rotate**: `image.rotate(angle)`
- **Fade**: Adjust alpha channel
- **Slide**: Interpolate position with easing

## Available Utilities

- `core.gif_builder`: GIFBuilder for assembly and optimization
- `core.validators`: Slack compatibility checks
- `core.easing`: Smooth motion functions
- `core.frame_composer`: Gradients, shapes, text helpers

## Dependencies

```bash
pip install pillow imageio numpy
```
