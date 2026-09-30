/** Lays out a small tree left to right, for drawing by hand in SVG */

export interface TreeNode {
  readonly label: string;
  /** Where the entry goes, or null for a heading that is not itself a page */
  readonly route: string | null;
  readonly fragment?: string;
  readonly children?: readonly TreeNode[];
}

export interface PlacedNode {
  readonly label: string;
  readonly route: string | null;
  readonly fragment?: string;
  readonly depth: number;
  /** Row in leaf units, fractional for a parent centred on its children */
  readonly row: number;
}

export interface TreeEdge {
  readonly from: PlacedNode;
  readonly to: PlacedNode;
}

export interface TreeLayout {
  readonly nodes: readonly PlacedNode[];
  readonly edges: readonly TreeEdge[];
  readonly depth: number;
  readonly rows: number;
}

/** What one pass accumulates, so the recursion carries no state of its own */
interface Placement {
  readonly nodes: PlacedNode[];
  readonly edges: TreeEdge[];
  nextLeafRow: number;
}

export class TreeLayoutUtils {
  /** Places every node on a depth and a row, in units the component decides the size of */
  public static layOutTree(root: TreeNode): TreeLayout {
    const placement: Placement = { nodes: [], edges: [], nextLeafRow: 0 };

    TreeLayoutUtils.place(root, 0, placement);

    const depth = placement.nodes.reduce((most, node) => Math.max(most, node.depth), 0);

    return {
      nodes: placement.nodes,
      edges: placement.edges,
      depth,
      rows: Math.max(placement.nextLeafRow, 1),
    };
  }

  /** Places one node under its parent, advancing the leaf cursor as it descends */
  private static place(node: TreeNode, depth: number, placement: Placement): PlacedNode {
    const children = node.children ?? [];

    if (children.length === 0) {
      const leaf: PlacedNode = {
        label: node.label,
        route: node.route,
        ...(node.fragment === undefined ? {} : { fragment: node.fragment }),
        depth,
        row: placement.nextLeafRow,
      };
      placement.nextLeafRow += 1;
      placement.nodes.push(leaf);
      return leaf;
    }

    const placedChildren = children.map((child) =>
      TreeLayoutUtils.place(child, depth + 1, placement),
    );
    const first = placedChildren[0];
    const last = placedChildren[placedChildren.length - 1];
    const row = first === undefined || last === undefined ? 0 : (first.row + last.row) / 2;

    const parent: PlacedNode = {
      label: node.label,
      route: node.route,
      ...(node.fragment === undefined ? {} : { fragment: node.fragment }),
      depth,
      row,
    };

    placement.nodes.push(parent);
    for (const child of placedChildren) {
      placement.edges.push({ from: parent, to: child });
    }
    return parent;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
