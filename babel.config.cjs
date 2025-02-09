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
  ],
};
