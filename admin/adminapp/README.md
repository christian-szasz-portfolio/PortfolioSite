# adminapp

The dashboard half of the local admin tool. Built into `../Admin.Api/wwwroot`, which is how it is
served; see [`../README.md`](../README.md) for the tool itself.

## How it is laid out

The same layering as the landing page, and enforced the same way. The arrow points one way:

```
data  <-  core  <-  shared  <-  layout  <-  features  <-  the shell
```

| Layer | Holds | Never |
| --- | --- | --- |
| `data/` | the shapes the service answers with | anything above it |
| `core/services/` | the one service, and the state a view reads | a component |
| `core/utils/` | the palette, the colour slots, the chart configurations | a view of its own |
| `shared/components/` | the panel, the stat tile, and the one canvas | a feature |
| `layout/` | the bar across the top | a feature |
| `features/dashboard/` | the panels, each handed the slice it draws | a sibling feature |
| `adm.component.ts` | the shell: the only thing that holds the service | drawing anything itself |

`eslint.config.js` states each of those as a rule, because convention is how a layer comes to be
crossed quietly. Two more are stated there for the same reason:

- **Only `adm-chart` holds a `Chart`.** Everything above hands over a configuration built by
  `ChartConfig` in `core/utils`, so a component that draws is testable as the thing it draws
  rather than as a rendering engine.
- **A util is a class of statics with a private constructor**, never a loose exported function:
  one name to import, and the constants that belong with the functions sitting beside them
  (`ChartTheme.SERIES`, `ChartTheme.baseOptions()`).
- **A service is marked `@Service()` and answers with an Observable, never a promise.**
  `@Service()` is Angular 22's decorator and is auto-provided, so it replaces
  `@Injectable({ providedIn: 'root' })`. `await` in a service throws away cancellation and the
  operators that make one call follow another; the state a view reads is a signal, and what fills
  it is rxjs.

`spec-coverage.spec.ts` fails the run if a component, service or util has no sibling spec, so the
layering is not the only rule the test suite can see.

---

*This project has been co-authored by Claude Code.*
