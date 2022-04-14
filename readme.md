# sql-formatter-plush
#### 安装
```sh
npm install sql-formatter-plush -S
```
#### 类型声明
```ts
export type FromatterConfig = {
    language: "db2"|'n1ql'|'pl/sql'|"plsql"|"redshift"|"spark"|"sql"|"hive" //支持的sql语言 必填
    indent?: string // 缩进多少个空格 默认两个空格
    uppercase?: boolean // 开启大写 默认 false
    linesBetweenQueries?: number  // 查询之间有多少换行符 默认为1
}

type Format = (sql: string, config?: FromatterConfig) => string

export declare const format: Format
```
#### 使用

```js
import {format} from "sql-formatter-plush"
const newSql = format(<sql语句>)

```
