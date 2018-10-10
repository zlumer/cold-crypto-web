const { FuseBox, WebIndexPlugin, QuantumPlugin } = require("fuse-box")

const fuse = FuseBox.init({
  homeDir: "src",
  output: 'dist/$name.js',
  sourceMaps: { inline: false, vendor: false },
  useTypescriptCompiler : true,
  plugins: [
    WebIndexPlugin({
      template: "src/client/index.html",
			bundles: [ 'public/vendor', 'public/client' ]
    }),
    this.isProduction &&
      QuantumPlugin({
        css: true,
        uglify: true
      })
  ],
})

fuse.dev()

fuse
  .bundle('public/vendor')
  .instructions("~client/index.tsx")
  .target('browser')

fuse
  .bundle("public/client")
  .instructions(">[client/index.tsx]")
  .target('browser')
  .hmr()
  .watch()

fuse
	.bundle('server')
	.instructions('>[server/index.ts]')
	.target('server@es2017')
	.watch('src/server/**')
	.hmr()
	.completed((proc) => {
		proc.require({
			close: ({ FuseBox }) => FuseBox.import(FuseBox.mainFile).shutdown()
		})
	})

fuse.run()
