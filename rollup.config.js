import {
    terser
} from 'rollup-plugin-terser'
import babel from 'rollup-plugin-babel'
import del from 'rollup-plugin-delete' //

import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

const isProduction = process.env.NODE_ENV === 'production'
const isDev = !isProduction
const initRollupConfig = () => {
    const output = []
    if (isProduction) {
        output.push({
            file: './dist/sql-formatter.umd.js',
            format: 'umd',
            name: 'sqlFormatter',
        })
    }
    if (isDev) {
        output.push({
            file: './demo/sql-formatter.umd.js',
            format: 'umd',
            name: 'sqlFormatter',
        }, {
            file: './dist/sql-formatter.umd.js',
            format: 'umd',
            name: 'sqlFormatter',
        })
    }
    const plugins = [babel({
        exclude: 'node_modules/**',
    }), del({
        targets: ['dist', 'demo/sql-formatter.umd.js']
    }), ]

    if (isProduction) {
        plugins.push(...[terser()])
    }

    if (isDev) {
        plugins.push(...[serve({
            open: false,
            host: 'localhost',
            port: 9009,
            historyApiFallback: true,
            contentBase: 'demo',
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }), livereload()])
    }
    return {
        input: './src/index.js',
        output,
        plugins: plugins
    }
}
export default initRollupConfig()