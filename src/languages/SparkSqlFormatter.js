import {Formatter} from '../core/Formatter'
import {Tokenizer} from '../core/Tokenizer'
import {tokenTypes} from '../core/tokenTypes'

const reservedWords = [
    'ALL',
    'ALTER',
    'ANALYSE',
    'ANALYZE',
    'ARRAY_ZIP',
    'ARRAY',
    'AS',
    'ASC',
    'AVG',
    'BETWEEN',
    'CASCADE',
    'CASE',
    'CAST',
    'COALESCE',
    'COLLECT_LIST',
    'COLLECT_SET',
    'COLUMN',
    'COLUMNS',
    'COMMENT',
    'CONSTRAINT',
    'CONTAINS',
    'CONVERT',
    'COUNT',
    'CUME_DIST',
    'CURRENT ROW',
    'CURRENT_DATE',
    'CURRENT_TIMESTAMP',
    'DATABASE',
    'DATABASES',
    'DATE_ADD',
    'DATE_SUB',
    'DATE_TRUNC',
    'DAY_HOUR',
    'DAY_MINUTE',
    'DAY_SECOND',
    'DAY',
    'DAYS',
    'DECODE',
    'DEFAULT',
    'DELETE',
    'DENSE_RANK',
    'DESC',
    'DESCRIBE',
    'DISTINCT',
    'DISTINCTROW',
    'DIV',
    'DROP',
    'ELSE',
    'ENCODE',
    'END',
    'EXISTS',
    'EXPLAIN',
    'EXPLODE_OUTER',
    'EXPLODE',
    'FILTER',
    'FIRST_VALUE',
    'FIRST',
    'FIXED',
    'FLATTEN',
    'FOLLOWING',
    'FROM_UNIXTIME',
    'FULL',
    'GREATEST',
    'GROUP_CONCAT',
    'HOUR_MINUTE',
    'HOUR_SECOND',
    'HOUR',
    'HOURS',
    'IF',
    'IFNULL',
    'IN',
    'INSERT',
    'INTERVAL',
    'INTO',
    'IS',
    'LAG',
    'LAST_VALUE',
    'LAST',
    'LEAD',
    'LEADING',
    'LEAST',
    'LEVEL',
    'LIKE',
    'MAX',
    'MERGE',
    'MIN',
    'MINUTE_SECOND',
    'MINUTE',
    'MONTH',
    'NATURAL',
    'NOT',
    'NOW()',
    'NTILE',
    'NULL',
    'NULLIF',
    'OFFSET',
    'ON DELETE',
    'ON UPDATE',
    'ON',
    'ONLY',
    'OPTIMIZE',
    'OVER',
    'PERCENT_RANK',
    'PRECEDING',
    'RANGE',
    'RANK',
    'REGEXP',
    'RENAME',
    'RLIKE',
    'ROW',
    'ROWS',
    'SECOND',
    'SEPARATOR',
    'SEQUENCE',
    'SIZE',
    'STRING',
    'STRUCT',
    'SUM',
    'TABLE',
    'TABLES',
    'TEMPORARY',
    'THEN',
    'TO_DATE',
    'TO_JSON',
    'TO',
    'TRAILING',
    'TRANSFORM',
    'TRUE',
    'TRUNCATE',
    'TYPE',
    'TYPES',
    'UNBOUNDED',
    'UNIQUE',
    'UNIX_TIMESTAMP',
    'UNLOCK',
    'UNSIGNED',
    'USING',
    'VARIABLES',
    'VIEW',
    'WHEN',
    'WITH',
    'YEAR_MONTH',
    'SET',
    'ADD JAR',
    'USE',
]

const reservedTopLevelWords = [
    'AFTER',
    'ALTER COLUMN',
    'ALTER DATABASE',
    'ALTER SCHEMA',
    'ALTER TABLE',
    'CLUSTER BY',
    'CLUSTERED BY',
    'DELETE FROM',
    'DISTRIBUTE BY',
    'FROM',
    'GROUP BY',
    'HAVING',
    'INSERT INTO',
    'INSERT',
    'LIMIT',
    'OPTIONS',
    'ORDER BY',
    'PARTITION BY',
    'PARTITIONED BY',
    'RANGE',
    'ROWS',
    'SELECT',
    'SET CURRENT SCHEMA',
    'SET SCHEMA',
    'TBLPROPERTIES',
    'UPDATE',
    'USING',
    'VALUES',
    'WHERE',
    'WINDOW',
]

const reservedTopLevelWordsNoIndent = [
    'EXCEPT ALL',
    'EXCEPT',
    'INTERSECT ALL',
    'INTERSECT',
    'UNION ALL',
    'UNION',
]

const reservedNewlineWords = [
    'AND',
    'ANTI JOIN',
    'CREATE OR',
    'CREATE',
    'CROSS JOIN',
    'ELSE',
    'FULL OUTER JOIN',
    'INNER JOIN',
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
    'WHEN',
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
        lineCommentTypes: ['--'],
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