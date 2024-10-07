import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

const atx = await esbuild.context(Object.assign(
  options,
  {
    plugins: [sassPlugin({
      type: 'css',
    })],
    format: 'iife',
    outdir: './dist/iife',
    define: {
      ENV:  JSON.stringify('local')
    },
  },
));
atx.watch();