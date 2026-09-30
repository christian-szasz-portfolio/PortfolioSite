import { DOCUMENT, Service, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { cv } from '../../../../data/cv.data';

/** Where the photograph lands inside the archive, rather than where it is served */
const PHOTO_ENTRY = 'img/photo.jpg';
const STYLE_ENTRY = 'css/cv.css';
const PAGE_ENTRY = 'CV_Christian_Szasz.html';

/** What the sheet needs around it once it is on its own again */
const BASELINE = `html, body { margin: 0; padding: 0; }
body {
    display: flex;
    justify-content: center;
    padding: 8mm 0;
    background-color: #d9d9d9;
}
@page { size: A4; margin: 0; }
@media print {
    body { display: block; padding: 0; background-color: transparent; }
}`;

/** Builds the CV source archive from the rendered sheet, so the download cannot drift */
@Service()
export class CvExportService {
  private readonly document = inject(DOCUMENT);

  public collect(sheet: HTMLElement): Observable<Record<string, Uint8Array | string>> {
    const markup = this.markupFor(sheet);
    const styles = `${BASELINE}

${this.stylesFor(sheet)}`;

    // The photograph is the one part that cannot be rebuilt from the DOM
    return fromFetch(cv.profile.photo).pipe(
      switchMap((response) => {
        if (!response.ok) {
          throw new Error(`${cv.profile.photo} answered ${response.status}`);
        }
        return from(response.arrayBuffer());
      }),
      map((buffer) => ({
        [PAGE_ENTRY]: markup,
        [STYLE_ENTRY]: styles,
        [PHOTO_ENTRY]: new Uint8Array(buffer),
      })),
    );
  }

  /** A whole document around the sheet, pointing at the files beside it */
  private markupFor(sheet: HTMLElement): string {
    // Into a document with no window, where a rewritten src is never fetched
    const inert = this.document.implementation.createHTMLDocument('');
    const copy = inert.importNode(sheet, true);
    if (!(copy instanceof HTMLElement)) {
      throw new Error('the sheet did not clone into an element');
    }

    this.stripFramework(copy);
    this.restoreMain(copy);

    for (const image of copy.querySelectorAll('img')) {
      image.setAttribute('src', PHOTO_ENTRY);
    }

    // A component-host root (lpg-*) has no clean tag to keep, so emit its contents.
    const body = copy.tagName.includes('-') ? copy.innerHTML : copy.outerHTML;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${cv.documentTitle}</title>
    <meta name="author" content="${cv.profile.name}">
    <meta name="description" content="${cv.description}">
    <link rel="stylesheet" href="${STYLE_ENTRY}">
</head>
<body>

${body}

</body>
</html>
`;
  }

  /** On its own the sheet is the page, so its body column is the main landmark again */
  private restoreMain(root: HTMLElement): void {
    for (const column of Array.from(root.querySelectorAll('.cv__main'))) {
      const main = root.ownerDocument.createElement('main');
      for (const name of column.getAttributeNames()) {
        main.setAttribute(name, column.getAttribute(name) ?? '');
      }
      main.append(...Array.from(column.childNodes));
      column.replaceWith(main);
    }
  }

  /** Strips every Angular attribute, class, host tag and comment from the clone */
  private stripFramework(root: HTMLElement): void {
    for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
      for (const name of element.getAttributeNames()) {
        if (this.isFrameworkAttribute(name)) {
          element.removeAttribute(name);
        }
      }
      this.stripFrameworkClasses(element);
    }

    // Document order, so an outer host is unwrapped while it still has a parent
    for (const host of Array.from(root.querySelectorAll('*'))) {
      if (host.tagName.includes('-')) {
        host.replaceWith(...Array.from(host.childNodes));
      }
    }

    this.stripComments(root);
  }

  /** Encapsulation, hydration and directive attributes; no standard attribute starts with `lpg` */
  private isFrameworkAttribute(name: string): boolean {
    return (
      name.startsWith('_ng') ||
      name.startsWith('ng-') ||
      name === 'ngh' ||
      name === 'ngskiphydration' ||
      /^lpg[a-z]/.test(name)
    );
  }

  /** The state classes Angular maintains, such as `ng-star-inserted` */
  private stripFrameworkClasses(element: Element): void {
    if (!element.hasAttribute('class')) {
      return;
    }

    for (const name of Array.from(element.classList)) {
      if (name.startsWith('ng-')) {
        element.classList.remove(name);
      }
    }

    // An element left with an empty class attribute is a trace of its own
    if (element.classList.length === 0) {
      element.removeAttribute('class');
    }
  }

  /** Angular anchors each control flow block on a comment node; the archive keeps none */
  private stripComments(root: HTMLElement): void {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const found: Comment[] = [];

    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      found.push(node as Comment);
    }

    // Collected first: removing during the walk moves the walker
    for (const comment of found) {
      comment.remove();
    }
  }

  /** Every rule in the page that actually reaches this sheet */
  private stylesFor(sheet: HTMLElement): string {
    const kept: string[] = [];

    for (const styleSheet of Array.from(this.document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = styleSheet.cssRules;
      } catch {
        // A sheet the page is not allowed to read has nothing to contribute
        continue;
      }

      for (const rule of Array.from(rules)) {
        kept.push(...this.keep(rule, sheet));
      }
    }

    return kept.join('\n');
  }

  private keep(rule: CSSRule, sheet: HTMLElement): string[] {
    if (rule instanceof CSSStyleRule) {
      if (!this.reaches(rule.selectorText, sheet)) {
        return [];
      }
      // Matched against the live DOM, emitted with a framework-free selector
      const selector = this.cleanSelector(rule.selectorText);
      return selector === '' ? [] : [`${selector} { ${rule.style.cssText} }`];
    }

    // Layers and media blocks are containers, so look at what is inside them
    if (rule instanceof CSSMediaRule) {
      const inner = this.inside(rule.cssRules, sheet);
      return inner.length === 0 ? [] : [`@media ${rule.conditionText} {\n${inner.join('\n')}\n}`];
    }

    if (rule instanceof CSSSupportsRule) {
      const inner = this.inside(rule.cssRules, sheet);
      return inner.length === 0
        ? []
        : [`@supports ${rule.conditionText} {\n${inner.join('\n')}\n}`];
    }

    if (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule) {
      // Unwrapped: the archive has no cascade layers to order it against
      return this.inside(rule.cssRules, sheet);
    }

    return [];
  }

  private inside(rules: CSSRuleList, sheet: HTMLElement): string[] {
    return Array.from(rules).flatMap((rule) => this.keep(rule, sheet));
  }

  /** True when any half of a selector list lands on the sheet or inside it */
  private reaches(selectorText: string, sheet: HTMLElement): boolean {
    return selectorText.split(',').some((part) => {
      const selector = this.matchable(part);
      if (selector === '') {
        return false;
      }

      try {
        return sheet.matches(selector) || sheet.querySelector(selector) !== null;
      } catch {
        // A selector this browser will not parse cannot be matched either
        return false;
      }
    });
  }

  /** Strips encapsulation attributes and lpg-* hosts from a selector, or '' if nothing is left */
  private cleanSelector(selectorText: string): string {
    return selectorText
      .split(',')
      .map((part) =>
        part
          .replace(/\[_nghost-[^\]]*\]/g, '')
          .replace(/\[_ngcontent-[^\]]*\]/g, '')
          .replace(/\[ng-[^\]]*\]/g, '')
          .trim(),
      )
      .filter((part) => part !== '' && !part.includes('lpg-'))
      .join(', ');
  }

  /** A pseudo-element is judged by the element it hangs off, or bullets vanish from the export */
  private matchable(selector: string): string {
    return selector
      .replace(/::[a-zA-Z-]+(\([^)]*\))?/g, '')
      .replace(/:(before|after|first-line|first-letter)(?![\w-])/g, '')
      .trim();
  }
}
