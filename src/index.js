import { Db2Formatter } from './languages/Db2Formatter'
import { N1qlFormatter } from './languages/N1qlFormatter'
import { PlSqlFormatter } from './languages/PlSqlFormatter'
import { StandardSqlFormatter as RedshiftFormatter } from './languages/RedshiftFormatter'
import { SparkSqlFormatter } from './languages/SparkSqlFormatter'
import { SparkSqlFormatter as HiveSqlFormatter } from './languages/HiveSqlFormatter'
import { StandardSqlFormatter } from './languages/StandardSqlFormatter'

const FORMATTERS = {
    db2: Db2Formatter,
    n1ql: N1qlFormatter,
    'pl/sql': PlSqlFormatter,
    plsql: PlSqlFormatter,
    redshift: RedshiftFormatter,
    spark: SparkSqlFormatter,
    sql: StandardSqlFormatter,
    hive: HiveSqlFormatter,
}

/**
 * Format whitespace in a query to make it easier to read.
 *
 * @param {String} query
 * @param {Object} cfg
 * @param {string} cfg.language Query language, default is Standard SQL
 * @param {string} cfg.indent Characters used for indentation, default is "  " (2 spaces)
 * @param {boolean} cfg.uppercase Converts keywords to uppercase
 * @param {number} cfg.linesBetweenQueries How many line breaks between queries
 * @param {Object} cfg.params Collection of params for placeholder replacement
 * @return {string}
 */

export const format = (query, cfg = {}) => {
    let Formatter = StandardSqlFormatter
    if (cfg.language !== undefined) {
        Formatter = FORMATTERS[cfg.language]
    }
    if (Formatter === undefined) {
        throw Error(`Unsupported SQL dialect: ${cfg.language}`)
    }
    return new Formatter(cfg).format(query)
}