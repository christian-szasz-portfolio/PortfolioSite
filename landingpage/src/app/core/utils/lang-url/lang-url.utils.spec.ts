import { LangUrlUtils } from './lang-url.utils';

describe('lang-url utils', () => {
  describe('LangUrlUtils.withLangPrefix', () => {
    it('puts the page under its language folder', () => {
      expect(LangUrlUtils.withLangPrefix('/cv', 'de-DE')).toBe('/de-DE/cv');
      expect(LangUrlUtils.withLangPrefix('/work/stack86', 'ro-RO')).toBe('/ro-RO/work/stack86');
    });

    it('names the translated home page as the router does, by its folder with the slash', () => {
      expect(LangUrlUtils.withLangPrefix('/', 'de-DE')).toBe('/de-DE/');
      expect(LangUrlUtils.withLangPrefix('', 'ro-RO')).toBe('/ro-RO/');
    });

    it('leaves the root language unprefixed, since its build is the one at the root', () => {
      expect(LangUrlUtils.withLangPrefix('/cv', '')).toBe('/cv');
      expect(LangUrlUtils.withLangPrefix('', '')).toBe('/');
    });

    it('keeps a query and the fragment after the path, where they have to be', () => {
      expect(LangUrlUtils.withLangPrefix('/#work', 'de-DE')).toBe('/de-DE/#work');
      expect(LangUrlUtils.withLangPrefix('/work/stack86#tests', 'ro-RO')).toBe(
        '/ro-RO/work/stack86#tests',
      );
      expect(LangUrlUtils.withLangPrefix('/work?from=home', 'de-DE')).toBe('/de-DE/work?from=home');
    });
  });

  describe('LangUrlUtils.withoutLangPrefix', () => {
    const prefixes = ['', 'de-DE', 'ro-RO'];

    it('reduces a prefixed path to the route it names', () => {
      expect(LangUrlUtils.withoutLangPrefix('/de-DE/work/taskly', prefixes)).toBe('/work/taskly');
      expect(LangUrlUtils.withoutLangPrefix('/ro-RO/cv', prefixes)).toBe('/cv');
    });

    it('turns a bare prefix into the root', () => {
      expect(LangUrlUtils.withoutLangPrefix('/de-DE', prefixes)).toBe('/');
      expect(LangUrlUtils.withoutLangPrefix('/de-DE/', prefixes)).toBe('/');
    });

    it('leaves an unprefixed path alone, which is the English build', () => {
      expect(LangUrlUtils.withoutLangPrefix('/cv', prefixes)).toBe('/cv');
      expect(LangUrlUtils.withoutLangPrefix('', prefixes)).toBe('/');
    });

    it('does not mistake a route that merely starts with the same letters', () => {
      expect(LangUrlUtils.withoutLangPrefix('/de-DEsigns', prefixes)).toBe('/de-DEsigns');
    });

    it('undoes what withLangPrefix did, for every language', () => {
      for (const prefix of prefixes) {
        for (const route of ['/', '/cv', '/work/taskly']) {
          expect(
            LangUrlUtils.withoutLangPrefix(LangUrlUtils.withLangPrefix(route, prefix), prefixes),
          ).toBe(route);
        }
      }
    });
  });
});
