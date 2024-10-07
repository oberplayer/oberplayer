import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

const atx = await esbuild.context(Object.assign(
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
));
atx.watch();
