import tokenTypes from './tokenTypes'
import Indentation from './Indentation'
import InlineBlock from './InlineBlock'
import Params from './Params'
import Tokenizer from './Tokenizer'

const trimSpacesEnd = (str) => str.replace(/[ \t]+$/u, '')

export default class Formatter {
    /**
     * @param {Object} cfg
     *  @param {String} cfg.language
     *  @param {String} cfg.indent
     *  @param {Bool} cfg.uppercase
     *  @param {Integer} cfg.linesBetweenQueries
     *  @param {Object} cfg.params
     */
    constructor(cfg) {
        this.cfg = cfg || {}
        this.indentation = new Indentation(this.cfg.indent)
        this.inlineBlock = new InlineBlock()
        this.params = new Params(this.cfg.params)
        this.previousReservedToken = {}
        this.tokens = []
        this.index = 0
    }

    /**
     * SQL Tokenizer for this formatter, typically overriden by subclasses.
     */
    static tokenizer = new Tokenizer({
        reservedWords: [],
        reservedTopLevelWords: [],
        reservedNewlineWords: [],
        reservedTopLevelWordsNoIndent: [],
        stringTypes: [],
        openParens: [],
        closeParens: [],
        indexedPlaceholderTypes: [],
        namedPlaceholderTypes: [],
        lineCommentTypes: [],
        specialWordChars: [],
    })

    /**
     * Reprocess and modify a token based on parsed context.
     *
     * @param {Object} token The token to modify
     *  @param {String} token.type
     *  @param {String} token.value
     * @return {?Object} modified token
     *  @return {String} token.type
     *  @return {String} token.value
     */
    tokenOverride() {
        // do nothing
        // subclasses can override this to modify tokens during formatting
    }

    /**
     * Formats whitespace in a SQL string to make it easier to read.
     *
     * @param {String} query The SQL query string
     * @return {String} formatted query
     */
    format(query) {
        this.tokens = this.constructor.tokenizer.tokenize(query)
        const formattedQuery = this.getFormattedQueryFromTokens()

        return formattedQuery.trim()
    }

    getFormattedQueryFromTokens() {
        let formattedQuery = ''

        this.tokens.forEach((token, index) => {
            this.index = index
            token = this.tokenOverride(token) || token

            if (token.type === tokenTypes.WHITESPACE) {
                // ignore
            } else if (token.type === tokenTypes.LINE_COMMENT) {
                formattedQuery = this.formatLineComment(token, formattedQuery)
            } else if (token.type === tokenTypes.BLOCK_COMMENT) {
                formattedQuery = this.formatBlockComment(token, formattedQuery)
            } else if (token.type === tokenTypes.RESERVED_TOP_LEVEL) {
                formattedQuery = this.formatTopLevelReservedWord(
                    token,
                    formattedQuery
                )
                this.previousReservedToken = token
            } else if (token.type === tokenTypes.RESERVED_TOP_LEVEL_NO_INDENT) {
                formattedQuery = this.formatTopLevelReservedWordNoIndent(
                    token,
                    formattedQuery
                )
                this.previousReservedToken = token
            } else if (token.type === tokenTypes.RESERVED_NEWLINE) {
                formattedQuery = this.formatNewlineReservedWord(
                    token,
                    formattedQuery
                )
                this.previousReservedToken = token
            } else if (token.type === tokenTypes.RESERVED) {
                formattedQuery = this.formatWithSpaces(token, formattedQuery)
                this.previousReservedToken = token
            } else if (token.type === tokenTypes.OPEN_PAREN) {
                formattedQuery = this.formatOpeningParentheses(
                    token,
                    formattedQuery
                )
            } else if (token.type === tokenTypes.CLOSE_PAREN) {
                formattedQuery = this.formatClosingParentheses(
                    token,
                    formattedQuery
                )
            } else if (token.type === tokenTypes.PLACEHOLDER) {
                formattedQuery = this.formatPlaceholder(token, formattedQuery)
            } else if (token.value === ',') {
                formattedQuery = this.formatComma(token, formattedQuery)
            } else if (token.value === ':') {
                formattedQuery = this.formatWithSpaceAfter(
                    token,
                    formattedQuery
                )
            } else if (token.value === '.') {
                formattedQuery = this.formatWithoutSpaces(token, formattedQuery)
            } else if (token.value === ';') {
                formattedQuery = this.formatQuerySeparator(
                    token,
                    formattedQuery
                )
            } else {
                formattedQuery = this.formatWithSpaces(token, formattedQuery)
            }
        })
        return formattedQuery
    }
    handleFindFirstIndex() {}
    formatLineComment(token, query) {
        const follow = this.followNonWhitespaceTokenIndex()

        if (follow.token.value === ',') {
            const commaToken = this.tokens[follow.index]
            this.tokens.splice(follow.index, 1) //[] = token
            this.tokens.splice(this.index - 1, 0, commaToken) // = commaToken
            return this.formatComma(commaToken, query)
        }

        const value = token.value
        token.value = value.split('')
        // 先判断第三个是不是空格
        if (token.value[2] === ' ') {
            token.value = token.value.join('')
        } else {
            token.value.splice(2, 0, ' ')
            token.value = token.value.join('')
        }

        return this.addNewline(query + token.value)
    }

    followNonWhitespaceTokenIndex() {
        let n = 1
        while (
            this.followToken(n).type === tokenTypes.WHITESPACE ||
            this.followToken(n).type === tokenTypes.LINE_COMMENT
        ) {
            n++
        }
        return { token: this.followToken(n), index: this.index + n }
    }
    followLineCommentTokenIndex() {
        let n = 0
        while (
            !this.followToken(n).value.includes('\n') &&
            this.followToken(n).type === tokenTypes.WHITESPACE
        ) {
            n++
        }
        return { token: this.followToken(n), index: this.index + n }
    }

    followToken(offset = 1) {
        return this.tokens[this.index + offset] || {}
    }

    formatBlockComment(token, query) {
        return this.addNewline(
            this.addNewline(query) + this.indentComment(token.value)
        )
    }

    indentComment(comment) {
        return comment.replace(
            /\n[ \t]*/gu,
            '\n' + this.indentation.getIndent() + ' '
        )
    }

    formatTopLevelReservedWordNoIndent(token, query) {
        this.indentation.decreaseTopLevel()
        query =
            this.addNewline(query) +
            this.equalizeWhitespace(this.formatReservedWord(token.value))
        return this.addNewline(query)
    }

    formatTopLevelReservedWord(token, query) {
        this.indentation.decreaseTopLevel()

        query = this.addNewline(query)

        this.indentation.increaseTopLevel()

        query += this.equalizeWhitespace(this.formatReservedWord(token.value))
        return this.addNewline(query)
    }

    formatNewlineReservedWord(token, query) {
        return (
            this.addNewline(query) +
            this.equalizeWhitespace(this.formatReservedWord(token.value)) +
            ' '
        )
    }

    // Replace any sequence of whitespace characters with single space
    equalizeWhitespace(string) {
        return string.replace(/\s+/gu, ' ')
    }

    // Opening parentheses increase the block indent level and start a new line
    formatOpeningParentheses(token, query) {
        // Take out the preceding space unless there was whitespace there in the original query
        // or another opening parens or line comment
        const preserveWhitespaceFor = {
            [tokenTypes.WHITESPACE]: true,
            [tokenTypes.OPEN_PAREN]: true,
            [tokenTypes.LINE_COMMENT]: true,
            [tokenTypes.OPERATOR]: true,
        }
        if (!preserveWhitespaceFor[this.previousToken().type]) {
            query = trimSpacesEnd(query)
        }
        query += this.cfg.uppercase
            ? token.value.toUpperCase()
            : token.value.toLowerCase()

        this.inlineBlock.beginIfPossible(this.tokens, this.index)

        if (!this.inlineBlock.isActive()) {
            this.indentation.increaseBlockLevel()
            query = this.addNewline(query)
        }
        return query
    }

    // Closing parentheses decrease the block indent level
    formatClosingParentheses(token, query) {
        token.value = this.cfg.uppercase
            ? token.value.toUpperCase()
            : token.value
        if (this.inlineBlock.isActive()) {
            this.inlineBlock.end()
            return this.formatWithSpaceAfter(token, query)
        } else {
            this.indentation.decreaseBlockLevel()
            return this.formatWithSpaces(token, this.addNewline(query))
        }
    }

    formatPlaceholder(token, query) {
        return query + this.params.get(token) + ' '
    }

    // Commas start a new line (unless within inline parentheses or SQL "LIMIT" clause or followed by comments)
    formatComma(token, query) {
        query = trimSpacesEnd(query) + token.value + ' '
        const follow = this.followLineCommentTokenIndex()
        if (this.inlineBlock.isActive()) {
            return query
        } else if (
            /^LIMIT$/iu.test(this.previousReservedToken.value) ||
            follow.token.type === tokenTypes.LINE_COMMENT
        ) {
            return query
        } else {
            return this.addNewline(query)
        }
    }

    formatWithSpaceAfter(token, query) {
        return trimSpacesEnd(query) + token.value + ' '
    }

    formatWithoutSpaces(token, query) {
        return trimSpacesEnd(query) + token.value
    }

    formatWithSpaces(token, query) {
        const value =
            token.type === 'reserved'
                ? this.formatReservedWord(token.value)
                : token.value

        return query + value + ' '
    }

    formatReservedWord(value) {
        return this.cfg.uppercase ? value.toUpperCase() : value.toLowerCase()
    }

    formatQuerySeparator(token, query) {
        this.indentation.resetIndentation()
        return (
            trimSpacesEnd(query) +
            token.value +
            '\n' +
            '\n'.repeat(this.cfg.linesBetweenQueries || 1)
        )
    }

    addNewline(query) {
        query = trimSpacesEnd(query)
        if (!query.endsWith('\n')) query += '\n'
        return query + this.indentation.getIndent()
    }
    specifyAddNewline(query) {
        // query = trimSpacesEnd(query)
        // if (!query.endsWith('\n')) query += '\n'
        // return query + this.indentation.getIndent()
        return (query += '\n' + ' ' + '\n')
    }
    previousToken(offset = 1) {
        return this.tokens[this.index - offset] || {}
    }

    tokenLookBack(maxBack = 5) {
        const start = Math.max(0, this.index - maxBack)
        const end = this.index
        return this.tokens.slice(start, end).reverse()
    }

    tokenLookAhead(maxAhead = 5) {
        const start = this.index + 1
        const end = this.index + maxAhead + 1
        return this.tokens.slice(start, end)
    }
}
