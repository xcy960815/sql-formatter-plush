import Formatter from '../core/Formatter'
import Tokenizer from '../core/Tokenizer'
import tokenTypes from '../core/tokenTypes'

const reservedWords = [
    'ADD', //xx
    'ADMIN', //xx
    'ANALYZE', //
    'ARCHIVE', //xx
    'ASC', //
    'BEFORE', //xx
    'BUCKET', //xx
    'BUCKETS', //xx
    'CASCADE', //
    'CASE', //
    'CHANGE', //xx
    'CLUSTER', //xx
    'CLUSTERED', //xx
    'CLUSTERSTATUS', //xx
    'COLLECTION', //xx
    'COLUMN', //
    'COLUMNS', //
    'COMMENT', //
    'COMPACT', //xx
    'COMPACTIONS', //xx
    'COMPUTE', //xx
    'CONCATENATE', //xx
    'CONF', //xx
    'CONTINUE', //xx
    'CUBE', //xx
    'DATA', //xx
    'DATABASES', //
    'DATETIME', //xx
    'DAY', //xx
    'DBPROPERTIES', //
    'DEFERRED', //xx
    'DEFINED', //xx
    'DELIMITED', //xx
    'DEPENDENCY', //xx
    'DESC', //
    'DIRECTORIES', //xx
    'DIRECTORY', //xx
    'DISABLE', //xx
    'DISTRIBUTE', //xx
    'ELEM_TYPE', //xx
    'ENABLE', //xx
    'ESCAPED', //xx
    'EXCHANGE', //xx
    'EXCLUSIVE', //xx
    'EXPLAIN', //xx
    'EXPORT', //
    'FILE', //
    'FILEFORMAT', //xx
    'FIRST', //xx
    'FORMAT', //xx
    'FORMATTED', //xx
    'FUNCTIONS', //xx
    'HOLD_DDLTIME', //xx
    'HOUR', //
    'IDXPROPERTIES', //xx
    'IGNORE', //xx
    'INDEX', //
    'INDEXES', //
    'INPATH', //xx
    'INPUTDRIVER', //xx
    'INPUTFORMAT', //xx
    'IS',
    'ITEMS', //xx
    'JAR', //xx
    'KEYS', //
    'KEY_TYPE', //xx
    'LATERAL', //xx
    'LINES', //xx
    'LOAD', //xx
    'LOCAL', //xx
    'LOCK', //xx
    'LOCKS', //xx
    'LOGICAL', //xx
    'LONG', //xx
    'MAPJOIN', //xx
    'MATERIALIZED', //xx
    'MINUS', //xx
    'MINUTE', //
    'MONTH', //
    'MSCK', //xx
    'NOSCAN', //xx
    'NO_DROP', //xx
    'OFFLINE', //xx
    'OPTION', //xx
    'ORDER', //xx
    'OUTPUTDRIVER', //xx
    'OUTPUTFORMAT', //xx
    'OVER', //xx
    'OVERWRITE', //xx
    'OWNER', //xx
    'PARTIALSCAN', //xx
    'PARTITION', //
    'PARTITIONED', //xx
    'PARTITIONS', //
    'PLUS', //xx
    'PRECEDING', //xx
    'PRESERVE', //xx
    'PRETTY', //xx
    'PRINCIPALS', //xx
    'PROTECTION', //xx
    'PURGE', //xx
    'READ', //xx
    'READONLY', //xx
    'REBUILD', //xx
    'RECORDREADER', //xx
    'RECORDWRITER', //xx
    'RELOAD', //xx
    'RENAME', //xx
    'REPAIR', //xx
    'REPLACE', //
    'RESTRICT', //xx
    'REWRITE', //xx
    'ROLE', //xx
    'ROLES', //xx
    'ROLLUP', //xx
    'SCHEMA', //xx
    'SCHEMAS', //xx
    'SECOND', //
    'SEMI', //xx
    'SERDE', //xx
    'SERDEPROPERTIES', //xx
    'SERVER', //xx
    'SETS', //xx
    'SHARED', //xx
    'SHOW', //xx
    'SHOW_DATABASE', //xx
    'SKEWED', //xx
    'SORT', //xx
    'SORTED', //xx
    'SSL', //xx
    'STATISTICS', //xx
    'STORED', //xx
    'STREAMTABLE', //xx
    'STRING', //
    'STRUCT', //
    'TABLE', //
    'TABLES', //
    'TABLESAMPLE', //xx
    'TEMPORARY', //
    'TERMINATED', //
    'TINYINT', //xx
    'TOUCH', //xx
    'TRANSACTIONS', //xx
    'UNARCHIVE', //xx
    'UNDO', //xx
    'UNIONTYPE', //xx
    'UNLOCK', //xx
    'UNSET', //xx
    'UNSIGNED', //
    'URI', //xx
    'USE', //
    'UTC', //xx
    'UTCTIMESTAMP', //xx
    'VALUE_TYPE', //xx
    'VIEW', //
    'WHILE', //xx
    'YEAR', //xx
    'ALL', //xx
    'ALTER', //xx
    'ARRAY', //xx
    'AS', //
    'AUTHORIZATION', //xx
    'BETWEEN', //
    'BIGINT', //
    'BINARY', //xx
    'BOOLEAN', //xx
    'BOTH', //xx
    'BY', //xx
    'CAST', //xx
    'CHAR', //xx
    'CROSS', //xx
    'CURRENT', //xx
    'CURRENT_DATE', //
    'CURRENT_TIMESTAMP', //
    'CURSOR', //xx
    'DATABASE', //
    'DATE', //xx
    'DECIMAL', //xx
    'DELETE', //
    'DESCRIBE', //
    'DISTINCT', //
    'DOUBLE', //xx
    'DROP', //xx
    'ELSE', //
    'END', //
    'EXISTS', //
    'EXTENDED', //xx
    'EXTERNAL', //xx
    'FALSE', //xx
    'FETCH', //xx
    'FLOAT', //xx
    'FOLLOWING', //xx
    'FOR', //xx
    'FULL', //
    'FUNCTION', //
    'GRANT', //
    'GROUP', //xx
    'GROUPING', //xx
    'IF', //
    'IMPORT', //
    'IN', //
    'INNER', //
    'INT', //xx
    'INTERVAL', //
    'INTO', //
    'IS',
    'LESS', //xx
    'LIKE', //
    'MACRO', //xx
    'MAP', //xx
    'MORE', //xx
    'NONE', //xx
    'NOT', //
    'NULL', //xx
    'OF', //xx
    'ON', //
    'OUT', //xx
    'OUTER', //xx
    'PERCENT', //xx
    'PROCEDURE', //xx
    'READS', //xx
    'REDUCE', //xx
    'REGEXP', //
    'REVOKE', //xx
    'RIGHT', //xx
    'RLIKE', //
    'SET', //
    'SMALLINT', //xx
    'THEN', //
    'TIMESTAMP', //xx
    'TO', //
    'TRANSFORM', //
    'TRIGGER', //xx
    'TRUE', //
    'TRUNCATE', //
    'UNBOUNDED', //
    'UNIQUEJOIN', //xx
    'USER', //xx
    'VARCHAR', //xx
    'WITH', //
]

const reservedTopLevelWords = [
    'AFTER',
    'ALTER COLUMN', //
    'ALTER DATABASE',
    'ALTER SCHEMA',
    'ALTER TABLE',
    'DELETE FROM', //
    'DISTRIBUTE BY',
    'FROM', //
    'GROUP BY', //
    'HAVING',
    'INSERT INTO', //
    'INSERT', //
    'LIMIT',
    'OPTIONS',
    'ORDER BY', //
    'PARTITION BY',
    'PARTITIONED BY', //
    'RANGE',
    'SELECT',
    'SET CURRENT SCHEMA',
    'SET SCHEMA',
    'TBLPROPERTIES', //
    'UPDATE', //
    'USING', //
    'VALUES', //
    'WHERE', //
    'WINDOW', //
]

const reservedTopLevelWordsNoIndent = [
    'EXCEPT ALL',
    'EXCEPT',
    'INTERSECT ALL',
    'INTERSECT', //
    'UNION ALL',
    'UNION', //
]

const reservedNewlineWords = [
    'LEFT',
    'LOCATION',
    'ROWS',
    'ROW',
    'FIELDS',
    'AND', //
    'ANTI JOIN',
    'CREATE OR', //
    'CREATE', //
    'CROSS JOIN',
    'ELSE', //
    'FULL OUTER JOIN',
    'INNER JOIN', //
    'JOIN',
    'LATERAL VIEW',
    'LEFT ANTI JOIN',
    'LEFT JOIN',
    'LEFT OUTER JOIN',
    'LEFT SEMI JOIN',
    'NATURAL ANTI JOIN',
    'NATURAL FULL OUTER JOIN',
    'NATURAL INNER JOIN',
    'NATURAL JOIN',
    'NATURAL LEFT ANTI JOIN',
    'NATURAL LEFT OUTER JOIN',
    'NATURAL LEFT SEMI JOIN',
    'NATURAL OUTER JOIN',
    'NATURAL RIGHT OUTER JOIN',
    'NATURAL RIGHT SEMI JOIN',
    'NATURAL SEMI JOIN',
    'OR',
    'OUTER APPLY',
    'OUTER JOIN',
    'RIGHT JOIN',
    'RIGHT OUTER JOIN',
    'RIGHT SEMI JOIN',
    'SEMI JOIN',
    'WHEN', //
    'XOR',
]

export default class SparkSqlFormatter extends Formatter {
    static tokenizer = new Tokenizer({
        reservedWords,
        reservedTopLevelWords,
        reservedNewlineWords,
        reservedTopLevelWordsNoIndent,
        stringTypes: [`""`, "''", '``', '{}'],
        openParens: ['(', 'CASE'],
        closeParens: [')', 'END'],
        indexedPlaceholderTypes: ['?'],
        namedPlaceholderTypes: ['$'],
        lineCommentTypes: ['--', '-- '],
        specialWordChars: [':', '/', '.'],
    })

    tokenOverride(token) {
        // Fix cases where names are ambiguously keywords or functions
        if (
            token.type === tokenTypes.RESERVED_TOP_LEVEL &&
            token.value.toUpperCase() === 'WINDOW'
        ) {
            const lookAhead = this.tokenLookAhead()
            for (let i = 0; i < lookAhead.length; i++) {
                const aheadToken = lookAhead[i]
                if (aheadToken.type === tokenTypes.OPEN_PAREN) {
                    // This is a function call, treat it as a reserved word
                    token.type = tokenTypes.RESERVED
                }
                return token
            }
        }

        // Fix cases where names are ambiguously keywords or properties
        if (
            token.type === tokenTypes.CLOSE_PAREN &&
            token.value.toUpperCase() === 'END'
        ) {
            const lookBack = this.tokenLookBack()
            for (let i = 0; i < lookBack.length; i++) {
                const backToken = lookBack[i]
                if (
                    backToken.type === tokenTypes.OPERATOR &&
                    backToken.value === '.'
                ) {
                    // This is window().end (or similar) not CASE ... END
                    token.type = tokenTypes.WORD
                }
                return token
            }
        }
    }
}
