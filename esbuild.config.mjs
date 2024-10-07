export default {
  metafile: true,
  sourcemap: true,
  bundle: true,
  minify: true,
  loader: {
    '.js': 'jsx',
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
  entryPoints: ['./src/oberplayer.jsx'],
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
};
