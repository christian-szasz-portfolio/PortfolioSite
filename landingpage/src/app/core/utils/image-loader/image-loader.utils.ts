import { ImageLoaderConfig } from '@angular/common';

/** How the site resolves its own image widths, with no image service behind it */
export class ImageLoader {
  /** Builds a srcset from the site's own -640/-1280 filename convention */
  public static sized(config: ImageLoaderConfig): string {
    if (config.width === undefined) {
      return config.src;
    }

    return config.src.replace(/-\d+(\.[a-z]+)$/i, `-${config.width}$1`);
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
