import { ImageLoader } from './image-loader.utils';

describe('ImageLoader.sized', () => {
  it('replaces the width in the filename with the one asked for', () => {
    expect(ImageLoader.sized({ src: 'assets/img/stack86-1280.jpg', width: 640 })).toBe(
      'assets/img/stack86-640.jpg',
    );
    expect(ImageLoader.sized({ src: 'assets/img/stack86-1280.jpg', width: 1280 })).toBe(
      'assets/img/stack86-1280.jpg',
    );
  });

  it('hands back a source with no width descriptor', () => {
    expect(ImageLoader.sized({ src: 'assets/img/stack86-1280.jpg' })).toBe(
      'assets/img/stack86-1280.jpg',
    );
  });

  it('leaves a source that carries no width suffix untouched', () => {
    expect(ImageLoader.sized({ src: 'assets/img/og-card.png', width: 640 })).toBe(
      'assets/img/og-card.png',
    );
  });

  it('keeps the extension it was given', () => {
    expect(ImageLoader.sized({ src: 'a/b-1280.webp', width: 640 })).toBe('a/b-640.webp');
  });
});
