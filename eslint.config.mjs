// import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintRecommended from '@eslint/js'; // Importer les règles ESLint recommandées
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/vendor/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        // project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react': eslintPluginReact,
      'jsx-a11y': eslintPluginJsxA11y,
      //'react-hooks': reactHooks,
    },
    rules: {
      // ...reactHooks.configs.recommended.rules, // bug with eslint 9
      ...eslintRecommended.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off"
    },
  },
  // Configuration for JavaScript files
  {
    files: ['**/*.js', '**/*.jsx'],
    ignores: ['**/vendor/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        }
      },
    },
    plugins: {
      //'react-hooks': reactHooks,
      'react': eslintPluginReact,
      'jsx-a11y': eslintPluginJsxA11y,
    },
    rules: {
      ...eslintRecommended.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];