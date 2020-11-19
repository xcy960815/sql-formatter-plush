import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve' //将外部引入的js打包进来
import babel from 'rollup-plugin-babel'
import del from 'rollup-plugin-delete' //
// import commonjs from '@rollup/plugin-commonjs' //将CommonJS模块转换为ES6, 方便rollup直接调用
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

const isProduction = process.env.NODE_ENV === 'production'

export default {
    input: './src/sqlFormatter.js',
    output: [
        {
            file: './dist/sqlFormatter.umd.js',
            format: 'umd',
            name: 'sqlFormatter',
        },
        {
            file: './demo/sql-formatter.umd.js',
            format: 'umd',
            name: 'sqlFormatter',
        },
    ],
    plugins: [
        //源代码更改马上清空dist文件夹下面打包过的文件 防止代码冗余
        del({ targets: ['dist', 'demo/sql-formatter.umd.js'] }),
        nodeResolve(),

        isProduction && terser(),
        babel({
            exclude: 'node_modules/**',
        }),
        // 开启服务
        !isProduction &&
            serve({
                open: false,
                host: 'localhost',
                port: 9009,
                historyApiFallback: true,
                contentBase: 'demo',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }),
        // 热更新
        !isProduction && livereload(),
    ],
}
