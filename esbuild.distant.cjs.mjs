import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

await esbuild.build(Object.assign(
  options,
  {
    plugins: [sassPlugin({
      type: 'css',
    })],
    format: 'cjs',
    outdir: './dist/cjs',
    define: {
      ENV:  JSON.stringify('local')
    },
  },
)).then(() => console.log('⚡ Styles & Scripts Compiled! ⚡ '))
.catch(() => process.exit(1));
