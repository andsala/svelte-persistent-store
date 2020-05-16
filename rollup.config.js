import typescript from 'rollup-plugin-typescript2';

const distDir = 'dist';

const external = id => id.startsWith('svelte/');

const getBundle = (baseName) => ({
  input: `src/${baseName}.ts`,
  output: [
    {
      file: `${distDir}/${baseName}.mjs`,
      format: 'esm',
    },
    {
      file: `${distDir}/${baseName}.js`,
      format: 'cjs',
    }
  ],
  external,
  plugins: [
    typescript({
      tsconfig: "tsconfig.rollup.json"
    })
  ]
});

export default [
  getBundle('local'),
  getBundle('session'),
];
