import typescript from 'rollup-plugin-typescript';

const ts_plugin = typescript({
  include: 'src/**',
  typescript: require('typescript')
});

const external = id => id.startsWith('svelte/');

export default [
  {
    input: `src/local.ts`,
    output: [
      {
        file: `local.mjs`,
        format: 'esm',
      },
      {
        file: `local.js`,
        format: 'cjs',
      }
    ],
    external,
    plugins: [ts_plugin]
  },
  {
    input: `src/session.ts`,
    output: [
      {
        file: `session.mjs`,
        format: 'esm',
      },
      {
        file: `session.js`,
        format: 'cjs',
      }
    ],
    external,
    plugins: [ts_plugin]
  }
];
