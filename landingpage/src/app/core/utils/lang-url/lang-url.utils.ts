/**
 * Reading and writing the language part of an address. Each language is a folder of its own
 * prerendered files, so the path names it: `/de-DE/cv` is the German CV, and English, the build
 * at the root, needs no prefix at all.
 */
export class LangUrlUtils {
  /** The same address under a language's folder, keeping any query and the fragment last */
  public static withLangPrefix(url: string, subPath: string): string {
    if (subPath === '') {
      return url === '' ? '/' : url;
    }

    const at = url.search(/[?#]/);
    const path = at < 0 ? url : url.slice(0, at);
    const tail = at < 0 ? '' : url.slice(at);

    // A translated home page keeps its slash, the form Angular writes it in: its base href is the
    // folder, so that is where the router puts the reader, and the host serves both forms alike
    const route = path === '' || path === '/' ? '/' : path;
    return `/${subPath}${route}${tail}`;
  }

  /** The same path with any language prefix removed, so every language reduces to one route */
  public static withoutLangPrefix(pathname: string, prefixes: readonly string[]): string {
    for (const prefix of prefixes) {
      if (prefix === '') {
        continue;
      }

      const head = `/${prefix}`;
      if (pathname === head) {
        return '/';
      }
      if (pathname.startsWith(`${head}/`)) {
        return pathname.slice(head.length);
      }
    }

    return pathname === '' ? '/' : pathname;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
