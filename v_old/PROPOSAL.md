# Proposal for Website Modernization

## Objective
Transform the current static Jekyll site into a **responsive, reactive, and visually stunning** portfolio that reflects the high-tech nature of your work in AI and Neuroscience.

## 1. Architecture: "Reactive" & Modern
**Recommendation:** Migrate from Jekyll to **Next.js (React)**.

*   **Why?**
    *   **Interactivity:** React allows for rich, interactive UI elements that Jekyll (static HTML) struggles with.
    *   **Performance:** Next.js offers state-of-the-art optimization, image loading, and SEO.
    *   **Ecosystem:** Access to modern animation libraries (Framer Motion) and 3D rendering (React Three Fiber).
    *   **Maintainability:** Component-based architecture makes it easier to manage sections like "Experience" or "Projects" as reusable code blocks.

## 2. Visual Design: "Cool" & Professional
**Theme:** "Digital Neuroscience" – Clean, minimalist, with subtle biological/data-inspired visual cues.

*   **Hero Section:**
    *   Replace the static profile image with a **dynamic, interactive background**.
    *   *Idea:* A subtle, slowly rotating 3D mesh of a brain or a network graph (using Three.js) that responds to mouse movement.
*   **Glassmorphism:** Use semi-transparent, blurred backgrounds for content cards (Experience, Education) to create depth and a modern feel.
*   **Typography:** Switch to a modern sans-serif variable font (e.g., `Inter` or `Manrope`) for optimal readability on all devices.
*   **Dark Mode:** Implement a system-aware dark mode with smooth CSS transitions.

## 3. User Experience: "Responsive" & Fluid
**Recommendation:** Mobile-first design using **Tailwind CSS**.

*   **Fluid Layouts:** content should resize and reflow naturally. No fixed widths.
*   **Navigation:**
    *   **Desktop:** a sticky, translucent top bar.
    *   **Mobile:** A smooth, animated hamburger menu or bottom navigation bar.
*   **Animations:**
    *   **Scroll Reveal:** Sections (Experience items) should fade in and slide up as the user scrolls down.
    *   **Micro-interactions:** Subtle hover effects on links and buttons (e.g., glowing or scaling).

## 4. Content Presentation
*   **Interactive Timeline:** Transform the vertical list of experience into an interactive, scrollable timeline.
*   **Project Filtering:** Instead of a static list, use a grid of project cards that can be filtered by tag (e.g., "AI", "Neuroscience", "Signal Processing") without reloading the page.
*   **Video Integration:** Use a custom video player component that lazy-loads YouTube videos for better performance.

## 5. Implementation Roadmap
1.  **Phase 1: Setup**: Initialize Next.js project with Tailwind CSS.
2.  **Phase 2: Content Port**: Move data from `_config.yml` to structured JSON/TS files or a headless CMS (like Contentful).
3.  **Phase 3: Component Build**: Build the Hero, Timeline, and Project Card components.
4.  **Phase 4: Polish**: Add animations (Framer Motion) and 3D elements.
5.  **Phase 5: Deploy**: Set up GitHub Actions to deploy the Next.js static export to GitHub Pages.

## Immediate "Quick Wins" (Jekyll-based)
If a full rewrite is too much for now, we can:
1.  **Upgrade CSS:** Replace custom CSS with a lightweight framework like **Bulma** or **Tailwind** (via CDN).
2.  **Add AOS (Animate On Scroll):** A simple JS library to fade elements in as you scroll.
3.  **Lazy Loading:** Add `loading="lazy"` to all iframes and images.
