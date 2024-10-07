import * as esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import options from './esbuild.config.mjs';

await esbuild.build(Object.assign(
  options,
  {
    plugins: [sassPlugin({
      type: 'css',
    })],
    splitting: true,
    format: 'esm',
    outdir: './dist/esm',
    define: {
      ENV:  JSON.stringify('distant')
    },
    // dynamic import of this lib doesn't work in next js :(
    external: [
      // "@dailymotion/vast-client",
      "@dailymotion/vmap",
    ]
  },
)).then(() => console.log('⚡ Styles & Scripts Compiled! ⚡ '))
  .catch(() => process.exit(1));