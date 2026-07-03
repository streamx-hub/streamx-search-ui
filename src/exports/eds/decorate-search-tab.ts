export default function decorate(block: HTMLElement) {
  // hidding the stx-tab blocks as thery are only providing the configs for the stx-tabs
  block.classList.add("stx-hidden");

  if (!document.querySelector(".stx-tabs")) {
    // eslint-disable-next-line no-console
    console.error(
      "The `stx-tab` blocks provides config for the `stx-tabs` block. The `stx-tabs` block is not found!. Please make sure you added it to the page before the `stx-tab`!",
    );
  }
}
