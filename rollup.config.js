import typescript from 'rollup-plugin-typescript2';

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
    plugins: [
      typescript()
    ]
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
    plugins: [
      typescript()
    ]
  }
];
