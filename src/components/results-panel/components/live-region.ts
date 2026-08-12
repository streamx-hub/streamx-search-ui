import { html } from "../../../helper";

const getLiveRegion = () => {
  const liveRegionEl = document.querySelector(
    ".stx-results-panel__live-region",
  );

  if (liveRegionEl) {
    return liveRegionEl;
  }

  const resultsPanelLiveRegion = html`<div
    class="stx-results-panel__live-region stx-sr-only"
    aria-live="polite"
    aria-atomic="true"
    role="status"
  ></div>` as HTMLDivElement;

  document.body.append(resultsPanelLiveRegion);

  return resultsPanelLiveRegion;
};

export const announceResults = (message: string) => {
  const statusEl = getLiveRegion();
  statusEl.textContent = "";

  requestAnimationFrame(() => {
    statusEl.textContent = message;
  });
};
