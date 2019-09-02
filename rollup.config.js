import sucrase from 'rollup-plugin-sucrase';
import typescript from 'rollup-plugin-typescript';

const is_publish = !!process.env.PUBLISH;

const ts_plugin = is_publish
    ? typescript({
      include: 'src/**',
      typescript: require('typescript')
    })
    : sucrase({
      transforms: ['typescript']
    });

const external = id => id.startsWith('svelte/');

export default [
  {
    input: `src/index.ts`,
    output: [
      {
        file: `index.mjs`,
        format: 'esm',
      },
      {
        file: `index.js`,
        format: 'cjs',
      }
    ],
    external,
    plugins: [ts_plugin]
  }
];
