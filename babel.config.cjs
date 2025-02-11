module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: 'commonjs',
      },
    ],
  ],
  plugins: [
    '@babel/plugin-syntax-import-assertions',
    '@babel/plugin-syntax-dynamic-import',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@utils': './src/utils',
          '@config': './src/config',
          '@tests': './tests',
          '@src': './src',
          '@core': './src/core',
          '@cli': './src/cli',
          '@common': './src/utils/common',
          '@test': './tests',
          '@test-utils': './tests/__common__/utils',
          '@test-helpers': './tests/__common__/helpers',
          '@test-mocks': './tests/__common__/mocks',
          '@test-fixtures': './tests/__common__/fixtures',
        },
      },
    ],
  ],
};
