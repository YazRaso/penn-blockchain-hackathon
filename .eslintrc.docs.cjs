module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  plugins: ['tsdoc', 'jsdoc'],
  extends: [],
  rules: {
    // Validates TSDoc syntax in /** */ blocks
    'tsdoc/syntax': 'error',

    // Enforce documentation for exported API surface
    'jsdoc/require-jsdoc': ['error', {
      require: {
        ClassDeclaration: false,
        MethodDefinition: false,
        FunctionDeclaration: false,
        ArrowFunctionExpression: false,
      },
      contexts: [
        'ExportNamedDeclaration > ClassDeclaration',
        'ExportNamedDeclaration > FunctionDeclaration',
        'ExportNamedDeclaration > TSInterfaceDeclaration',
        'ExportNamedDeclaration > TSTypeAliasDeclaration',
        'ExportNamedDeclaration > TSEnumDeclaration',
        'ExportNamedDeclaration > VariableDeclaration',
        'ExportDefaultDeclaration > ClassDeclaration',
        'ExportDefaultDeclaration > FunctionDeclaration',
      ],
      publicOnly: false,
      enableFixer: false,
    }],
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
  ignorePatterns: ['dist/**', 'node_modules/**', 'docs/**'],
}
