import {Formatter} from '../core/Formatter'
import {Tokenizer} from '../core/Tokenizer'
import {tokenTypes} from '../core/tokenTypes'

const reservedWords = [
    'ADD',
    'ADMIN',
    'ANALYZE', //
    'ARCHIVE',
    'ASC', //
    'BEFORE',
    'BUCKET',
    'BUCKETS',
    'CASCADE', //
    'CASE', //
    'CHANGE',
    'CLUSTER',
    'CLUSTERED',
    'CLUSTERSTATUS',
    'COLLECTION',
    'COLUMN', //
    'COLUMNS', //
    'COMMENT', //
    'COMPACT',
    'COMPACTIONS',
    'COMPUTE',
    'CONCATENATE',
    'CONF',
    'CONTINUE',
    'CUBE',
    'DATA',
    'DATABASES', //
    'DATETIME',
    'DAY',
    'DBPROPERTIES', //
    'DEFERRED',
    'DEFINED',
    'DELIMITED',
    'DEPENDENCY',
    'DESC', //
    'DIRECTORIES',
    'DIRECTORY',
    'DISABLE',
    'DISTRIBUTE',
    'ELEM_TYPE',
    'ENABLE',
    'ESCAPED',
    'EXCHANGE',
    'EXCLUSIVE',
    'EXPLAIN',
    'EXPORT', //
    'FILE', //
    'FILEFORMAT',
    'FIRST',
    'FORMAT',
    'FORMATTED',
    'FUNCTIONS',
    'HOLD_DDLTIME',
    'HOUR', //
    'IDXPROPERTIES',
    'IGNORE',
    'INDEX', //
    'INDEXES', //
    'INPATH',
    'INPUTDRIVER',
    'INPUTFORMAT',
    'IS',
    'ITEMS',
    'JAR',
    'KEYS', //
    'KEY_TYPE',
    'LATERAL',
    'LINES',
    'LOAD',
    'LOCAL',
    'LOCK',
    'LOCKS',
    'LOGICAL',
    'LONG',
    'MAPJOIN',
    'MATERIALIZED',
    'MINUS',
    'MINUTE', //
    'MONTH', //
    'MSCK',
    'NOSCAN',
    'NO_DROP',
    'OFFLINE',
    'OPTION',
    'ORDER',
    'OUTPUTDRIVER',
    'OUTPUTFORMAT',
    'OVER',
    'OVERWRITE',
    'OWNER',
    'PARTIALSCAN',
    'PARTITION', //
    'PARTITIONED',
    'PARTITIONS', //
    'PLUS',
    'PRECEDING',
    'PRESERVE',
    'PRETTY',
    'PRINCIPALS',
    'PROTECTION',
    'PURGE',
    'READ',
    'READONLY',
    'REBUILD',
    'RECORDREADER',
    'RECORDWRITER',
    'RELOAD',
    'RENAME',
    'REPAIR',
    'REPLACE', //
    'RESTRICT',
    'REWRITE',
    'ROLE',
    'ROLES',
    'ROLLUP',
    'SCHEMA',
    'SCHEMAS',
    'SECOND', //
    'SEMI',
    'SERDE',
    'SERDEPROPERTIES',
    'SERVER',
    'SETS',
    'SHARED',
    'SHOW',
    'SHOW_DATABASE',
    'SKEWED',
    'SORT',
    'SORTED',
    'SSL',
    'STATISTICS',
    'STORED',
    'STREAMTABLE',
    'STRING', //
    'STRUCT', //
    'TABLE', //
    'TABLES', //
    'TABLESAMPLE',
    'TEMPORARY', //
    'TERMINATED', //
    'TINYINT',
    'TOUCH',
    'TRANSACTIONS',
    'UNARCHIVE',
    'UNDO',
    'UNIONTYPE',
    'UNLOCK',
    'UNSET',
    'UNSIGNED', //
    'URI',
    'USE', //
    'UTC',
    'UTCTIMESTAMP',
    'VALUE_TYPE',
    'VIEW', //
    'WHILE',
    'YEAR',
    'ALL',
    'ALTER',
    'ARRAY',
    'AS', //
    'AUTHORIZATION',
    'BETWEEN', //
    'BIGINT', //
    'BINARY',
    'BOOLEAN',
    'BOTH',
    'BY',
    'CAST',
    'CHAR',
    'CROSS',
    'CURRENT',
    'CURRENT_DATE', //
    'CURRENT_TIMESTAMP', //
    'CURSOR',
    'DATABASE', //
    'DATE',
    'DECIMAL',
    'DELETE', //
    'DESCRIBE', //
    'DISTINCT', //
    'DOUBLE',
    'DROP',
    'ELSE', //
    'END', //
    'EXISTS', //
    'EXTENDED',
    'EXTERNAL',

    'FETCH',
    'FLOAT',
    'FOLLOWING',
    'FOR',
    'FULL', //
    'FUNCTION', //
    'GRANT', //
    'GROUP',
    'GROUPING',
    'IF', //
    'IMPORT', //
    'IN', //
    'INNER', //
    'INT',
    'INTERVAL', //
    'INTO', //
    'IS',
    'LESS',
    'LIKE', //
    'MACRO',
    'MAP',
    'MORE',
    'NONE',
    'NOT', //
    'NULL',
    'OF',
    'ON', //
    'OUT',
    'OUTER',
    'PERCENT',
    'PROCEDURE',
    'READS',
    'REDUCE',
    'REGEXP', //
    'REVOKE',
    'RIGHT',
    'RLIKE', //
    'SET', //
    'SMALLINT',
    'THEN', //
    'TIMESTAMP',
    'TO', //
    'TRANSFORM', //
    'TRIGGER',

    'TRUNCATE', //
    'UNBOUNDED', //
    'UNIQUEJOIN',
    'USER',
    'VARCHAR',
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

export class SparkSqlFormatter extends Formatter {
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