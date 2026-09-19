# Accessibility Testing Guide

This document provides guidelines for testing and maintaining the accessibility of the FNF Accessible Chart Editor.

## Screen Reader Testing

### Windows with NVDA

1. Download [NVDA](https://www.nvaccess.org/download/)
2. Install and run NVDA
3. Navigate using:
   - **Numpad+Right Arrow** - Read current element
   - **Numpad+Down Arrow** - Read all (continuous)
   - **Numpad+Left Arrow** - Stop reading
   - **Tab** - Move to next element
   - **Shift+Tab** - Move to previous element

### macOS with VoiceOver

1. Enable: **System Preferences → Accessibility → VoiceOver**
2. Or press **Cmd+F5**
3. Navigate using:
   - **VO+Right Arrow** - Next element (VO = Control+Option)
   - **VO+Left Arrow** - Previous element
   - **VO+U** - Web rotor (shows all headings, links, etc.)
   - **VO+Space** - Activate element

### JAWS (Windows, requires license)

Most navigation similar to NVDA, see [JAWS documentation](https://www.freedomscientific.com/products/software/jaws/)

## Keyboard Navigation Testing

Test these keyboard paths:

1. **Tab through all controls** - Start at header, tab to footer
2. **Grid navigation** - Use Arrow Keys within chart grid
3. **Shortcuts** - Test Ctrl+S, Ctrl+O, Space
4. **No keyboard traps** - Always able to tab away from any element

### Checklist

- [ ] Can navigate entire interface with keyboard only
- [ ] No elements requiring mouse hover to operate
- [ ] Focus visible on all interactive elements
- [ ] Tab order follows visual left-to-right, top-to-bottom
- [ ] Keyboard shortcuts are documented
- [ ] Dialog boxes have focus management

## Visual Accessibility Testing

### Contrast Testing

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/):

- **Normal text**: WCAG AA (4.5:1 ratio minimum)
- **Large text** (18pt+): WCAG AA (3:1 ratio minimum)
- **Current implementation**: WCAG AAA (7:1+ ratio)

Color pairs to test:
- `#00d4ff` (cyan) on `#1a1a1a` (dark)
- `#00ff00` (green) on `#1a1a1a` (dark)
- `#e0e0e0` (light gray) on `#2d2d2d` (medium dark)

### Color Blindness Testing

Use [Coblis Color Blind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/):

- [ ] Protanopia (Red-Blind)
- [ ] Deuteranopia (Green-Blind)
- [ ] Tritanopia (Blue-Yellow-Blind)
- [ ] Monochromacy (Complete)

**Ensure** grid cells aren't distinguished by color alone - use shape/position instead.

### Zoom Testing

- [ ] 200% zoom - All elements readable, no horizontal scroll needed
- [ ] 400% zoom - Text reflows, navigation functional
- [ ] Mobile view - Touch targets 44x44px minimum

## Code Accessibility Review

### Required for All Components

- [ ] Proper semantic HTML (`<button>`, `<label>`, `<nav>`, etc.)
- [ ] ARIA labels (`aria-label`, `aria-describedby`)
- [ ] ARIA roles if needed (`role="status"`, `role="region"`)
- [ ] Live regions (`aria-live="polite"` or `"assertive"`)
- [ ] Form associations (labels linked to inputs)

### Checklist for New Features

```jsx
// ✅ Good
<button aria-label="Save chart as JSON">💾 Save</button>

// ✅ Good
<div role="status" aria-live="polite" aria-label="Notification">
  Chart saved!
</div>

// ❌ Bad
<div onClick={saveChart}>Save</div>

// ❌ Bad
<button title="Save">💾</button>
```

## Automated Testing Tools

### Browser Extensions

1. **[WAVE](https://wave.webaim.org/extension/)** - Contrast & structure issues
2. **[Axe DevTools](https://www.deque.com/axe/devtools/)** - Comprehensive accessibility audit
3. **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - Built into Chrome DevTools

### Command Line

```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Run tests
npm run test -- --coverage --watchAll=false
```

## User Testing

### Recruit Testers With:
- Actual screen reader users
- Keyboard-only users
- Assistive technology users
- Colorblind users
- Low vision users

### Testing Tasks

1. "Upload an audio file without using the mouse"
2. "Find the chart save button using only Tab key"
3. "Create a 3-note chart chart using only keyboard"
4. "Load a saved chart file"
5. "Understand what notes are active in the grid"

## Accessibility Statement

Add to README or footer:

```markdown
### Accessibility Statement

We are committed to making this chart editor accessible to everyone. 
The FNF Accessible Chart Editor meets or exceeds WCAG 2.1 Level AAA 
accessibility guidelines.

**Tested with:**
- NVDA, JAWS, VoiceOver screen readers
- Keyboard-only navigation
- High contrast and zoom levels
- Multiple browsers and devices

**Known limitations:**
- Audio playback may be limited on GitHub Pages (use local version)
- Mobile touch targets are optimized but may be challenging on small screens

**Have accessibility feedback?** 
[Open an issue](https://github.com/Romantails9YT/fnf-accessible-chart-editor/issues)
```

## WCAG 2.1 Conformance

This project aims for **Level AAA** compliance:

| Category | Requirement | Status |
|----------|-------------|--------|
| **Perceivable** | Text alternatives, adaptable content | ✅ |
| **Operable** | Keyboard accessible, enough time | ✅ |
| **Understandable** | Readable, predictable, error prevention | ✅ |
| **Robust** | Compatible with assistive tech | ✅ |

## Ongoing Maintenance

- **Monthly**: Run automated tools (WAVE, Axe)
- **Per PR**: Code review accessibility changes
- **Quarterly**: Full manual testing with screen reader
- **Annually**: Full accessibility audit

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Deque University](https://dequeuniversity.com/)
