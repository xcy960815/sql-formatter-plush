
/**
 * language sql类型
 * indent: 缩进 默认两个空格
 * uppercase: 是否大写 默认false
 * linesBetweenQueries: 查询之间的行
 * commabefore : 逗号前置 暂时不可用
 */
export type FromatterConfig = {
    language: "db2"|'n1ql'|'pl/sql'|"plsql"|"redshift"|"spark"|"sql"|"hive"
    indent?: string
    uppercase?: boolean
    linesBetweenQueries?: number
    commabefore?: boolean
}

type Format = (sql: string, config?: FromatterConfig) => string

export declare const format: Format


