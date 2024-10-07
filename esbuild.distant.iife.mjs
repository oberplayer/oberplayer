import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

await esbuild.build(Object.assign(
  options,
  {
    plugins: [sassPlugin({
      type: 'css',
    })],
    format: 'iife',
    outdir: './dist/iife',
    define: {
      ENV:  JSON.stringify('distant')
    },
  },
)).then(() => console.log('⚡ Styles & Scripts Compiled! ⚡ '))
  .catch(() => process.exit(1));