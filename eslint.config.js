import js from "@eslint/js";
import eslintParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginReact from 'eslint-plugin-react';
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tailwind from "eslint-plugin-tailwindcss";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "*.config.js"] },
  {
    extends: [
      js.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      importPlugin.flatConfigs.recommended,
      ...tseslint.configs.recommended,
      ...tailwind.configs["flat/recommended"],
      eslintPluginPrettierRecommended,
       pluginReact.configs.flat.recommended,
    ],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: eslintParser,
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "jsx-a11y/control-has-associated-label": [
        2,
        {
          ignoreElements: ["th", "tr", "video"],
        },
      ],
      "jsx-a11y/label-has-associated-control": 0,
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": 0,
      "react/jsx-props-no-spreading": 0,
      "react/destructuring-assignment": 0,
      "react/react-in-jsx-scope": 0,
      "react/prop-types": "off",
      "react/require-default-props": 0,
      "eslint-comments/disable-enable-pair": 0,
      "eslint-comments/no-unlimited-disable": 0,
      "import/extensions": 0,
      "import/no-extraneous-dependencies": "off",
      "import/no-unresolved": 0,
      "import/no-anonymous-default-export": 0,
      "import/prefer-default-export": "warn",
    },
  },
);
