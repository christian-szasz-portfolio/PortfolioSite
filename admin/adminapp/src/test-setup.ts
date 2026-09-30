/** jsdom has no 2d context, so answer plainly rather than forty times over. */
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (): null => null;
}
