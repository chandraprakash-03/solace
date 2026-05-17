---
name: Serene AI Design System
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2a'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#bec8c9'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#889393'
  outline-variant: '#3f4949'
  surface-tint: '#87d3da'
  primary: '#a2eef6'
  on-primary: '#00363a'
  primary-container: '#86d2d9'
  on-primary-container: '#005b61'
  inverse-primary: '#09696f'
  secondary: '#c6c1f7'
  on-secondary: '#2e2b57'
  secondary-container: '#45416f'
  on-secondary-container: '#b4afe4'
  tertiary: '#f2dfcd'
  on-tertiary: '#3a2e23'
  tertiary-container: '#d5c3b2'
  on-tertiary-container: '#5d5043'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a3eff6'
  primary-fixed-dim: '#87d3da'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e4dfff'
  secondary-fixed-dim: '#c6c1f7'
  on-secondary-fixed: '#191541'
  on-secondary-fixed-variant: '#45416f'
  tertiary-fixed: '#f3dfce'
  tertiary-fixed-dim: '#d6c3b3'
  on-tertiary-fixed: '#231a0f'
  on-tertiary-fixed-variant: '#514538'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.5'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system focuses on creating a "sanctuary" for users. The brand personality is empathetic, non-judgmental, and quietly supportive. The visual identity avoids the sharp, high-energy tropes of traditional tech, opting instead for a **Minimalist-Glassmorphic** hybrid that feels soft and organic.

The UI should evoke a sense of deep breathing and safety. This is achieved through generous whitespace (negative space), soft-focus background blurs, and a "light-through-glass" aesthetic that prevents the dark theme from feeling heavy or oppressive. Every interaction should feel intentional and gentle.

## Colors
The palette is rooted in a deep charcoal base to minimize eye strain and create a nighttime-safe environment. 

- **Primary (Soft Teal):** Used for primary actions and active states. It represents clarity and calmness.
- **Secondary (Gentle Lavender):** Used for highlighting emotional insights or AI-driven "soft" suggestions.
- **Neutral:** A range of charcoals and greys. Pure black (#000000) is avoided to maintain a soft, ink-like feel.
- **Accents:** Muted peach or sand tones are used sparingly for delicate warnings or "human" moments within the AI interface.

## Typography
The typography system uses **Plus Jakarta Sans** for headlines to provide a friendly, modern, and slightly rounded geometric feel. **Manrope** is used for body text and labels due to its exceptional readability and professional yet warm character.

Line heights are intentionally generous (1.6x for body) to ensure the interface never feels "cramped," allowing the user’s eyes to glide across text without fatigue.

## Layout & Spacing
The layout follows a **Fluid Grid** model with high internal padding. We utilize a 12-column grid for desktop and a 4-column grid for mobile.

- **Desktop:** Sidebars are treated as floating glass panels. The main content area is centered with wide 64px margins to focus the user's attention.
- **Mobile:** Margins shrink to 16px. Vertical rhythm is emphasized to make scrolling feel like a continuous stream of thought.
- **Rhythm:** A 4px baseline grid ensures consistent vertical alignment. Spacing between major sections should always favor `xl` (40px) to maintain the minimalist aesthetic.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

1.  **Base Layer:** The darkest charcoal (#121414).
2.  **Surface Layer:** A slightly lighter charcoal (#1C1F1F) used for cards and containers.
3.  **Glass Layer:** Semi-transparent overlays (10-20% opacity) with a 20px backdrop blur. These are used for floating navigation bars and modals.
4.  **Borders:** Instead of shadows, use 1px "inner-glow" borders (white at 5-8% opacity) on the top and left edges of cards to simulate light hitting the edge of a glass pane.

## Shapes
The shape language is consistently **Rounded**. Sharp corners are entirely avoided as they feel aggressive. 

- **Standard Containers:** Use `rounded-lg` (16px) for cards and main UI blocks.
- **Interactive Elements:** Use `rounded-xl` (24px) for buttons and input fields to make them feel soft and inviting to the touch.
- **Avatars/Status:** Use full circles (pill-shaped) for AI avatars and status indicators.

## Components
- **Buttons:** Primary buttons use a soft teal gradient or solid fill with high-contrast dark text. Secondary buttons are "ghost" style with a subtle white-translucent border.
- **Input Fields:** Search and message inputs should have a glassmorphic background with a subtle inner glow. The focus state should gently transition the border color to primary teal.
- **Cards:** Used for journal entries or "Reflection Threads." These should have no shadows; instead, use a subtle background tint change on hover.
- **Chips:** Highly rounded (pill) shapes used for "Mood Tags" or "Conversation Modes." Use secondary lavender for active states.
- **AI Conversation Bubble:** The AI's messages should have a slightly different surface tint (very subtle teal-grey) compared to the user's messages to distinguish roles without using harsh colors.
- **Progress Indicators:** Use soft, glowing lines with blurred edges for "breath-work" or loading states to maintain the calming vibe.