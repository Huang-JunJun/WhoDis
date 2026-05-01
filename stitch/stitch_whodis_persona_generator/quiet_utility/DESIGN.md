---
name: Quiet Utility
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#555f71'
  primary: '#182232'
  on-primary: '#ffffff'
  primary-container: '#2d3748'
  on-primary-container: '#96a0b5'
  inverse-primary: '#bdc7dc'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d1e1fa'
  on-secondary-container: '#556479'
  tertiary: '#152230'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a3846'
  on-tertiary-container: '#93a1b3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e3f9'
  primary-fixed-dim: '#bdc7dc'
  on-primary-fixed: '#121c2c'
  on-primary-fixed-variant: '#3d4759'
  secondary-fixed: '#d4e4fc'
  secondary-fixed-dim: '#b8c8e0'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#39485c'
  tertiary-fixed: '#d6e4f7'
  tertiary-fixed-dim: '#bac8da'
  on-tertiary-fixed: '#0f1d2a'
  on-tertiary-fixed-variant: '#3b4857'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 80px
  container-max: 800px
  gutter: 24px
---

## Brand & Style

This design system centers on the concept of "Quiet Credibility." It is built for a self-interviewing tool that prioritizes introspection and clarity over engagement hacks or technical flash. The personality is that of a high-end physical notebook or a premium productivity tool: unobtrusive, reliable, and deeply functional.

The aesthetic follows a **Minimalist-Corporate** hybrid. It leverages heavy whitespace and a restricted palette to create a "low-stimulus" environment, allowing the user's thoughts and the AI's persona generation to remain the focus. The design avoids the clinical coldness of medical software and the neon-soaked tropes of typical AI products, opting instead for a grounded, editorial feel that suggests professional rigor.

## Colors

The palette is rooted in low-saturation blue-greys and charcoals to maintain a "quiet" visual profile. 

- **Primary & Text:** Deep charcoal (#2D3748 / #1A202C) is used for primary actions and body text to ensure maximum legibility without the harshness of pure black.
- **Secondary/Accents:** Desaturated blue-greys (#718096) provide a professional, calm tone for secondary information and iconography.
- **Neutrals:** The background is a warm off-white (#FDFDFD) rather than a stark digital white, reducing eye strain during long self-interview sessions.
- **Functional Grays:** Subtle variations are used to distinguish between surface layers and borders without introducing new hues.

## Typography

This design system utilizes **Inter** for its neutral, systematic, and utilitarian qualities. The typographic scale is optimized for long-form reading and clear hierarchy.

- **Generous Leading:** Line heights are set slightly higher (1.6 for body) to provide "breathability" and enhance the feeling of a quiet space.
- **Hierarchy:** Contrast is achieved through weight and color (using secondary blue-greys for labels) rather than extreme size differences.
- **Micro-copy:** Labels use slight tracking (letter-spacing) and uppercase styling to differentiate structural UI elements from user-generated content.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for content delivery to ensure the self-interview process feels contained and manageable.

- **Centered Focus:** The main content container is capped at 800px to maintain optimal line lengths for reading and typing.
- **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm. Large "XL" and "XXL" spacing units are used between major sections to prevent the UI from feeling crowded.
- **White Space:** Margin and padding are treated as active design elements. Significant padding within cards and around text blocks reinforces the "high-end utility" aesthetic.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Ambient Shadows** rather than stark borders or heavy gradients.

- **Surface Tiers:** The base background is the most recessed. Input areas and primary content cards sit on a pure white surface.
- **Shadows:** Use extremely diffused, low-opacity shadows (e.g., `box-shadow: 0 4px 20px rgba(0,0,0,0.04)`). The goal is to lift the element just enough to indicate interactivity without creating a "floating" tech look.
- **Outlines:** Soft, 1px borders in a light neutral-gray (#E2E8F0) are used for form fields and containers to provide structure without visual noise.

## Shapes

The shape language is **Soft and Professional**. 

- **Radius:** A consistent 0.25rem (4px) or 0.5rem (8px) radius is applied to buttons and cards. This moderate rounding strikes a balance between the precision of sharp corners and the playfulness of pill shapes.
- **Interaction States:** Subtle shifts in background color or a slightly deeper shadow indicate hover and active states, maintaining the "quiet" nature of the interface.

## Components

- **Buttons:** Primary buttons use the Charcoal background with white text. Secondary buttons use a light-gray ghost style. No gradients.
- **Input Fields:** Large, clean fields with ample internal padding (16px). Focus states use a subtle blue-grey border rather than a high-contrast glow.
- **Cards:** White surfaces with the defined ambient shadow. Used to group interview questions or persona attributes.
- **Chips/Tags:** Used for persona traits. Low-saturation blue-grey background with dark text. Rectangular with small 4px radius.
- **Progress Indicators:** Minimalist thin lines or simple numeric "step 1 of 5" text. Avoid heavy radial gauges or "gamified" bars.
- **AI Response Bubbles:** Distinguished by a very faint blue-grey tint (#F8FAFC) to separate "WhoDis" generated content from user input.