import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

const atx = await esbuild.context(Object.assign(
  options,
  {
    plugins: [sassPlugin({
      type: 'css',
    })],
    splitting: true,
    format: 'esm',
    outdir: './dist/esm',
    define: {
      ENV:  JSON.stringify('local')
    },
    // dynamic import of this lib doesn't work in next js :(
    external: [
      // "@dailymotion/vast-client",
      "@dailymotion/vmap",
    ]
  },
));
atx.watch();
