/**
 * Optional GSAP bridge. Loaded only when `syncGsap` is true so `gsap` can
 * stay an optional peer dependency.
 */
export interface GsapBridge {
  /** Hook Lenis.raf into the GSAP ticker. Returns a detach function. */
  attach(lenis: { raf: (time: number) => void }): () => void;
  /** Keep ScrollTrigger in sync with Lenis scroll. */
  onScroll(): void;
  /** Re-measure triggers after a route change or layout shift. */
  refresh(): void;
}

export async function loadGsapBridge(): Promise<GsapBridge | null> {
  try {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);
    return {
      attach(lenis) {
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        return () => gsap.ticker.remove(tick);
      },
      onScroll() {
        ScrollTrigger.update();
      },
      refresh() {
        ScrollTrigger.refresh();
      },
    };
  } catch {
    return null;
  }
}
