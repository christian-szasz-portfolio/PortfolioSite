import { doc } from 'prettier';
import { printers } from 'prettier/plugins/estree';

const estree = printers.estree;
const importDeclaration = 'ImportDeclaration';

/** Prettier's own printer, except an import never wraps */
export default {
  printers: {
    estree: {
      ...estree,
      print(path, options, print, args) {
        const printed = estree.print(path, options, print, args);
        if (path.node.type !== importDeclaration) {
          return printed;
        }
        return doc.printer.printDocToString(printed, { ...options, printWidth: Infinity }).formatted;
      },
    },
  },
};
