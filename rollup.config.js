import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import config from 'sapper/config/rollup.js'
import sapperEnv from 'sapper-environment'
import sveltePreprocess from 'svelte-preprocess'
import alias from '@rollup/plugin-alias'
import visualizer from 'rollup-plugin-visualizer';
import pkg from './package.json'

const mode = process.env.NODE_ENV
const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) => (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning)
const dedupe = (importee) => importee === 'svelte' || importee.startsWith('svelte/')

const preprocess = sveltePreprocess({
	scss: {
		includePaths: ['src']
	},
	postcss: {
		plugins: [require('autoprefixer')()]
	}
})

const aliases = alias({
	resolve: ['.js', '.svelte'],
	entries: [
		{ find: '@utils', replacement: `${__dirname}/src/utils` },
		{ find: '@store', replacement: `${__dirname}/src/store` },
		{ find: '@config', replacement: `${__dirname}/src/config` },
		{ find: '@shared', replacement: `${__dirname}/src/shared` },
		{ find: '@services', replacement: `${__dirname}/src/services` },
		{ find: '@components', replacement: `${__dirname}/src/components` },
	]
})

export default {
	client: {
		input: config.client.input(),
		output: config.client.output(),
		plugins: [
			aliases,
			replace({
				...sapperEnv(''),
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				dev,
				hydratable: true,
				preprocess
			}),
			resolve({
				browser: true,
				dedupe
			}),
			commonjs(),
			legacy &&
			babel({
				extensions: ['.js', '.mjs', '.html', '.svelte'],
				runtimeHelpers: true,
				exclude: ['node_modules/@babel/**'],
				presets: [
					[
						'@babel/preset-env',
						{
							targets: '> 0.25%, not dead'
						}
					]
				],
				plugins: [
					'@babel/plugin-syntax-dynamic-import',
					[
						'@babel/plugin-transform-runtime',
						{
							useESModules: true
						}
					]
				]
			}),
			
			!dev &&
			terser({
				module: true
			}),
			visualizer(),
		],
		
		onwarn
	},

	server: {
		input: config.server.input(),
		output: config.server.output(),
		plugins: [
			aliases,
			replace({
				'process.browser': false,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				generate: 'ssr',
				dev,
				preprocess
			}),
			resolve({
				dedupe
			}),
			commonjs(),
			visualizer(),
		],
		external: Object.keys(pkg.dependencies).concat(
			require('module').builtinModules || Object.keys(process.binding('natives'))
		),

		onwarn
	},

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			commonjs(),
			!dev && terser()
		],

		onwarn
	}
}
