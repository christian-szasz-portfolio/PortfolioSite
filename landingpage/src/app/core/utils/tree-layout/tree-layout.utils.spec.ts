import { TreeLayoutUtils, TreeNode } from './tree-layout.utils';

const leaf = (label: string): TreeNode => ({ label, route: `/${label}` });

describe('TreeLayoutUtils.layOutTree', () => {
  it('puts a lone node at the origin', () => {
    const layout = TreeLayoutUtils.layOutTree(leaf('home'));

    expect(layout.nodes.length).toBe(1);
    expect(layout.nodes[0]?.depth).toBe(0);
    expect(layout.nodes[0]?.row).toBe(0);
    expect(layout.edges).toEqual([]);
    expect(layout.rows).toBe(1);
  });

  it('gives each leaf its own row, in reading order', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [leaf('a'), leaf('b'), leaf('c')],
    });

    const rows = layout.nodes.filter((n) => n.depth === 1).map((n) => n.row);

    expect(rows).toEqual([0, 1, 2]);
    expect(layout.rows).toBe(3);
  });

  it('centres a parent on its own children', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [leaf('a'), leaf('b'), leaf('c')],
    });

    const root = layout.nodes.find((n) => n.label === 'root');

    expect(root?.row).toBe(1);
  });

  it('centres a parent between two children rather than on one of them', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [leaf('a'), leaf('b')],
    });

    expect(layout.nodes.find((n) => n.label === 'root')?.row).toBe(0.5);
  });

  it('reports how deep the tree goes', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [{ label: 'mid', route: null, children: [leaf('deep')] }],
    });

    expect(layout.depth).toBe(2);
  });

  it('draws one edge per parent and child pair', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [leaf('a'), { label: 'b', route: '/b', children: [leaf('c'), leaf('d')] }],
    });

    // root to a, root to b, then b to each of c and d.
    expect(layout.edges.length).toBe(4);
    expect(layout.edges.every((e) => e.to.depth === e.from.depth + 1)).toBe(true);
  });

  it('keeps a heading that is not itself a page', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [{ label: 'section', route: null }],
    });

    expect(layout.nodes.find((n) => n.label === 'section')?.route).toBeNull();
  });

  it('carries a fragment through when there is one', () => {
    const layout = TreeLayoutUtils.layOutTree({
      label: 'root',
      route: '/',
      children: [{ label: 'work', route: '/', fragment: 'work' }],
    });

    expect(layout.nodes.find((n) => n.label === 'work')?.fragment).toBe('work');
  });
});
