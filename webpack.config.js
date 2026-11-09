const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const CopyPlugin = require('copy-webpack-plugin');

// drop the RTL stylesheet copies wp-scripts emits, the styles use logical properties instead
const plugins = defaultConfig.plugins.filter(p => !(Object.values(p).length === 2 && Object.values(p)?.[1]?.filename === '[name]-rtl.css'));

// css-loader leaves url(./alsl) alone: it is a marker for the build folder (--alsl-build in style.scss), not a file
const MARKER = /^(\.\/)?alsl$/;
const rules = defaultConfig.module.rules.map(rule => (Array.isArray(rule.use) ? {
	...rule,
	use: rule.use.map(use => (use && use.options && 'importLoaders' in use.options
		? { ...use, options: { ...use.options, url: { filter: url => !MARKER.test(url) } } }
		: use))
} : rule));

module.exports = {
	...defaultConfig,
	module: { ...defaultConfig.module, rules },
	// the lazy chunks get a version, so a browser never mixes a cached old chunk with a new view.js
	output: { ...defaultConfig.output, chunkFilename: '[name].js?ver=[contenthash:8]' },
	// each library gets its own chunk under its own name (readme.txt names them), loaded only when needed
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			...defaultConfig.optimization.splitChunks,
			cacheGroups: {
				...defaultConfig.optimization.splitChunks.cacheGroups,
				leaflet: { test: /[\\/]node_modules[\\/]leaflet[\\/]/, name: 'leaflet', chunks: 'async', enforce: true },
				markercluster: { test: /[\\/]node_modules[\\/]leaflet\.markercluster[\\/]/, name: 'leaflet.markercluster', chunks: 'async', enforce: true },
				// the CSV import in the editor, never on the site
				papaparse: { test: /[\\/]node_modules[\\/]papaparse[\\/]/, name: 'papaparse', chunks: 'async', enforce: true }
			}
		}
	},
	plugins: [
		...plugins,
		new CopyPlugin({
			patterns: [
				{ from: 'node_modules/leaflet/LICENSE', to: 'leaflet-LICENSE.txt' },
				{ from: 'node_modules/leaflet.markercluster/MIT-LICENCE.txt', to: 'leaflet.markercluster-LICENSE.txt' },
				{ from: 'node_modules/papaparse/LICENSE', to: 'papaparse-LICENSE.txt' }
			]
		})
	]
};
