module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "unused-imports",
    "typescript-sort-keys",
    "import",
  ],
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "**/*.d.ts"],
  rules: {
    "import/newline-after-import": ["error"],
    "import/extensions": "off",
    "import/no-extraneous-dependencies": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/no-shadow": "off",
    "@typescript-eslint/naming-convention": "off",
    "@typescript-eslint/no-loop-func": "off",
    "@typescript-eslint/no-inferrable-types": "warn",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/ban-types": ["off"],
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/no-use-before-define": "warn",
    "@typescript-eslint/comma-dangle": [
      "off",
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "always-multiline",
        generics: "always-multiline",
      },
    ],
    "@typescript-eslint/comma-spacing": [
      "off",
      {
        before: false,
        after: true,
      },
    ],
    "@typescript-eslint/quotes": [
      0,
      "single",
      {
        avoidEscape: true,
      },
    ],
    "typescript-sort-keys/string-enum": [
      "warn",
      "asc",
      { caseSensitive: true },
    ],
    "import/order": [
      "error",
      {
        pathGroups: [
          {
            pattern: "~/**",
            group: "external",
            position: "after",
          },
        ],
        groups: [
          ["builtin", "external"],
          ["internal", "parent", "sibling", "index"],
        ],
      },
    ],
    "no-console": "error",
    "no-debugger": "error",
    "no-var": "error",
    "no-nested-ternary": "off",
    "no-unneeded-ternary": "warn",
    "no-empty-pattern": "error",
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
    "no-restricted-exports": "off",
    "object-shorthand": "error",
    "prefer-destructuring": "warn",
    "object-curly-newline": [
      "off",
      {
        ObjectExpression: {
          minProperties: 4,
          multiline: true,
          consistent: true,
        },
        ObjectPattern: {
          minProperties: 4,
          multiline: true,
          consistent: true,
        },
        ImportDeclaration: {
          minProperties: 4,
          multiline: true,
          consistent: true,
        },
        ExportDeclaration: {
          minProperties: 4,
          multiline: true,
          consistent: true,
        },
      },
    ],
    "object-curly-spacing": ["off", "always"],
    "object-property-newline": [
      "off",
      {
        allowAllPropertiesOnSameLine: true,
        allowMultiplePropertiesPerLine: false,
      },
    ],
    "operator-linebreak": ["off"],
    "implicit-arrow-linebreak": ["off", "beside"],
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "padding-line-between-statements": [
      "error",
      {
        blankLine: "always",
        prev: "*",
        next: "return",
      },
    ],
  },
};
