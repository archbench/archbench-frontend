
# React + TypeScript + Vite

> Tailwind installed; gradual migration underway. Tokens now live in `tailwind.config.js` and the Header is the first component migrated.

## Testing & CI

- Unit / integration: `npm run test` (headless) or `npm run test:ui` (Vitest UI).
- End-to-end: `npm run e2e` (Chromium) or `npm run e2e:ui` (Playwright UI). Visual snapshot baselines live under `tests/e2e/__screenshots__`.
- Refresh visual baselines: `npx playwright test --update-snapshots`.
- Inspect Playwright HTML report: `npm run e2e:report`.
- Inspect individual traces: `npx playwright show-trace trace.zip` (trace files are stored inside `test-results/`).

GitHub Actions workflow `.github/workflows/fe-ci.yml` runs Vitest + Playwright on every push / PR, installs browser dependencies, and uploads HTML reports plus raw test artifacts.

### E2E in ambienti senza bind di porte

- Avvia l'app altrove (host locale, preview, ecc.) e punta Playwright al nuovo endpoint:

  ```bash
  export E2E_BASE_URL=http://localhost:5173
  npm run e2e:remote
  ```

- Se vuoi saltare gli e2e in un ambiente bloccato:

  ```bash
  npm run e2e:skip
  ```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
