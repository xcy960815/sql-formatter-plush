
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.sqlFormatter = {}));
}(this, (function (exports) { 'use strict';

  /**
   * Constants for token types
   */
  var tokenTypes = {
    WHITESPACE: 'whitespace',
    WORD: 'word',
    STRING: 'string',
    RESERVED: 'reserved',
    RESERVED_TOP_LEVEL: 'reserved-top-level',
    RESERVED_TOP_LEVEL_NO_INDENT: 'reserved-top-level-no-indent',
    RESERVED_NEWLINE: 'reserved-newline',
    OPERATOR: 'operator',
    OPEN_PAREN: 'open-paren',
    CLOSE_PAREN: 'close-paren',
    LINE_COMMENT: 'line-comment',
    BLOCK_COMMENT: 'block-comment',
    NUMBER: 'number',
    PLACEHOLDER: 'placeholder'
  };

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var INDENT_TYPE_TOP_LEVEL = 'top-level';
  var INDENT_TYPE_BLOCK_LEVEL = 'block-level';

  /**
   * Manages indentation levels.
   *
   * There are two types of indentation levels:
   *
   * - BLOCK_LEVEL : increased by open-parenthesis
   * - TOP_LEVEL : increased by RESERVED_TOP_LEVEL words
   */
  var Indentation = function () {
    /**
     * @param {String} indent Indent value, default is "  " (2 spaces)
     */
    function Indentation(indent) {
      _classCallCheck(this, Indentation);

      this.indent = indent || '  ';
      this.indentTypes = [];
    }

    /**
     * Returns current indentation string.
     * @return {String}
     */


    _createClass(Indentation, [{
      key: 'getIndent',
      value: function getIndent() {
        return this.indent.repeat(this.indentTypes.length);
      }

      /**
       * Increases indentation by one top-level indent.
       */

    }, {
      key: 'increaseTopLevel',
      value: function increaseTopLevel() {
        this.indentTypes.push(INDENT_TYPE_TOP_LEVEL);
      }

      /**
       * Increases indentation by one block-level indent.
       */

    }, {
      key: 'increaseBlockLevel',
      value: function increaseBlockLevel() {
        this.indentTypes.push(INDENT_TYPE_BLOCK_LEVEL);
      }

      /**
       * Decreases indentation by one top-level indent.
       * Does nothing when the previous indent is not top-level.
       */

    }, {
      key: 'decreaseTopLevel',
      value: function decreaseTopLevel() {
        if (this.indentTypes.length > 0 && this.indentTypes[this.indentTypes.length - 1] === INDENT_TYPE_TOP_LEVEL) {
          this.indentTypes.pop();
        }
      }

      /**
       * Decreases indentation by one block-level indent.
       * If there are top-level indents within the block-level indent,
       * throws away these as well.
       */

    }, {
      key: 'decreaseBlockLevel',
      value: function decreaseBlockLevel() {
        while (this.indentTypes.length > 0) {
          var type = this.indentTypes.pop();
          if (type !== INDENT_TYPE_TOP_LEVEL) {
            break;
          }
        }
      }
    }, {
      key: 'resetIndentation',
      value: function resetIndentation() {
        this.indentTypes = [];
      }
    }]);

    return Indentation;
  }();

  var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var INLINE_MAX_LENGTH = 50;

  /**
   * Bookkeeper for inline blocks.
   *
   * Inline blocks are parenthized expressions that are shorter than INLINE_MAX_LENGTH.
   * These blocks are formatted on a single line, unlike longer parenthized
   * expressions where open-parenthesis causes newline and increase of indentation.
   */
  var InlineBlock = function () {
      function InlineBlock() {
          _classCallCheck$1(this, InlineBlock);

          this.level = 0;
      }

      /**
       * Begins inline block when lookahead through upcoming tokens determines
       * that the block would be smaller than INLINE_MAX_LENGTH.
       * @param  {Object[]} tokens Array of all tokens
       * @param  {Number} index Current token position
       */


      _createClass$1(InlineBlock, [{
          key: 'beginIfPossible',
          value: function beginIfPossible(tokens, index) {
              if (this.level === 0 && this.isInlineBlock(tokens, index)) {
                  this.level = 1;
              } else if (this.level > 0) {
                  this.level++;
              } else {
                  this.level = 0;
              }
          }

          /**
           * Finishes current inline block.
           * There might be several nested ones.
           */

      }, {
          key: 'end',
          value: function end() {
              this.level--;
          }

          /**
           * True when inside an inline block
           * @return {Boolean}
           */

      }, {
          key: 'isActive',
          value: function isActive() {
              return this.level > 0;
          }

          // Check if this should be an inline parentheses block
          // Examples are "NOW()", "COUNT(*)", "int(10)", key(`somecolumn`), DECIMAL(7,2)

      }, {
          key: 'isInlineBlock',
          value: function isInlineBlock(tokens, index) {
              var length = 0;
              var level = 0;

              for (var i = index; i < tokens.length; i++) {
                  var token = tokens[i];
                  length += token.value.length;

                  // Overran max length
                  if (length > INLINE_MAX_LENGTH) {
                      return false;
                  }

                  if (token.type === tokenTypes.OPEN_PAREN) {
                      level++;
                  } else if (token.type === tokenTypes.CLOSE_PAREN) {
                      level--;
                      if (level === 0) {
                          return true;
                      }
                  }

                  if (this.isForbiddenToken(token)) {
                      return false;
                  }
              }
              return false;
          }

          // Reserved words that cause newlines, comments and semicolons
          // are not allowed inside inline parentheses block

      }, {
          key: 'isForbiddenToken',
          value: function isForbiddenToken(_ref) {
              var type = _ref.type,
                  value = _ref.value;

              return type === tokenTypes.RESERVED_TOP_LEVEL || type === tokenTypes.RESERVED_NEWLINE || type === tokenTypes.COMMENT || type === tokenTypes.BLOCK_COMMENT || value === ';';
          }
      }]);

      return InlineBlock;
  }();

  var _createClass$2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  /**
   * Handles placeholder replacement with given params.
   */
  var Params = function () {
    /**
     * @param {Object} params
     */
    function Params(params) {
      _classCallCheck$2(this, Params);

      this.params = params;
      this.index = 0;
    }

    /**
     * Returns param value that matches given placeholder with param key.
     * @param {Object} token
     *   @param {String} token.key Placeholder key
     *   @param {String} token.value Placeholder value
     * @return {String} param or token.value when params are missing
     */


    _createClass$2(Params, [{
      key: "get",
      value: function get(_ref) {
        var key = _ref.key,
            value = _ref.value;

        if (!this.params) {
          return value;
        }
        if (key) {
          return this.params[key];
        }
        return this.params[this.index++];
      }
    }]);

    return Params;
  }();

  var _createClass$3 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function isEmpty(arr) {
      return !Array.isArray(arr) || arr.length === 0;
  }

  function escapeRegExp(string) {
      return string.replace(/[\$\(-\+\.\?\[-\^\{-\}]/g, '\\$&');
  }

  var Tokenizer = function () {
      /**
       * @param {Object} cfg
       *  @param {String[]} cfg.reservedWords Reserved words in SQL
       *  @param {String[]} cfg.reservedTopLevelWords Words that are set to new line separately
       *  @param {String[]} cfg.reservedNewlineWords Words that are set to newline
       *  @param {String[]} cfg.reservedTopLevelWordsNoIndent Words that are top level but have no indentation
       *  @param {String[]} cfg.stringTypes String types to enable: "", '', ``, [], N''
       *  @param {String[]} cfg.openParens Opening parentheses to enable, like (, [
       *  @param {String[]} cfg.closeParens Closing parentheses to enable, like ), ]
       *  @param {String[]} cfg.indexedPlaceholderTypes Prefixes for indexed placeholders, like ?
       *  @param {String[]} cfg.namedPlaceholderTypes Prefixes for named placeholders, like @ and :
       *  @param {String[]} cfg.lineCommentTypes Line comments to enable, like # and --
       *  @param {String[]} cfg.specialWordChars Special chars that can be found inside of words, like @ and #
       */
      function Tokenizer(cfg) {
          _classCallCheck$3(this, Tokenizer);

          this.WHITESPACE_REGEX = /^([\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+)/;
          this.NUMBER_REGEX = /^((\x2D[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*)?[0-9]+(\.[0-9]+)?([Ee]\x2D?[0-9]+(\.[0-9]+)?)?|0x[0-9A-Fa-f]+|0b[01]+)\b/;
          this.OPERATOR_REGEX = /^(!=|<<|>>|<>|==|<=|>=|!<|!>|\|\|\/|\|\/|\|\||::|\x2D>>|\x2D>|~~\*|~~|!~~\*|!~~|~\*|!~\*|!~|@|:=|(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/;

          this.BLOCK_COMMENT_REGEX = /^(\/\*(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?(?:\*\/|$))/;
          this.LINE_COMMENT_REGEX = this.createLineCommentRegex(cfg.lineCommentTypes);

          this.RESERVED_TOP_LEVEL_REGEX = this.createReservedWordRegex(cfg.reservedTopLevelWords);
          this.RESERVED_TOP_LEVEL_NO_INDENT_REGEX = this.createReservedWordRegex(cfg.reservedTopLevelWordsNoIndent);
          this.RESERVED_NEWLINE_REGEX = this.createReservedWordRegex(cfg.reservedNewlineWords);
          this.RESERVED_PLAIN_REGEX = this.createReservedWordRegex(cfg.reservedWords);

          this.WORD_REGEX = this.createWordRegex(cfg.specialWordChars);
          this.STRING_REGEX = this.createStringRegex(cfg.stringTypes);

          this.OPEN_PAREN_REGEX = this.createParenRegex(cfg.openParens);
          this.CLOSE_PAREN_REGEX = this.createParenRegex(cfg.closeParens);

          this.INDEXED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.indexedPlaceholderTypes, '[0-9]*');
          this.IDENT_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.namedPlaceholderTypes, '[a-zA-Z0-9._$]+');
          this.STRING_NAMED_PLACEHOLDER_REGEX = this.createPlaceholderRegex(cfg.namedPlaceholderTypes, this.createStringPattern(cfg.stringTypes));
      }

      _createClass$3(Tokenizer, [{
          key: 'createLineCommentRegex',
          value: function createLineCommentRegex(lineCommentTypes) {
              return new RegExp('^((?:' + lineCommentTypes.map(function (c) {
                  return escapeRegExp(c);
              }).join('|') + ').*?(?:\r\n|\r|\n|$))', 'u');
          }
      }, {
          key: 'createReservedWordRegex',
          value: function createReservedWordRegex(reservedWords) {
              if (reservedWords.length === 0) return new RegExp('^\b$', 'u');
              reservedWords = reservedWords.sort(function (a, b) {
                  return b.length - a.length || a.localeCompare(b);
              });
              var reservedWordsPattern = reservedWords.join('|').replace(/ /g, '\\s+');
              return new RegExp('^(' + reservedWordsPattern + ')\\b', 'iu');
          }
      }, {
          key: 'createWordRegex',
          value: function createWordRegex() {
              var specialChars = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

              return new RegExp('^([\\p{Alphabetic}\\p{Mark}\\p{Decimal_Number}\\p{Connector_Punctuation}\\p{Join_Control}' + specialChars.join('') + ']+)', 'u');
          }
      }, {
          key: 'createStringRegex',
          value: function createStringRegex(stringTypes) {
              return new RegExp('^(' + this.createStringPattern(stringTypes) + ')', 'u');
          }

          // This enables the following string patterns:
          // 1. backtick quoted string using `` to escape
          // 2. square bracket quoted string (SQL Server) using ]] to escape
          // 3. double quoted string using "" or \" to escape
          // 4. single quoted string using '' or \' to escape
          // 5. national character quoted string using N'' or N\' to escape

      }, {
          key: 'createStringPattern',
          value: function createStringPattern(stringTypes) {
              var patterns = {
                  '``': '((`[^`]*($|`))+)',
                  '{}': '((\\{[^\\}]*($|\\}))+)',
                  '[]': '((\\[[^\\]]*($|\\]))(\\][^\\]]*($|\\]))*)',
                  '""': '(("[^"\\\\]*(?:\\\\.[^"\\\\]*)*("|$))+)',
                  "''": "(('[^'\\\\]*(?:\\\\.[^'\\\\]*)*('|$))+)",
                  "N''": "((N'[^N'\\\\]*(?:\\\\.[^N'\\\\]*)*('|$))+)"
              };

              return stringTypes.map(function (t) {
                  return patterns[t];
              }).join('|');
          }
      }, {
          key: 'createParenRegex',
          value: function createParenRegex(parens) {
              var _this = this;

              return new RegExp('^(' + parens.map(function (p) {
                  return _this.escapeParen(p);
              }).join('|') + ')', 'iu');
          }
      }, {
          key: 'escapeParen',
          value: function escapeParen(paren) {
              if (paren.length === 1) {
                  // A single punctuation character
                  return escapeRegExp(paren);
              } else {
                  // longer word
                  return '\\b' + paren + '\\b';
              }
          }
      }, {
          key: 'createPlaceholderRegex',
          value: function createPlaceholderRegex(types, pattern) {
              if (isEmpty(types)) {
                  return false;
              }
              var typesRegex = types.map(escapeRegExp).join('|');

              return new RegExp('^((?:' + typesRegex + ')(?:' + pattern + '))', 'u');
          }

          /**
           * Takes a SQL string and breaks it into tokens.
           * Each token is an object with type and value.
           *
           * @param {String} input The SQL string
           * @return {Object[]} tokens An array of tokens.
           *  @return {String} token.type
           *  @return {String} token.value
           */

      }, {
          key: 'tokenize',
          value: function tokenize(input) {
              if (!input) return [];

              var tokens = [];
              var token = void 0;

              // Keep processing the string until it is empty
              while (input.length) {
                  // Get the next token and the token type
                  token = this.getNextToken(input, token);
                  // Advance the string
                  input = input.substring(token.value.length);

                  tokens.push(token);
              }
              return tokens;
          }
      }, {
          key: 'getNextToken',
          value: function getNextToken(input, previousToken) {
              return this.getWhitespaceToken(input) || this.getCommentToken(input) || this.getStringToken(input) || this.getOpenParenToken(input) || this.getCloseParenToken(input) || this.getPlaceholderToken(input) || this.getNumberToken(input) || this.getReservedWordToken(input, previousToken) || this.getWordToken(input) || this.getOperatorToken(input);
          }
      }, {
          key: 'getWhitespaceToken',
          value: function getWhitespaceToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.WHITESPACE,
                  regex: this.WHITESPACE_REGEX
              });
          }
      }, {
          key: 'getCommentToken',
          value: function getCommentToken(input) {
              return this.getLineCommentToken(input) || this.getBlockCommentToken(input);
          }
      }, {
          key: 'getLineCommentToken',
          value: function getLineCommentToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.LINE_COMMENT,
                  regex: this.LINE_COMMENT_REGEX
              });
          }
      }, {
          key: 'getBlockCommentToken',
          value: function getBlockCommentToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.BLOCK_COMMENT,
                  regex: this.BLOCK_COMMENT_REGEX
              });
          }
      }, {
          key: 'getStringToken',
          value: function getStringToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.STRING,
                  regex: this.STRING_REGEX
              });
          }
      }, {
          key: 'getOpenParenToken',
          value: function getOpenParenToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.OPEN_PAREN,
                  regex: this.OPEN_PAREN_REGEX
              });
          }
      }, {
          key: 'getCloseParenToken',
          value: function getCloseParenToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.CLOSE_PAREN,
                  regex: this.CLOSE_PAREN_REGEX
              });
          }
      }, {
          key: 'getPlaceholderToken',
          value: function getPlaceholderToken(input) {
              return this.getIdentNamedPlaceholderToken(input) || this.getStringNamedPlaceholderToken(input) || this.getIndexedPlaceholderToken(input);
          }
      }, {
          key: 'getIdentNamedPlaceholderToken',
          value: function getIdentNamedPlaceholderToken(input) {
              return this.getPlaceholderTokenWithKey({
                  input: input,
                  regex: this.IDENT_NAMED_PLACEHOLDER_REGEX,
                  parseKey: function parseKey(v) {
                      return v.slice(1);
                  }
              });
          }
      }, {
          key: 'getStringNamedPlaceholderToken',
          value: function getStringNamedPlaceholderToken(input) {
              var _this2 = this;

              return this.getPlaceholderTokenWithKey({
                  input: input,
                  regex: this.STRING_NAMED_PLACEHOLDER_REGEX,
                  parseKey: function parseKey(v) {
                      return _this2.getEscapedPlaceholderKey({
                          key: v.slice(2, -1),
                          quoteChar: v.slice(-1)
                      });
                  }
              });
          }
      }, {
          key: 'getIndexedPlaceholderToken',
          value: function getIndexedPlaceholderToken(input) {
              return this.getPlaceholderTokenWithKey({
                  input: input,
                  regex: this.INDEXED_PLACEHOLDER_REGEX,
                  parseKey: function parseKey(v) {
                      return v.slice(1);
                  }
              });
          }
      }, {
          key: 'getPlaceholderTokenWithKey',
          value: function getPlaceholderTokenWithKey(_ref) {
              var input = _ref.input,
                  regex = _ref.regex,
                  parseKey = _ref.parseKey;

              var token = this.getTokenOnFirstMatch({
                  input: input,
                  regex: regex,
                  type: tokenTypes.PLACEHOLDER
              });
              if (token) {
                  token.key = parseKey(token.value);
              }
              return token;
          }
      }, {
          key: 'getEscapedPlaceholderKey',
          value: function getEscapedPlaceholderKey(_ref2) {
              var key = _ref2.key,
                  quoteChar = _ref2.quoteChar;

              return key.replace(new RegExp(escapeRegExp('\\' + quoteChar), 'gu'), quoteChar);
          }

          // Decimal, binary, or hex numbers

      }, {
          key: 'getNumberToken',
          value: function getNumberToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.NUMBER,
                  regex: this.NUMBER_REGEX
              });
          }

          // Punctuation and symbols

      }, {
          key: 'getOperatorToken',
          value: function getOperatorToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.OPERATOR,
                  regex: this.OPERATOR_REGEX
              });
          }
      }, {
          key: 'getReservedWordToken',
          value: function getReservedWordToken(input, previousToken) {
              // A reserved word cannot be preceded by a "."
              // this makes it so in "mytable.from", "from" is not considered a reserved word
              if (previousToken && previousToken.value && previousToken.value === '.') {
                  return;
              }
              return this.getTopLevelReservedToken(input) || this.getNewlineReservedToken(input) || this.getTopLevelReservedTokenNoIndent(input) || this.getPlainReservedToken(input);
          }
      }, {
          key: 'getTopLevelReservedToken',
          value: function getTopLevelReservedToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.RESERVED_TOP_LEVEL,
                  regex: this.RESERVED_TOP_LEVEL_REGEX
              });
          }
      }, {
          key: 'getNewlineReservedToken',
          value: function getNewlineReservedToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.RESERVED_NEWLINE,
                  regex: this.RESERVED_NEWLINE_REGEX
              });
          }
      }, {
          key: 'getTopLevelReservedTokenNoIndent',
          value: function getTopLevelReservedTokenNoIndent(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.RESERVED_TOP_LEVEL_NO_INDENT,
                  regex: this.RESERVED_TOP_LEVEL_NO_INDENT_REGEX
              });
          }
      }, {
          key: 'getPlainReservedToken',
          value: function getPlainReservedToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.RESERVED,
                  regex: this.RESERVED_PLAIN_REGEX
              });
          }
      }, {
          key: 'getWordToken',
          value: function getWordToken(input) {
              return this.getTokenOnFirstMatch({
                  input: input,
                  type: tokenTypes.WORD,
                  regex: this.WORD_REGEX
              });
          }
      }, {
          key: 'getTokenOnFirstMatch',
          value: function getTokenOnFirstMatch(_ref3) {
              var input = _ref3.input,
                  type = _ref3.type,
                  regex = _ref3.regex;

              var matches = input.match(regex);

              if (matches) {
                  return { type: type, value: matches[1] };
              }
          }
      }]);

      return Tokenizer;
  }();

  var _createClass$4 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var trimSpacesEnd = function trimSpacesEnd(str) {
      return str.replace(/[\t ]+$/, '');
  };

  var Formatter = function () {
      /**
       * @param {Object} cfg
       *  @param {String} cfg.language
       *  @param {String} cfg.indent
       *  @param {Bool} cfg.uppercase
       *  @param {Integer} cfg.linesBetweenQueries
       *  @param {Object} cfg.params
       */
      function Formatter(cfg) {
          _classCallCheck$4(this, Formatter);

          this.cfg = cfg || {};
          this.indentation = new Indentation(this.cfg.indent);
          this.inlineBlock = new InlineBlock();
          this.params = new Params(this.cfg.params);
          this.previousReservedToken = {};
          this.tokens = [];
          this.index = 0;
      }

      /**
       * SQL Tokenizer for this formatter, typically overriden by subclasses.
       */


      _createClass$4(Formatter, [{
          key: 'tokenOverride',


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
          value: function tokenOverride() {}
          // do nothing
          // subclasses can override this to modify tokens during formatting


          /**
           * Formats whitespace in a SQL string to make it easier to read.
           *
           * @param {String} query The SQL query string
           * @return {String} formatted query
           */

      }, {
          key: 'format',
          value: function format(query) {
              this.tokens = this.constructor.tokenizer.tokenize(query);
              var formattedQuery = this.getFormattedQueryFromTokens();

              return formattedQuery.trim();
          }
      }, {
          key: 'getFormattedQueryFromTokens',
          value: function getFormattedQueryFromTokens() {
              var _this = this;

              var formattedQuery = '';

              this.tokens.forEach(function (token, index) {
                  _this.index = index;
                  token = _this.tokenOverride(token) || token;

                  if (token.type === tokenTypes.WHITESPACE) ; else if (token.type === tokenTypes.LINE_COMMENT) {
                      formattedQuery = _this.formatLineComment(token, formattedQuery);
                  } else if (token.type === tokenTypes.BLOCK_COMMENT) {
                      formattedQuery = _this.formatBlockComment(token, formattedQuery);
                  } else if (token.type === tokenTypes.RESERVED_TOP_LEVEL) {
                      formattedQuery = _this.formatTopLevelReservedWord(token, formattedQuery);
                      _this.previousReservedToken = token;
                  } else if (token.type === tokenTypes.RESERVED_TOP_LEVEL_NO_INDENT) {
                      formattedQuery = _this.formatTopLevelReservedWordNoIndent(token, formattedQuery);
                      _this.previousReservedToken = token;
                  } else if (token.type === tokenTypes.RESERVED_NEWLINE) {
                      formattedQuery = _this.formatNewlineReservedWord(token, formattedQuery);
                      _this.previousReservedToken = token;
                  } else if (token.type === tokenTypes.RESERVED) {
                      formattedQuery = _this.formatWithSpaces(token, formattedQuery);
                      _this.previousReservedToken = token;
                  } else if (token.type === tokenTypes.OPEN_PAREN) {
                      formattedQuery = _this.formatOpeningParentheses(token, formattedQuery);
                  } else if (token.type === tokenTypes.CLOSE_PAREN) {
                      formattedQuery = _this.formatClosingParentheses(token, formattedQuery);
                  } else if (token.type === tokenTypes.PLACEHOLDER) {
                      formattedQuery = _this.formatPlaceholder(token, formattedQuery);
                  } else if (token.value === ',') {
                      formattedQuery = _this.formatComma(token, formattedQuery);
                  } else if (token.value === ':') {
                      formattedQuery = _this.formatWithSpaceAfter(token, formattedQuery);
                  } else if (token.value === '.') {
                      formattedQuery = _this.formatWithoutSpaces(token, formattedQuery);
                  } else if (token.value === ';') {
                      formattedQuery = _this.formatQuerySeparator(token, formattedQuery);
                  } else {
                      formattedQuery = _this.formatWithSpaces(token, formattedQuery);
                  }
              });
              return formattedQuery;
          }
      }, {
          key: 'formatLineComment',
          value: function formatLineComment(token, query) {
              var follow = this.followNonWhitespaceTokenIndex();

              if (follow.token.value === ',') {
                  var commaToken = this.tokens[follow.index];
                  this.tokens.splice(follow.index, 1); //[] = token
                  this.tokens.splice(this.index - 1, 0, commaToken); // = commaToken
                  return this.formatComma(commaToken, query);
              }

              var value = token.value;
              token.value = value.split('');
              // 先判断第三个是不是空格
              if (token.value[2] === ' ') {
                  token.value = token.value.join('');
              } else {
                  token.value.splice(2, 0, ' ');
                  token.value = token.value.join('');
              }

              return this.addNewline(query + token.value);
          }
      }, {
          key: 'followNonWhitespaceTokenIndex',
          value: function followNonWhitespaceTokenIndex() {
              var n = 1;
              while (this.followToken(n).type === tokenTypes.WHITESPACE || this.followToken(n).type === tokenTypes.LINE_COMMENT) {
                  n++;
              }
              return { token: this.followToken(n), index: this.index + n };
          }
      }, {
          key: 'followLineCommentTokenIndex',
          value: function followLineCommentTokenIndex() {
              var n = 0;
              while (!this.followToken(n).value.includes('\n') && this.followToken(n).type === tokenTypes.WHITESPACE) {
                  n++;
              }
              return { token: this.followToken(n), index: this.index + n };
          }
      }, {
          key: 'followToken',
          value: function followToken() {
              var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

              return this.tokens[this.index + offset] || {};
          }
      }, {
          key: 'formatBlockComment',
          value: function formatBlockComment(token, query) {
              return this.addNewline(this.addNewline(query) + this.indentComment(token.value));
          }
      }, {
          key: 'indentComment',
          value: function indentComment(comment) {
              return comment.replace(/\n[\t ]*/g, '\n' + this.indentation.getIndent() + ' ');
          }
      }, {
          key: 'formatTopLevelReservedWordNoIndent',
          value: function formatTopLevelReservedWordNoIndent(token, query) {
              this.indentation.decreaseTopLevel();
              query = this.addNewline(query) + this.equalizeWhitespace(this.formatReservedWord(token.value));
              return this.addNewline(query);
          }
      }, {
          key: 'formatTopLevelReservedWord',
          value: function formatTopLevelReservedWord(token, query) {
              this.indentation.decreaseTopLevel();

              query = this.addNewline(query);

              this.indentation.increaseTopLevel();

              query += this.equalizeWhitespace(this.formatReservedWord(token.value));
              return this.addNewline(query);
          }
      }, {
          key: 'formatNewlineReservedWord',
          value: function formatNewlineReservedWord(token, query) {
              return this.addNewline(query) + this.equalizeWhitespace(this.formatReservedWord(token.value)) + ' ';
          }

          // Replace any sequence of whitespace characters with single space

      }, {
          key: 'equalizeWhitespace',
          value: function equalizeWhitespace(string) {
              return string.replace(/[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/g, ' ');
          }

          // Opening parentheses increase the block indent level and start a new line

      }, {
          key: 'formatOpeningParentheses',
          value: function formatOpeningParentheses(token, query) {
              var _preserveWhitespaceFo;

              // Take out the preceding space unless there was whitespace there in the original query
              // or another opening parens or line comment
              var preserveWhitespaceFor = (_preserveWhitespaceFo = {}, _defineProperty(_preserveWhitespaceFo, tokenTypes.WHITESPACE, true), _defineProperty(_preserveWhitespaceFo, tokenTypes.OPEN_PAREN, true), _defineProperty(_preserveWhitespaceFo, tokenTypes.LINE_COMMENT, true), _defineProperty(_preserveWhitespaceFo, tokenTypes.OPERATOR, true), _preserveWhitespaceFo);
              if (!preserveWhitespaceFor[this.previousToken().type]) {
                  query = trimSpacesEnd(query);
              }
              query += this.cfg.uppercase ? token.value.toUpperCase() : token.value.toLowerCase();

              this.inlineBlock.beginIfPossible(this.tokens, this.index);

              if (!this.inlineBlock.isActive()) {
                  this.indentation.increaseBlockLevel();
                  query = this.addNewline(query);
              }
              return query;
          }

          // Closing parentheses decrease the block indent level

      }, {
          key: 'formatClosingParentheses',
          value: function formatClosingParentheses(token, query) {
              token.value = this.cfg.uppercase ? token.value.toUpperCase() : token.value;
              if (this.inlineBlock.isActive()) {
                  this.inlineBlock.end();
                  return this.formatWithSpaceAfter(token, query);
              } else {
                  this.indentation.decreaseBlockLevel();
                  return this.formatWithSpaces(token, this.addNewline(query));
              }
          }
      }, {
          key: 'formatPlaceholder',
          value: function formatPlaceholder(token, query) {
              return query + this.params.get(token) + ' ';
          }

          // Commas start a new line (unless within inline parentheses or SQL "LIMIT" clause or followed by comments)

      }, {
          key: 'formatComma',
          value: function formatComma(token, query) {
              query = trimSpacesEnd(query) + token.value + ' ';
              // query = query + token.value + ' '
              var follow = this.followLineCommentTokenIndex();
              if (this.inlineBlock.isActive()) {
                  return query;
              } else if (/^LIMIT$/i.test(this.previousReservedToken.value) || follow.token.type === tokenTypes.LINE_COMMENT) {
                  return query;
              } else {
                  return this.addNewline(query);
              }
          }
      }, {
          key: 'formatWithSpaceAfter',
          value: function formatWithSpaceAfter(token, query) {
              return trimSpacesEnd(query) + token.value + ' ';
          }
      }, {
          key: 'formatWithoutSpaces',
          value: function formatWithoutSpaces(token, query) {
              return trimSpacesEnd(query) + token.value;
          }
      }, {
          key: 'formatWithSpaces',
          value: function formatWithSpaces(token, query) {
              var value = token.type === 'reserved' ? this.formatReservedWord(token.value) : token.value;

              return query + value + ' ';
          }
      }, {
          key: 'formatReservedWord',
          value: function formatReservedWord(value) {
              return this.cfg.uppercase ? value.toUpperCase() : value.toLowerCase();
          }
      }, {
          key: 'formatQuerySeparator',
          value: function formatQuerySeparator(token, query) {
              this.indentation.resetIndentation();
              var firstLineCommentIndex = void 0;
              for (var index = this.index; index < this.tokens.length; index++) {
                  var element = this.tokens[index];
                  if (element.type === tokenTypes.LINE_COMMENT) {
                      firstLineCommentIndex = index;
                      break;
                  }
              }

              var tokens = this.tokens.slice(this.index + 1, firstLineCommentIndex);
              // 如果 tokens 的长度为 0 就说明 后面紧挨着 一个注释
              if (tokens && token.length === 0) {
                  return trimSpacesEnd(query) + token.value + ' '.repeat(this.cfg.linesBetweenQueries || 1);
              } else if (tokens && tokens.length > 0) {
                  var TokenTypes = [tokenTypes.LINE_COMMENT, tokenTypes.WHITESPACE];
                  var allLineCommentOrWhitespace = tokens.every(function (item) {
                      return TokenTypes.includes(item.type);
                  });
                  if (allLineCommentOrWhitespace) {
                      return trimSpacesEnd(query) + token.value + ' '.repeat(this.cfg.linesBetweenQueries || 1);
                  } else {
                      return trimSpacesEnd(query) + token.value + '\n'.repeat(this.cfg.linesBetweenQueries || 1);
                  }
              } else {
                  return trimSpacesEnd(query) + token.value + '\n'.repeat(this.cfg.linesBetweenQueries || 1);
              }
          }
      }, {
          key: 'addNewline',
          value: function addNewline(query) {
              query = trimSpacesEnd(query);
              if (!query.endsWith('\n')) query += '\n';
              return query + this.indentation.getIndent();
          }
      }, {
          key: 'specifyAddNewline',
          value: function specifyAddNewline(query) {
              // query = trimSpacesEnd(query)
              // if (!query.endsWith('\n')) query += '\n'
              // return query + this.indentation.getIndent()
              return query += '\n' + ' ' + '\n';
          }
      }, {
          key: 'previousToken',
          value: function previousToken() {
              var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

              return this.tokens[this.index - offset] || {};
          }
      }, {
          key: 'tokenLookBack',
          value: function tokenLookBack() {
              var maxBack = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;

              var start = Math.max(0, this.index - maxBack);
              var end = this.index;
              return this.tokens.slice(start, end).reverse();
          }
      }, {
          key: 'tokenLookAhead',
          value: function tokenLookAhead() {
              var maxAhead = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;

              var start = this.index + 1;
              var end = this.index + maxAhead + 1;
              return this.tokens.slice(start, end);
          }
      }]);

      return Formatter;
  }();
  Formatter.tokenizer = new Tokenizer({
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
      specialWordChars: []
  });

  function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords = ['ABS', 'ACTIVATE', 'ALIAS', 'ALL', 'ALLOCATE', 'ALLOW', 'ALTER', 'ANY', 'ARE', 'ARRAY', 'AS', 'ASC', 'ASENSITIVE', 'ASSOCIATE', 'ASUTIME', 'ASYMMETRIC', 'AT', 'ATOMIC', 'ATTRIBUTES', 'AUDIT', 'AUTHORIZATION', 'AUX', 'AUXILIARY', 'AVG', 'BEFORE', 'BEGIN', 'BETWEEN', 'BIGINT', 'BINARY', 'BLOB', 'BOOLEAN', 'BOTH', 'BUFFERPOOL', 'BY', 'CACHE', 'CALL', 'CALLED', 'CAPTURE', 'CARDINALITY', 'CASCADED', 'CASE', 'CAST', 'CCSID', 'CEIL', 'CEILING', 'CHAR', 'CHARACTER', 'CHARACTER_LENGTH', 'CHAR_LENGTH', 'CHECK', 'CLOB', 'CLONE', 'CLOSE', 'CLUSTER', 'COALESCE', 'COLLATE', 'COLLECT', 'COLLECTION', 'COLLID', 'COLUMN', 'COMMENT', 'COMMIT', 'CONCAT', 'CONDITION', 'CONNECT', 'CONNECTION', 'CONSTRAINT', 'CONTAINS', 'CONTINUE', 'CONVERT', 'CORR', 'CORRESPONDING', 'COUNT', 'COUNT_BIG', 'COVAR_POP', 'COVAR_SAMP', 'CREATE', 'CROSS', 'CUBE', 'CUME_DIST', 'CURRENT', 'CURRENT_DATE', 'CURRENT_DEFAULT_TRANSFORM_GROUP', 'CURRENT_LC_CTYPE', 'CURRENT_PATH', 'CURRENT_ROLE', 'CURRENT_SCHEMA', 'CURRENT_SERVER', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_TIMEZONE', 'CURRENT_TRANSFORM_GROUP_FOR_TYPE', 'CURRENT_USER', 'CURSOR', 'CYCLE', 'DATA', 'DATABASE', 'DATAPARTITIONNAME', 'DATAPARTITIONNUM', 'DATE', 'DAY', 'DAYS', 'DB2GENERAL', 'DB2GENRL', 'DB2SQL', 'DBINFO', 'DBPARTITIONNAME', 'DBPARTITIONNUM', 'DEALLOCATE', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFAULTS', 'DEFINITION', 'DELETE', 'DENSERANK', 'DENSE_RANK', 'DEREF', 'DESCRIBE', 'DESCRIPTOR', 'DETERMINISTIC', 'DIAGNOSTICS', 'DISABLE', 'DISALLOW', 'DISCONNECT', 'DISTINCT', 'DO', 'DOCUMENT', 'DOUBLE', 'DROP', 'DSSIZE', 'DYNAMIC', 'EACH', 'EDITPROC', 'ELEMENT', 'ELSE', 'ELSEIF', 'ENABLE', 'ENCODING', 'ENCRYPTION', 'END', 'END-EXEC', 'ENDING', 'ERASE', 'ESCAPE', 'EVERY', 'EXCEPTION', 'EXCLUDING', 'EXCLUSIVE', 'EXEC', 'EXECUTE', 'EXISTS', 'EXIT', 'EXP', 'EXPLAIN', 'EXTENDED', 'EXTERNAL', 'EXTRACT', 'FALSE', 'FENCED', 'FETCH', 'FIELDPROC', 'FILE', 'FILTER', 'FINAL', 'FIRST', 'FLOAT', 'FLOOR', 'FOR', 'FOREIGN', 'FREE', 'FULL', 'FUNCTION', 'FUSION', 'GENERAL', 'GENERATED', 'GET', 'GLOBAL', 'GOTO', 'GRANT', 'GRAPHIC', 'GROUP', 'GROUPING', 'HANDLER', 'HASH', 'HASHED_VALUE', 'HINT', 'HOLD', 'HOUR', 'HOURS', 'IDENTITY', 'IF', 'IMMEDIATE', 'IN', 'INCLUDING', 'INCLUSIVE', 'INCREMENT', 'INDEX', 'INDICATOR', 'INDICATORS', 'INF', 'INFINITY', 'INHERIT', 'INNER', 'INOUT', 'INSENSITIVE', 'INSERT', 'INT', 'INTEGER', 'INTEGRITY', 'INTERSECTION', 'INTERVAL', 'INTO', 'IS', 'ISOBID', 'ISOLATION', 'ITERATE', 'JAR', 'JAVA', 'KEEP', 'KEY', 'LABEL', 'LANGUAGE', 'LARGE', 'LATERAL', 'LC_CTYPE', 'LEADING', 'LEAVE', 'LEFT', 'LIKE', 'LINKTYPE', 'LN', 'LOCAL', 'LOCALDATE', 'LOCALE', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCATOR', 'LOCATORS', 'LOCK', 'LOCKMAX', 'LOCKSIZE', 'LONG', 'LOOP', 'LOWER', 'MAINTAINED', 'MATCH', 'MATERIALIZED', 'MAX', 'MAXVALUE', 'MEMBER', 'MERGE', 'METHOD', 'MICROSECOND', 'MICROSECONDS', 'MIN', 'MINUTE', 'MINUTES', 'MINVALUE', 'MOD', 'MODE', 'MODIFIES', 'MODULE', 'MONTH', 'MONTHS', 'MULTISET', 'NAN', 'NATIONAL', 'NATURAL', 'NCHAR', 'NCLOB', 'NEW', 'NEW_TABLE', 'NEXTVAL', 'NO', 'NOCACHE', 'NOCYCLE', 'NODENAME', 'NODENUMBER', 'NOMAXVALUE', 'NOMINVALUE', 'NONE', 'NOORDER', 'NORMALIZE', 'NORMALIZED', 'NOT', 'NULL', 'NULLIF', 'NULLS', 'NUMERIC', 'NUMPARTS', 'OBID', 'OCTET_LENGTH', 'OF', 'OFFSET', 'OLD', 'OLD_TABLE', 'ON', 'ONLY', 'OPEN', 'OPTIMIZATION', 'OPTIMIZE', 'OPTION', 'ORDER', 'OUT', 'OUTER', 'OVER', 'OVERLAPS', 'OVERLAY', 'OVERRIDING', 'PACKAGE', 'PADDED', 'PAGESIZE', 'PARAMETER', 'PART', 'PARTITION', 'PARTITIONED', 'PARTITIONING', 'PARTITIONS', 'PASSWORD', 'PATH', 'PERCENTILE_CONT', 'PERCENTILE_DISC', 'PERCENT_RANK', 'PIECESIZE', 'PLAN', 'POSITION', 'POWER', 'PRECISION', 'PREPARE', 'PREVVAL', 'PRIMARY', 'PRIQTY', 'PRIVILEGES', 'PROCEDURE', 'PROGRAM', 'PSID', 'PUBLIC', 'QUERY', 'QUERYNO', 'RANGE', 'RANK', 'READ', 'READS', 'REAL', 'RECOVERY', 'RECURSIVE', 'REF', 'REFERENCES', 'REFERENCING', 'REFRESH', 'REGR_AVGX', 'REGR_AVGY', 'REGR_COUNT', 'REGR_INTERCEPT', 'REGR_R2', 'REGR_SLOPE', 'REGR_SXX', 'REGR_SXY', 'REGR_SYY', 'RELEASE', 'RENAME', 'REPEAT', 'RESET', 'RESIGNAL', 'RESTART', 'RESTRICT', 'RESULT', 'RESULT_SET_LOCATOR', 'RETURN', 'RETURNS', 'REVOKE', 'RIGHT', 'ROLE', 'ROLLBACK', 'ROLLUP', 'ROUND_CEILING', 'ROUND_DOWN', 'ROUND_FLOOR', 'ROUND_HALF_DOWN', 'ROUND_HALF_EVEN', 'ROUND_HALF_UP', 'ROUND_UP', 'ROUTINE', 'ROW', 'ROWNUMBER', 'ROWS', 'ROWSET', 'ROW_NUMBER', 'RRN', 'RUN', 'SAVEPOINT', 'SCHEMA', 'SCOPE', 'SCRATCHPAD', 'SCROLL', 'SEARCH', 'SECOND', 'SECONDS', 'SECQTY', 'SECURITY', 'SENSITIVE', 'SEQUENCE', 'SESSION', 'SESSION_USER', 'SIGNAL', 'SIMILAR', 'SIMPLE', 'SMALLINT', 'SNAN', 'SOME', 'SOURCE', 'SPECIFIC', 'SPECIFICTYPE', 'SQL', 'SQLEXCEPTION', 'SQLID', 'SQLSTATE', 'SQLWARNING', 'SQRT', 'STACKED', 'STANDARD', 'START', 'STARTING', 'STATEMENT', 'STATIC', 'STATMENT', 'STAY', 'STDDEV_POP', 'STDDEV_SAMP', 'STOGROUP', 'STORES', 'STYLE', 'SUBMULTISET', 'SUBSTRING', 'SUM', 'SUMMARY', 'SYMMETRIC', 'SYNONYM', 'SYSFUN', 'SYSIBM', 'SYSPROC', 'SYSTEM', 'SYSTEM_USER', 'TABLE', 'TABLESAMPLE', 'TABLESPACE', 'THEN', 'TIME', 'TIMESTAMP', 'TIMEZONE_HOUR', 'TIMEZONE_MINUTE', 'TO', 'TRAILING', 'TRANSACTION', 'TRANSLATE', 'TRANSLATION', 'TREAT', 'TRIGGER', 'TRIM', 'TRUE', 'TRUNCATE', 'TYPE', 'UESCAPE', 'UNDO', 'UNIQUE', 'UNKNOWN', 'UNNEST', 'UNTIL', 'UPPER', 'USAGE', 'USER', 'USING', 'VALIDPROC', 'VALUE', 'VARCHAR', 'VARIABLE', 'VARIANT', 'VARYING', 'VAR_POP', 'VAR_SAMP', 'VCAT', 'VERSION', 'VIEW', 'VOLATILE', 'VOLUMES', 'WHEN', 'WHENEVER', 'WHILE', 'WIDTH_BUCKET', 'WINDOW', 'WITH', 'WITHIN', 'WITHOUT', 'WLM', 'WRITE', 'XMLELEMENT', 'XMLEXISTS', 'XMLNAMESPACES', 'YEAR', 'YEARS'];

  var reservedTopLevelWords = ['ADD', 'AFTER', 'ALTER COLUMN', 'ALTER TABLE', 'DELETE FROM', 'EXCEPT', 'FETCH FIRST', 'FROM', 'GROUP BY', 'GO', 'HAVING', 'INSERT INTO', 'INTERSECT', 'LIMIT', 'ORDER BY', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'SET', 'UPDATE', 'VALUES', 'WHERE'];

  var reservedTopLevelWordsNoIndent = ['INTERSECT', 'INTERSECT ALL', 'MINUS', 'UNION', 'UNION ALL'];

  var reservedNewlineWords = ['AND', 'CROSS JOIN', 'INNER JOIN', 'JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'OR', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN'];

  var Db2Formatter = function (_Formatter) {
    _inherits(Db2Formatter, _Formatter);

    function Db2Formatter() {
      _classCallCheck$5(this, Db2Formatter);

      return _possibleConstructorReturn(this, (Db2Formatter.__proto__ || Object.getPrototypeOf(Db2Formatter)).apply(this, arguments));
    }

    return Db2Formatter;
  }(Formatter);
  Db2Formatter.tokenizer = new Tokenizer({
    reservedWords: reservedWords,
    reservedTopLevelWords: reservedTopLevelWords,
    reservedNewlineWords: reservedNewlineWords,
    reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent,
    stringTypes: ['""', "''", '``', '[]'],
    openParens: ['('],
    closeParens: [')'],
    indexedPlaceholderTypes: ['?'],
    namedPlaceholderTypes: [':'],
    lineCommentTypes: ['--'],
    specialWordChars: ['#', '@']
  });

  function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$1 = ['ALL', 'ALTER', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC', 'BEGIN', 'BETWEEN', 'BINARY', 'BOOLEAN', 'BREAK', 'BUCKET', 'BUILD', 'BY', 'CALL', 'CASE', 'CAST', 'CLUSTER', 'COLLATE', 'COLLECTION', 'COMMIT', 'CONNECT', 'CONTINUE', 'CORRELATE', 'COVER', 'CREATE', 'DATABASE', 'DATASET', 'DATASTORE', 'DECLARE', 'DECREMENT', 'DELETE', 'DERIVED', 'DESC', 'DESCRIBE', 'DISTINCT', 'DO', 'DROP', 'EACH', 'ELEMENT', 'ELSE', 'END', 'EVERY', 'EXCEPT', 'EXCLUDE', 'EXECUTE', 'EXISTS', 'EXPLAIN', 'FALSE', 'FETCH', 'FIRST', 'FLATTEN', 'FOR', 'FORCE', 'FROM', 'FUNCTION', 'GRANT', 'GROUP', 'GSI', 'HAVING', 'IF', 'IGNORE', 'ILIKE', 'IN', 'INCLUDE', 'INCREMENT', 'INDEX', 'INFER', 'INLINE', 'INNER', 'INSERT', 'INTERSECT', 'INTO', 'IS', 'JOIN', 'KEY', 'KEYS', 'KEYSPACE', 'KNOWN', 'LAST', 'LEFT', 'LET', 'LETTING', 'LIKE', 'LIMIT', 'LSM', 'MAP', 'MAPPING', 'MATCHED', 'MATERIALIZED', 'MERGE', 'MISSING', 'NAMESPACE', 'NEST', 'NOT', 'NULL', 'NUMBER', 'OBJECT', 'OFFSET', 'ON', 'OPTION', 'OR', 'ORDER', 'OUTER', 'OVER', 'PARSE', 'PARTITION', 'PASSWORD', 'PATH', 'POOL', 'PREPARE', 'PRIMARY', 'PRIVATE', 'PRIVILEGE', 'PROCEDURE', 'PUBLIC', 'RAW', 'REALM', 'REDUCE', 'RENAME', 'RETURN', 'RETURNING', 'REVOKE', 'RIGHT', 'ROLE', 'ROLLBACK', 'SATISFIES', 'SCHEMA', 'SELECT', 'SELF', 'SEMI', 'SET', 'SHOW', 'SOME', 'START', 'STATISTICS', 'STRING', 'SYSTEM', 'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'TRUE', 'TRUNCATE', 'UNDER', 'UNION', 'UNIQUE', 'UNKNOWN', 'UNNEST', 'UNSET', 'UPDATE', 'UPSERT', 'USE', 'USER', 'USING', 'VALIDATE', 'VALUE', 'VALUED', 'VALUES', 'VIA', 'VIEW', 'WHEN', 'WHERE', 'WHILE', 'WITH', 'WITHIN', 'WORK', 'XOR'];

  var reservedTopLevelWords$1 = ['DELETE FROM', 'EXCEPT ALL', 'EXCEPT', 'EXPLAIN DELETE FROM', 'EXPLAIN UPDATE', 'EXPLAIN UPSERT', 'FROM', 'GROUP BY', 'HAVING', 'INFER', 'INSERT INTO', 'LET', 'LIMIT', 'MERGE', 'NEST', 'ORDER BY', 'PREPARE', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'SET', 'UNNEST', 'UPDATE', 'UPSERT', 'USE KEYS', 'VALUES', 'WHERE'];

  var reservedTopLevelWordsNoIndent$1 = ['INTERSECT', 'INTERSECT ALL', 'MINUS', 'UNION', 'UNION ALL'];

  var reservedNewlineWords$1 = ['AND', 'INNER JOIN', 'JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'OR', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'XOR'];

  var N1qlFormatter = function (_Formatter) {
    _inherits$1(N1qlFormatter, _Formatter);

    function N1qlFormatter() {
      _classCallCheck$6(this, N1qlFormatter);

      return _possibleConstructorReturn$1(this, (N1qlFormatter.__proto__ || Object.getPrototypeOf(N1qlFormatter)).apply(this, arguments));
    }

    return N1qlFormatter;
  }(Formatter);
  N1qlFormatter.tokenizer = new Tokenizer({
    reservedWords: reservedWords$1,
    reservedTopLevelWords: reservedTopLevelWords$1,
    reservedNewlineWords: reservedNewlineWords$1,
    reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$1,
    stringTypes: ['""', "''", '``'],
    openParens: ['(', '[', '{'],
    closeParens: [')', ']', '}'],
    namedPlaceholderTypes: ['$'],
    lineCommentTypes: ['#', '--']
  });

  var _createClass$5 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$2 = ['A', 'ACCESSIBLE', 'AGENT', 'AGGREGATE', 'ALL', 'ALTER', 'ANY', 'ARRAY', 'AS', 'ASC', 'AT', 'ATTRIBUTE', 'AUTHID', 'AVG', 'BETWEEN', 'BFILE_BASE', 'BINARY_INTEGER', 'BINARY', 'BLOB_BASE', 'BLOCK', 'BODY', 'BOOLEAN', 'BOTH', 'BOUND', 'BREADTH', 'BULK', 'BY', 'BYTE', 'C', 'CALL', 'CALLING', 'CASCADE', 'CASE', 'CHAR_BASE', 'CHAR', 'CHARACTER', 'CHARSET', 'CHARSETFORM', 'CHARSETID', 'CHECK', 'CLOB_BASE', 'CLONE', 'CLOSE', 'CLUSTER', 'CLUSTERS', 'COALESCE', 'COLAUTH', 'COLLECT', 'COLUMNS', 'COMMENT', 'COMMIT', 'COMMITTED', 'COMPILED', 'COMPRESS', 'CONNECT', 'CONSTANT', 'CONSTRUCTOR', 'CONTEXT', 'CONTINUE', 'CONVERT', 'COUNT', 'CRASH', 'CREATE', 'CREDENTIAL', 'CURRENT', 'CURRVAL', 'CURSOR', 'CUSTOMDATUM', 'DANGLING', 'DATA', 'DATE_BASE', 'DATE', 'DAY', 'DECIMAL', 'DEFAULT', 'DEFINE', 'DELETE', 'DEPTH', 'DESC', 'DETERMINISTIC', 'DIRECTORY', 'DISTINCT', 'DO', 'DOUBLE', 'DROP', 'DURATION', 'ELEMENT', 'ELSIF', 'EMPTY', 'END', 'ESCAPE', 'EXCEPTIONS', 'EXCLUSIVE', 'EXECUTE', 'EXISTS', 'EXIT', 'EXTENDS', 'EXTERNAL', 'EXTRACT', 'FALSE', 'FETCH', 'FINAL', 'FIRST', 'FIXED', 'FLOAT', 'FOR', 'FORALL', 'FORCE', 'FROM', 'FUNCTION', 'GENERAL', 'GOTO', 'GRANT', 'GROUP', 'HASH', 'HEAP', 'HIDDEN', 'HOUR', 'IDENTIFIED', 'IF', 'IMMEDIATE', 'IN', 'INCLUDING', 'INDEX', 'INDEXES', 'INDICATOR', 'INDICES', 'INFINITE', 'INSTANTIABLE', 'INT', 'INTEGER', 'INTERFACE', 'INTERVAL', 'INTO', 'INVALIDATE', 'IS', 'ISOLATION', 'JAVA', 'LANGUAGE', 'LARGE', 'LEADING', 'LENGTH', 'LEVEL', 'LIBRARY', 'LIKE', 'LIKE2', 'LIKE4', 'LIKEC', 'LIMITED', 'LOCAL', 'LOCK', 'LONG', 'MAP', 'MAX', 'MAXLEN', 'MEMBER', 'MERGE', 'MIN', 'MINUTE', 'MLSLABEL', 'MOD', 'MODE', 'MONTH', 'MULTISET', 'NAME', 'NAN', 'NATIONAL', 'NATIVE', 'NATURAL', 'NATURALN', 'NCHAR', 'NEW', 'NEXTVAL', 'NOCOMPRESS', 'NOCOPY', 'NOT', 'NOWAIT', 'NULL', 'NULLIF', 'NUMBER_BASE', 'NUMBER', 'OBJECT', 'OCICOLL', 'OCIDATE', 'OCIDATETIME', 'OCIDURATION', 'OCIINTERVAL', 'OCILOBLOCATOR', 'OCINUMBER', 'OCIRAW', 'OCIREF', 'OCIREFCURSOR', 'OCIROWID', 'OCISTRING', 'OCITYPE', 'OF', 'OLD', 'ON', 'ONLY', 'OPAQUE', 'OPEN', 'OPERATOR', 'OPTION', 'ORACLE', 'ORADATA', 'ORDER', 'ORGANIZATION', 'ORLANY', 'ORLVARY', 'OTHERS', 'OUT', 'OVERLAPS', 'OVERRIDING', 'PACKAGE', 'PARALLEL_ENABLE', 'PARAMETER', 'PARAMETERS', 'PARENT', 'PARTITION', 'PASCAL', 'PCTFREE', 'PIPE', 'PIPELINED', 'PLS_INTEGER', 'PLUGGABLE', 'POSITIVE', 'POSITIVEN', 'PRAGMA', 'PRECISION', 'PRIOR', 'PRIVATE', 'PROCEDURE', 'PUBLIC', 'RAISE', 'RANGE', 'RAW', 'READ', 'REAL', 'RECORD', 'REF', 'REFERENCE', 'RELEASE', 'RELIES_ON', 'REM', 'REMAINDER', 'RENAME', 'RESOURCE', 'RESULT_CACHE', 'RESULT', 'RETURN', 'RETURNING', 'REVERSE', 'REVOKE', 'ROLLBACK', 'ROW', 'ROWID', 'ROWNUM', 'ROWTYPE', 'SAMPLE', 'SAVE', 'SAVEPOINT', 'SB1', 'SB2', 'SB4', 'SEARCH', 'SECOND', 'SEGMENT', 'SELF', 'SEPARATE', 'SEQUENCE', 'SERIALIZABLE', 'SHARE', 'SHORT', 'SIZE_T', 'SIZE', 'SMALLINT', 'SOME', 'SPACE', 'SPARSE', 'SQL', 'SQLCODE', 'SQLDATA', 'SQLERRM', 'SQLNAME', 'SQLSTATE', 'STANDARD', 'START', 'STATIC', 'STDDEV', 'STORED', 'STRING', 'STRUCT', 'STYLE', 'SUBMULTISET', 'SUBPARTITION', 'SUBSTITUTABLE', 'SUBTYPE', 'SUCCESSFUL', 'SUM', 'SYNONYM', 'SYSDATE', 'TABAUTH', 'TABLE', 'TDO', 'THE', 'THEN', 'TIME', 'TIMESTAMP', 'TIMEZONE_ABBR', 'TIMEZONE_HOUR', 'TIMEZONE_MINUTE', 'TIMEZONE_REGION', 'TO', 'TRAILING', 'TRANSACTION', 'TRANSACTIONAL', 'TRIGGER', 'TRUE', 'TRUSTED', 'TYPE', 'UB1', 'UB2', 'UB4', 'UID', 'UNDER', 'UNIQUE', 'UNPLUG', 'UNSIGNED', 'UNTRUSTED', 'USE', 'USER', 'USING', 'VALIDATE', 'VALIST', 'VALUE', 'VARCHAR', 'VARCHAR2', 'VARIABLE', 'VARIANCE', 'VARRAY', 'VARYING', 'VIEW', 'VIEWS', 'VOID', 'WHENEVER', 'WHILE', 'WITH', 'WORK', 'WRAPPED', 'WRITE', 'YEAR', 'ZONE'];

  var reservedTopLevelWords$2 = ['ADD', 'ALTER COLUMN', 'ALTER TABLE', 'BEGIN', 'CONNECT BY', 'DECLARE', 'DELETE FROM', 'DELETE', 'END', 'EXCEPT', 'EXCEPTION', 'FETCH FIRST', 'FROM', 'GROUP BY', 'HAVING', 'INSERT INTO', 'INSERT', 'LIMIT', 'LOOP', 'MODIFY', 'ORDER BY', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'SET', 'START WITH', 'UPDATE', 'VALUES', 'WHERE'];

  var reservedTopLevelWordsNoIndent$2 = ['INTERSECT', 'INTERSECT ALL', 'MINUS', 'UNION', 'UNION ALL'];

  var reservedNewlineWords$2 = ['AND', 'CROSS APPLY', 'CROSS JOIN', 'ELSE', 'END', 'INNER JOIN', 'JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'OR', 'OUTER APPLY', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'WHEN', 'XOR'];

  var PlSqlFormatter = function (_Formatter) {
      _inherits$2(PlSqlFormatter, _Formatter);

      function PlSqlFormatter() {
          _classCallCheck$7(this, PlSqlFormatter);

          return _possibleConstructorReturn$2(this, (PlSqlFormatter.__proto__ || Object.getPrototypeOf(PlSqlFormatter)).apply(this, arguments));
      }

      _createClass$5(PlSqlFormatter, [{
          key: 'tokenOverride',
          value: function tokenOverride(token) {
              if (token.type === tokenTypes.RESERVED_TOP_LEVEL && token.value.toUpperCase() === 'SET' && this.previousReservedToken.value.toUpperCase() === 'BY') {
                  token.type = tokenTypes.RESERVED;
                  return token;
              }
          }
      }]);

      return PlSqlFormatter;
  }(Formatter);
  PlSqlFormatter.tokenizer = new Tokenizer({
      reservedWords: reservedWords$2,
      reservedTopLevelWords: reservedTopLevelWords$2,
      reservedNewlineWords: reservedNewlineWords$2,
      reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$2,
      stringTypes: ['""', "N''", "''", '``'],
      openParens: ['(', 'CASE'],
      closeParens: [')', 'END'],
      indexedPlaceholderTypes: ['?'],
      namedPlaceholderTypes: [':'],
      lineCommentTypes: ['--'],
      specialWordChars: ['_', '$', '#', '.', '@']
  });

  function _classCallCheck$8(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$3(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$3 = ['AES128', 'AES256', 'ALLOWOVERWRITE', 'ANALYSE', 'ARRAY', 'AS', 'ASC', 'AUTHORIZATION', 'BACKUP', 'BINARY', 'BLANKSASNULL', 'BOTH', 'BYTEDICT', 'BZIP2', 'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'CONSTRAINT', 'CREATE', 'CREDENTIALS', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURRENT_USER_ID', 'DEFAULT', 'DEFERRABLE', 'DEFLATE', 'DEFRAG', 'DELTA', 'DELTA32K', 'DESC', 'DISABLE', 'DISTINCT', 'DO', 'ELSE', 'EMPTYASNULL', 'ENABLE', 'ENCODE', 'ENCRYPT', 'ENCRYPTION', 'END', 'EXPLICIT', 'FALSE', 'FOR', 'FOREIGN', 'FREEZE', 'FULL', 'GLOBALDICT256', 'GLOBALDICT64K', 'GRANT', 'GZIP', 'IDENTITY', 'IGNORE', 'ILIKE', 'INITIALLY', 'INTO', 'LEADING', 'LOCALTIME', 'LOCALTIMESTAMP', 'LUN', 'LUNS', 'LZO', 'LZOP', 'MINUS', 'MOSTLY13', 'MOSTLY32', 'MOSTLY8', 'NATURAL', 'NEW', 'NULLS', 'OFF', 'OFFLINE', 'OFFSET', 'OLD', 'ON', 'ONLY', 'OPEN', 'ORDER', 'OVERLAPS', 'PARALLEL', 'PARTITION', 'PERCENT', 'PERMISSIONS', 'PLACING', 'PRIMARY', 'RAW', 'READRATIO', 'RECOVER', 'REFERENCES', 'REJECTLOG', 'RESORT', 'RESTORE', 'SESSION_USER', 'SIMILAR', 'SYSDATE', 'SYSTEM', 'TABLE', 'TAG', 'TDES', 'TEXT255', 'TEXT32K', 'THEN', 'TIMESTAMP', 'TO', 'TOP', 'TRAILING', 'TRUE', 'TRUNCATECOLUMNS', 'UNIQUE', 'USER', 'USING', 'VERBOSE', 'WALLET', 'WHEN', 'WITH', 'WITHOUT', 'PREDICATE', 'COLUMNS', 'COMPROWS', 'COMPRESSION', 'COPY', 'FORMAT', 'DELIMITER', 'FIXEDWIDTH', 'AVRO', 'JSON', 'ENCRYPTED', 'BZIP2', 'GZIP', 'LZOP', 'PARQUET', 'ORC', 'ACCEPTANYDATE', 'ACCEPTINVCHARS', 'BLANKSASNULL', 'DATEFORMAT', 'EMPTYASNULL', 'ENCODING', 'ESCAPE', 'EXPLICIT_IDS', 'FILLRECORD', 'IGNOREBLANKLINES', 'IGNOREHEADER', 'NULL AS', 'REMOVEQUOTES', 'ROUNDEC', 'TIMEFORMAT', 'TRIMBLANKS', 'TRUNCATECOLUMNS', 'COMPROWS', 'COMPUPDATE', 'MAXERROR', 'NOLOAD', 'STATUPDATE', 'MANIFEST', 'REGION', 'IAM_ROLE', 'MASTER_SYMMETRIC_KEY', 'SSH', 'ACCEPTANYDATE', 'ACCEPTINVCHARS', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'AVRO', 'BLANKSASNULL', 'BZIP2', 'COMPROWS', 'COMPUPDATE', 'CREDENTIALS', 'DATEFORMAT', 'DELIMITER', 'EMPTYASNULL', 'ENCODING', 'ENCRYPTED', 'ESCAPE', 'EXPLICIT_IDS', 'FILLRECORD', 'FIXEDWIDTH', 'FORMAT', 'IAM_ROLE', 'GZIP', 'IGNOREBLANKLINES', 'IGNOREHEADER', 'JSON', 'LZOP', 'MANIFEST', 'MASTER_SYMMETRIC_KEY', 'MAXERROR', 'NOLOAD', 'NULL AS', 'READRATIO', 'REGION', 'REMOVEQUOTES', 'ROUNDEC', 'SSH', 'STATUPDATE', 'TIMEFORMAT', 'SESSION_TOKEN', 'TRIMBLANKS', 'TRUNCATECOLUMNS', 'EXTERNAL', 'DATA CATALOG', 'HIVE METASTORE', 'CATALOG_ROLE', 'VACUUM', 'COPY', 'UNLOAD', 'EVEN', 'ALL'];

  var reservedTopLevelWords$3 = ['ADD', 'AFTER', 'ALTER COLUMN', 'ALTER TABLE', 'DELETE FROM', 'EXCEPT', 'FROM', 'GROUP BY', 'HAVING', 'INSERT INTO', 'INSERT', 'INTERSECT', 'TOP', 'LIMIT', 'MODIFY', 'ORDER BY', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'SET', 'UNION ALL', 'UNION', 'UPDATE', 'VALUES', 'WHERE', 'VACUUM', 'COPY', 'UNLOAD', 'ANALYZE', 'ANALYSE', 'DISTKEY', 'SORTKEY', 'COMPOUND', 'INTERLEAVED', 'FORMAT', 'DELIMITER', 'FIXEDWIDTH', 'AVRO', 'JSON', 'ENCRYPTED', 'BZIP2', 'GZIP', 'LZOP', 'PARQUET', 'ORC', 'ACCEPTANYDATE', 'ACCEPTINVCHARS', 'BLANKSASNULL', 'DATEFORMAT', 'EMPTYASNULL', 'ENCODING', 'ESCAPE', 'EXPLICIT_IDS', 'FILLRECORD', 'IGNOREBLANKLINES', 'IGNOREHEADER', 'NULL AS', 'REMOVEQUOTES', 'ROUNDEC', 'TIMEFORMAT', 'TRIMBLANKS', 'TRUNCATECOLUMNS', 'COMPROWS', 'COMPUPDATE', 'MAXERROR', 'NOLOAD', 'STATUPDATE', 'MANIFEST', 'REGION', 'IAM_ROLE', 'MASTER_SYMMETRIC_KEY', 'SSH', 'ACCEPTANYDATE', 'ACCEPTINVCHARS', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY', 'AVRO', 'BLANKSASNULL', 'BZIP2', 'COMPROWS', 'COMPUPDATE', 'CREDENTIALS', 'DATEFORMAT', 'DELIMITER', 'EMPTYASNULL', 'ENCODING', 'ENCRYPTED', 'ESCAPE', 'EXPLICIT_IDS', 'FILLRECORD', 'FIXEDWIDTH', 'FORMAT', 'IAM_ROLE', 'GZIP', 'IGNOREBLANKLINES', 'IGNOREHEADER', 'JSON', 'LZOP', 'MANIFEST', 'MASTER_SYMMETRIC_KEY', 'MAXERROR', 'NOLOAD', 'NULL AS', 'READRATIO', 'REGION', 'REMOVEQUOTES', 'ROUNDEC', 'SSH', 'STATUPDATE', 'TIMEFORMAT', 'SESSION_TOKEN', 'TRIMBLANKS', 'TRUNCATECOLUMNS', 'EXTERNAL', 'DATA CATALOG', 'HIVE METASTORE', 'CATALOG_ROLE'];

  var reservedTopLevelWordsNoIndent$3 = [];

  var reservedNewlineWords$3 = ['AND', 'CROSS JOIN', 'ELSE', 'INNER JOIN', 'JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'OR', 'OUTER APPLY', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'WHEN', 'VACUUM', 'COPY', 'UNLOAD', 'ANALYZE', 'ANALYSE', 'DISTKEY', 'SORTKEY', 'COMPOUND', 'INTERLEAVED'];

  var StandardSqlFormatter = function (_Formatter) {
    _inherits$3(StandardSqlFormatter, _Formatter);

    function StandardSqlFormatter() {
      _classCallCheck$8(this, StandardSqlFormatter);

      return _possibleConstructorReturn$3(this, (StandardSqlFormatter.__proto__ || Object.getPrototypeOf(StandardSqlFormatter)).apply(this, arguments));
    }

    return StandardSqlFormatter;
  }(Formatter);
  StandardSqlFormatter.tokenizer = new Tokenizer({
    reservedWords: reservedWords$3,
    reservedTopLevelWords: reservedTopLevelWords$3,
    reservedNewlineWords: reservedNewlineWords$3,
    reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$3,
    stringTypes: ['""', "''", '``'],
    openParens: ['('],
    closeParens: [')'],
    indexedPlaceholderTypes: ['?'],
    namedPlaceholderTypes: ['@', '#', '$'],
    lineCommentTypes: ['--']
  });

  var _createClass$6 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$9(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$4(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$4(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$4 = ['ALL', 'ALTER', 'ANALYSE', 'ANALYZE', 'ARRAY_ZIP', 'ARRAY', 'AS', 'ASC', 'AVG', 'BETWEEN', 'CASCADE', 'CASE', 'CAST', 'COALESCE', 'COLLECT_LIST', 'COLLECT_SET', 'COLUMN', 'COLUMNS', 'COMMENT', 'CONSTRAINT', 'CONTAINS', 'CONVERT', 'COUNT', 'CUME_DIST', 'CURRENT ROW', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'DATABASE', 'DATABASES', 'DATE_ADD', 'DATE_SUB', 'DATE_TRUNC', 'DAY_HOUR', 'DAY_MINUTE', 'DAY_SECOND', 'DAY', 'DAYS', 'DECODE', 'DEFAULT', 'DELETE', 'DENSE_RANK', 'DESC', 'DESCRIBE', 'DISTINCT', 'DISTINCTROW', 'DIV', 'DROP', 'ELSE', 'ENCODE', 'END', 'EXISTS', 'EXPLAIN', 'EXPLODE_OUTER', 'EXPLODE', 'FILTER', 'FIRST_VALUE', 'FIRST', 'FIXED', 'FLATTEN', 'FOLLOWING', 'FROM_UNIXTIME', 'FULL', 'GREATEST', 'GROUP_CONCAT', 'HOUR_MINUTE', 'HOUR_SECOND', 'HOUR', 'HOURS', 'IF', 'IFNULL', 'IN', 'INSERT', 'INTERVAL', 'INTO', 'IS', 'LAG', 'LAST_VALUE', 'LAST', 'LEAD', 'LEADING', 'LEAST', 'LEVEL', 'LIKE', 'MAX', 'MERGE', 'MIN', 'MINUTE_SECOND', 'MINUTE', 'MONTH', 'NATURAL', 'NOT', 'NOW()', 'NTILE', 'NULL', 'NULLIF', 'OFFSET', 'ON DELETE', 'ON UPDATE', 'ON', 'ONLY', 'OPTIMIZE', 'OVER', 'PERCENT_RANK', 'PRECEDING', 'RANGE', 'RANK', 'REGEXP', 'RENAME', 'RLIKE', 'ROW', 'ROWS', 'SECOND', 'SEPARATOR', 'SEQUENCE', 'SIZE', 'STRING', 'STRUCT', 'SUM', 'TABLE', 'TABLES', 'TEMPORARY', 'THEN', 'TO_DATE', 'TO_JSON', 'TO', 'TRAILING', 'TRANSFORM', 'TRUE', 'TRUNCATE', 'TYPE', 'TYPES', 'UNBOUNDED', 'UNIQUE', 'UNIX_TIMESTAMP', 'UNLOCK', 'UNSIGNED', 'USING', 'VARIABLES', 'VIEW', 'WHEN', 'WITH', 'YEAR_MONTH', 'SET', 'ADD JAR', 'USE'];

  var reservedTopLevelWords$4 = ['AFTER', 'ALTER COLUMN', 'ALTER DATABASE', 'ALTER SCHEMA', 'ALTER TABLE', 'CLUSTER BY', 'CLUSTERED BY', 'DELETE FROM', 'DISTRIBUTE BY', 'FROM', 'GROUP BY', 'HAVING', 'INSERT INTO', 'INSERT', 'LIMIT', 'OPTIONS', 'ORDER BY', 'PARTITION BY', 'PARTITIONED BY', 'RANGE', 'ROWS', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'TBLPROPERTIES', 'UPDATE', 'USING', 'VALUES', 'WHERE', 'WINDOW'];

  var reservedTopLevelWordsNoIndent$4 = ['EXCEPT ALL', 'EXCEPT', 'INTERSECT ALL', 'INTERSECT', 'UNION ALL', 'UNION'];

  var reservedNewlineWords$4 = ['AND', 'ANTI JOIN', 'CREATE OR', 'CREATE', 'CROSS JOIN', 'ELSE', 'FULL OUTER JOIN', 'INNER JOIN', 'JOIN', 'LATERAL VIEW', 'LEFT ANTI JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'LEFT SEMI JOIN', 'NATURAL ANTI JOIN', 'NATURAL FULL OUTER JOIN', 'NATURAL INNER JOIN', 'NATURAL JOIN', 'NATURAL LEFT ANTI JOIN', 'NATURAL LEFT OUTER JOIN', 'NATURAL LEFT SEMI JOIN', 'NATURAL OUTER JOIN', 'NATURAL RIGHT OUTER JOIN', 'NATURAL RIGHT SEMI JOIN', 'NATURAL SEMI JOIN', 'OR', 'OUTER APPLY', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'RIGHT SEMI JOIN', 'SEMI JOIN', 'WHEN', 'XOR'];

  var SparkSqlFormatter = function (_Formatter) {
      _inherits$4(SparkSqlFormatter, _Formatter);

      function SparkSqlFormatter() {
          _classCallCheck$9(this, SparkSqlFormatter);

          return _possibleConstructorReturn$4(this, (SparkSqlFormatter.__proto__ || Object.getPrototypeOf(SparkSqlFormatter)).apply(this, arguments));
      }

      _createClass$6(SparkSqlFormatter, [{
          key: 'tokenOverride',
          value: function tokenOverride(token) {
              // Fix cases where names are ambiguously keywords or functions
              if (token.type === tokenTypes.RESERVED_TOP_LEVEL && token.value.toUpperCase() === 'WINDOW') {
                  var lookAhead = this.tokenLookAhead();
                  for (var i = 0; i < lookAhead.length; i++) {
                      var aheadToken = lookAhead[i];
                      if (aheadToken.type === tokenTypes.OPEN_PAREN) {
                          // This is a function call, treat it as a reserved word
                          token.type = tokenTypes.RESERVED;
                      }
                      return token;
                  }
              }

              // Fix cases where names are ambiguously keywords or properties
              if (token.type === tokenTypes.CLOSE_PAREN && token.value.toUpperCase() === 'END') {
                  var lookBack = this.tokenLookBack();
                  for (var _i = 0; _i < lookBack.length; _i++) {
                      var backToken = lookBack[_i];
                      if (backToken.type === tokenTypes.OPERATOR && backToken.value === '.') {
                          // This is window().end (or similar) not CASE ... END
                          token.type = tokenTypes.WORD;
                      }
                      return token;
                  }
              }
          }
      }]);

      return SparkSqlFormatter;
  }(Formatter);
  SparkSqlFormatter.tokenizer = new Tokenizer({
      reservedWords: reservedWords$4,
      reservedTopLevelWords: reservedTopLevelWords$4,
      reservedNewlineWords: reservedNewlineWords$4,
      reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$4,
      stringTypes: ['""', "''", '``', '{}'],
      openParens: ['(', 'CASE'],
      closeParens: [')', 'END'],
      indexedPlaceholderTypes: ['?'],
      namedPlaceholderTypes: ['$'],
      lineCommentTypes: ['--'],
      specialWordChars: [':', '/', '.']
  });

  var _createClass$7 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$a(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$5(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$5(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$5 = ['ADD', 'ADMIN', 'ANALYZE', //
  'ARCHIVE', 'ASC', //
  'BEFORE', 'BUCKET', 'BUCKETS', 'CASCADE', //
  'CASE', //
  'CHANGE', 'CLUSTER', 'CLUSTERED', 'CLUSTERSTATUS', 'COLLECTION', 'COLUMN', //
  'COLUMNS', //
  'COMMENT', //
  'COMPACT', 'COMPACTIONS', 'COMPUTE', 'CONCATENATE', 'CONF', 'CONTINUE', 'CUBE', 'DATA', 'DATABASES', //
  'DATETIME', 'DAY', 'DBPROPERTIES', //
  'DEFERRED', 'DEFINED', 'DELIMITED', 'DEPENDENCY', 'DESC', //
  'DIRECTORIES', 'DIRECTORY', 'DISABLE', 'DISTRIBUTE', 'ELEM_TYPE', 'ENABLE', 'ESCAPED', 'EXCHANGE', 'EXCLUSIVE', 'EXPLAIN', 'EXPORT', //
  'FILE', //
  'FILEFORMAT', 'FIRST', 'FORMAT', 'FORMATTED', 'FUNCTIONS', 'HOLD_DDLTIME', 'HOUR', //
  'IDXPROPERTIES', 'IGNORE', 'INDEX', //
  'INDEXES', //
  'INPATH', 'INPUTDRIVER', 'INPUTFORMAT', 'IS', 'ITEMS', 'JAR', 'KEYS', //
  'KEY_TYPE', 'LATERAL', 'LINES', 'LOAD', 'LOCAL', 'LOCK', 'LOCKS', 'LOGICAL', 'LONG', 'MAPJOIN', 'MATERIALIZED', 'MINUS', 'MINUTE', //
  'MONTH', //
  'MSCK', 'NOSCAN', 'NO_DROP', 'OFFLINE', 'OPTION', 'ORDER', 'OUTPUTDRIVER', 'OUTPUTFORMAT', 'OVER', 'OVERWRITE', 'OWNER', 'PARTIALSCAN', 'PARTITION', //
  'PARTITIONED', 'PARTITIONS', //
  'PLUS', 'PRECEDING', 'PRESERVE', 'PRETTY', 'PRINCIPALS', 'PROTECTION', 'PURGE', 'READ', 'READONLY', 'REBUILD', 'RECORDREADER', 'RECORDWRITER', 'RELOAD', 'RENAME', 'REPAIR', 'REPLACE', //
  'RESTRICT', 'REWRITE', 'ROLE', 'ROLES', 'ROLLUP', 'SCHEMA', 'SCHEMAS', 'SECOND', //
  'SEMI', 'SERDE', 'SERDEPROPERTIES', 'SERVER', 'SETS', 'SHARED', 'SHOW', 'SHOW_DATABASE', 'SKEWED', 'SORT', 'SORTED', 'SSL', 'STATISTICS', 'STORED', 'STREAMTABLE', 'STRING', //
  'STRUCT', //
  'TABLE', //
  'TABLES', //
  'TABLESAMPLE', 'TEMPORARY', //
  'TERMINATED', //
  'TINYINT', 'TOUCH', 'TRANSACTIONS', 'UNARCHIVE', 'UNDO', 'UNIONTYPE', 'UNLOCK', 'UNSET', 'UNSIGNED', //
  'URI', 'USE', //
  'UTC', 'UTCTIMESTAMP', 'VALUE_TYPE', 'VIEW', //
  'WHILE', 'YEAR', 'ALL', 'ALTER', 'ARRAY', 'AS', //
  'AUTHORIZATION', 'BETWEEN', //
  'BIGINT', //
  'BINARY', 'BOOLEAN', 'BOTH', 'BY', 'CAST', 'CHAR', 'CROSS', 'CURRENT', 'CURRENT_DATE', //
  'CURRENT_TIMESTAMP', //
  'CURSOR', 'DATABASE', //
  'DATE', 'DECIMAL', 'DELETE', //
  'DESCRIBE', //
  'DISTINCT', //
  'DOUBLE', 'DROP', 'ELSE', //
  'END', //
  'EXISTS', //
  'EXTENDED', 'EXTERNAL', 'FETCH', 'FLOAT', 'FOLLOWING', 'FOR', 'FULL', //
  'FUNCTION', //
  'GRANT', //
  'GROUP', 'GROUPING', 'IF', //
  'IMPORT', //
  'IN', //
  'INNER', //
  'INT', 'INTERVAL', //
  'INTO', //
  'IS', 'LESS', 'LIKE', //
  'MACRO', 'MAP', 'MORE', 'NONE', 'NOT', //
  'NULL', 'OF', 'ON', //
  'OUT', 'OUTER', 'PERCENT', 'PROCEDURE', 'READS', 'REDUCE', 'REGEXP', //
  'REVOKE', 'RIGHT', 'RLIKE', //
  'SET', //
  'SMALLINT', 'THEN', //
  'TIMESTAMP', 'TO', //
  'TRANSFORM', //
  'TRIGGER', 'TRUNCATE', //
  'UNBOUNDED', //
  'UNIQUEJOIN', 'USER', 'VARCHAR', 'WITH'];

  var reservedTopLevelWords$5 = ['AFTER', 'ALTER COLUMN', //
  'ALTER DATABASE', 'ALTER SCHEMA', 'ALTER TABLE', 'DELETE FROM', //
  'DISTRIBUTE BY', 'FROM', //
  'GROUP BY', //
  'HAVING', 'INSERT INTO', //
  'INSERT', //
  'LIMIT', 'OPTIONS', 'ORDER BY', //
  'PARTITION BY', 'PARTITIONED BY', //
  'RANGE', 'SELECT', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'TBLPROPERTIES', //
  'UPDATE', //
  'USING', //
  'VALUES', //
  'WHERE', //
  'WINDOW'];

  var reservedTopLevelWordsNoIndent$5 = ['EXCEPT ALL', 'EXCEPT', 'INTERSECT ALL', 'INTERSECT', //
  'UNION ALL', 'UNION'];

  var reservedNewlineWords$5 = ['LEFT', 'LOCATION', 'ROWS', 'ROW', 'FIELDS', 'AND', //
  'ANTI JOIN', 'CREATE OR', //
  'CREATE', //
  'CROSS JOIN', 'ELSE', //
  'FULL OUTER JOIN', 'INNER JOIN', //
  'JOIN', 'LATERAL VIEW', 'LEFT ANTI JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'LEFT SEMI JOIN', 'NATURAL ANTI JOIN', 'NATURAL FULL OUTER JOIN', 'NATURAL INNER JOIN', 'NATURAL JOIN', 'NATURAL LEFT ANTI JOIN', 'NATURAL LEFT OUTER JOIN', 'NATURAL LEFT SEMI JOIN', 'NATURAL OUTER JOIN', 'NATURAL RIGHT OUTER JOIN', 'NATURAL RIGHT SEMI JOIN', 'NATURAL SEMI JOIN', 'OR', 'OUTER APPLY', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'RIGHT SEMI JOIN', 'SEMI JOIN', 'WHEN', //
  'XOR'];

  var SparkSqlFormatter$1 = function (_Formatter) {
      _inherits$5(SparkSqlFormatter, _Formatter);

      function SparkSqlFormatter() {
          _classCallCheck$a(this, SparkSqlFormatter);

          return _possibleConstructorReturn$5(this, (SparkSqlFormatter.__proto__ || Object.getPrototypeOf(SparkSqlFormatter)).apply(this, arguments));
      }

      _createClass$7(SparkSqlFormatter, [{
          key: 'tokenOverride',
          value: function tokenOverride(token) {
              // Fix cases where names are ambiguously keywords or functions
              if (token.type === tokenTypes.RESERVED_TOP_LEVEL && token.value.toUpperCase() === 'WINDOW') {
                  var lookAhead = this.tokenLookAhead();
                  for (var i = 0; i < lookAhead.length; i++) {
                      var aheadToken = lookAhead[i];
                      if (aheadToken.type === tokenTypes.OPEN_PAREN) {
                          // This is a function call, treat it as a reserved word
                          token.type = tokenTypes.RESERVED;
                      }
                      return token;
                  }
              }

              // Fix cases where names are ambiguously keywords or properties
              if (token.type === tokenTypes.CLOSE_PAREN && token.value.toUpperCase() === 'END') {
                  var lookBack = this.tokenLookBack();
                  for (var _i = 0; _i < lookBack.length; _i++) {
                      var backToken = lookBack[_i];
                      if (backToken.type === tokenTypes.OPERATOR && backToken.value === '.') {
                          // This is window().end (or similar) not CASE ... END
                          token.type = tokenTypes.WORD;
                      }
                      return token;
                  }
              }
          }
      }]);

      return SparkSqlFormatter;
  }(Formatter);
  SparkSqlFormatter$1.tokenizer = new Tokenizer({
      reservedWords: reservedWords$5,
      reservedTopLevelWords: reservedTopLevelWords$5,
      reservedNewlineWords: reservedNewlineWords$5,
      reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$5,
      stringTypes: ['""', "''", '``', '{}'],
      openParens: ['(', 'CASE'],
      closeParens: [')', 'END'],
      indexedPlaceholderTypes: ['?'],
      namedPlaceholderTypes: ['$'],
      lineCommentTypes: ['--', '-- '],
      specialWordChars: [':', '/', '.']
  });

  function _classCallCheck$b(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$6(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$6(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var reservedWords$6 = ['SELECT', 'ACCESSIBLE', 'ACTION', 'AGAINST', 'AGGREGATE', 'ALGORITHM', 'ALL', 'ALTER', 'ANALYSE', 'ANALYZE', 'AS', 'ASC', 'AUTOCOMMIT', 'AUTO_INCREMENT', 'BACKUP', 'BEGIN', 'BETWEEN', 'BINLOG', 'BOTH', 'CASCADE', 'CHANGE', 'CHANGED', 'CHARACTER SET', 'CHARSET', 'CHECK', 'CHECKSUM', 'COLLATE', 'COLLATION', 'COLUMN', 'COLUMNS', 'COMMENT', 'COMMIT', 'COMMITTED', 'COMPRESSED', 'CONCURRENT', 'CONSTRAINT', 'CONTAINS', 'CONVERT', 'CREATE', 'CROSS', 'CURRENT_TIMESTAMP', 'DATABASE', 'DATABASES', 'DAY', 'DAY_HOUR', 'DAY_MINUTE', 'DAY_SECOND', 'DEFAULT', 'DEFINER', 'DELAYED', 'DELETE', 'DESC', 'DESCRIBE', 'DETERMINISTIC', 'DISTINCT', 'DISTINCTROW', 'DIV', 'DO', 'DROP', 'DUMPFILE', 'DUPLICATE', 'DYNAMIC', 'ELSE', 'ENCLOSED', 'ENGINE', 'ENGINES', 'ENGINE_TYPE', 'ESCAPE', 'ESCAPED', 'EVENTS', 'EXEC', 'EXECUTE', 'EXISTS', 'EXPLAIN', 'EXTENDED', 'FAST', 'FETCH', 'FIELDS', 'FILE', 'FIRST', 'FIXED', 'FLUSH', 'FOR', 'FORCE', 'FOREIGN', 'FULL', 'FULLTEXT', 'FUNCTION', 'GLOBAL', 'GRANT', 'GRANTS', 'GROUP_CONCAT', 'HEAP', 'HIGH_PRIORITY', 'HOSTS', 'HOUR', 'HOUR_MINUTE', 'HOUR_SECOND', 'IDENTIFIED', 'IF', 'IFNULL', 'IGNORE', 'IN', 'INDEX', 'INDEXES', 'INFILE', 'INSERT', 'INSERT_ID', 'INSERT_METHOD', 'INTERVAL', 'INTO', 'INVOKER', 'IS', 'ISOLATION', 'KEY', 'KEYS', 'KILL', 'LAST_INSERT_ID', 'LEADING', 'LEVEL', 'LIKE', 'LINEAR', 'LINES', 'LOAD', 'LOCAL', 'LOCK', 'LOCKS', 'LOGS', 'LOW_PRIORITY', 'MARIA', 'MASTER', 'MASTER_CONNECT_RETRY', 'MASTER_HOST', 'MASTER_LOG_FILE', 'MATCH', 'MAX_CONNECTIONS_PER_HOUR', 'MAX_QUERIES_PER_HOUR', 'MAX_ROWS', 'MAX_UPDATES_PER_HOUR', 'MAX_USER_CONNECTIONS', 'MEDIUM', 'MERGE', 'MINUTE', 'MINUTE_SECOND', 'MIN_ROWS', 'MODE', 'MODIFY', 'MONTH', 'MRG_MYISAM', 'MYISAM', 'NAMES', 'NATURAL', 'NOT', 'NOW()', 'NULL', 'OFFSET', 'ON DELETE', 'ON UPDATE', 'ON', 'ONLY', 'OPEN', 'OPTIMIZE', 'OPTION', 'OPTIONALLY', 'OUTFILE', 'PACK_KEYS', 'PAGE', 'PARTIAL', 'PARTITION', 'PARTITIONS', 'PASSWORD', 'PRIMARY', 'PRIVILEGES', 'PROCEDURE', 'PROCESS', 'PROCESSLIST', 'PURGE', 'QUICK', 'RAID0', 'RAID_CHUNKS', 'RAID_CHUNKSIZE', 'RAID_TYPE', 'RANGE', 'READ', 'READ_ONLY', 'READ_WRITE', 'REFERENCES', 'REGEXP', 'RELOAD', 'RENAME', 'REPAIR', 'REPEATABLE', 'REPLACE', 'REPLICATION', 'RESET', 'RESTORE', 'RESTRICT', 'RETURN', 'RETURNS', 'REVOKE', 'RLIKE', 'ROLLBACK', 'ROW', 'ROWS', 'ROW_FORMAT', 'SECOND', 'SECURITY', 'SEPARATOR', 'SERIALIZABLE', 'SESSION', 'SHARE', 'SHOW', 'SHUTDOWN', 'SLAVE', 'SONAME', 'SOUNDS', 'SQL', 'SQL_AUTO_IS_NULL', 'SQL_BIG_RESULT', 'SQL_BIG_SELECTS', 'SQL_BIG_TABLES', 'SQL_BUFFER_RESULT', 'SQL_CACHE', 'SQL_CALC_FOUND_ROWS', 'SQL_LOG_BIN', 'SQL_LOG_OFF', 'SQL_LOG_UPDATE', 'SQL_LOW_PRIORITY_UPDATES', 'SQL_MAX_JOIN_SIZE', 'SQL_NO_CACHE', 'SQL_QUOTE_SHOW_CREATE', 'SQL_SAFE_UPDATES', 'SQL_SELECT_LIMIT', 'SQL_SLAVE_SKIP_COUNTER', 'SQL_SMALL_RESULT', 'SQL_WARNINGS', 'START', 'STARTING', 'STATUS', 'STOP', 'STORAGE', 'STRAIGHT_JOIN', 'STRING', 'STRIPED', 'SUPER', 'TABLE', 'TABLES', 'TEMPORARY', 'TERMINATED', 'THEN', 'TO', 'TRAILING', 'TRANSACTIONAL', 'TRUE', 'TRUNCATE', 'TYPE', 'TYPES', 'UNCOMMITTED', 'UNIQUE', 'UNLOCK', 'UNSIGNED', 'USAGE', 'USE', 'USING', 'VARIABLES', 'VIEW', 'WITH', 'WORK', 'WRITE', 'YEAR_MONTH'];

  var reservedTopLevelWords$6 = ['SET', 'ADD', 'AFTER', 'ALTER COLUMN', 'ALTER TABLE', 'CASE', 'DELETE FROM', 'END', 'EXCEPT', 'FETCH FIRST', 'FROM', 'GROUP BY', 'GO', 'HAVING', 'INSERT INTO', 'INSERT', 'LIMIT', 'MODIFY', 'ORDER BY', 'SET CURRENT SCHEMA', 'SET SCHEMA', 'UPDATE', 'VALUES', 'WHERE'];

  var reservedTopLevelWordsNoIndent$6 = ['INTERSECT', 'INTERSECT ALL', 'MINUS', 'UNION', 'UNION ALL'];

  var reservedNewlineWords$6 = ['AND', 'CROSS APPLY', 'CROSS JOIN', 'ELSE', 'INNER JOIN', 'JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'OR', 'OUTER APPLY', 'OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN', 'WHEN', 'XOR'];

  var StandardSqlFormatter$1 = function (_Formatter) {
      _inherits$6(StandardSqlFormatter, _Formatter);

      function StandardSqlFormatter() {
          _classCallCheck$b(this, StandardSqlFormatter);

          return _possibleConstructorReturn$6(this, (StandardSqlFormatter.__proto__ || Object.getPrototypeOf(StandardSqlFormatter)).apply(this, arguments));
      }

      return StandardSqlFormatter;
  }(Formatter);
  StandardSqlFormatter$1.tokenizer = new Tokenizer({
      reservedWords: reservedWords$6,
      reservedTopLevelWords: reservedTopLevelWords$6,
      reservedNewlineWords: reservedNewlineWords$6,
      reservedTopLevelWordsNoIndent: reservedTopLevelWordsNoIndent$6,
      stringTypes: ['""', "N''", "''", '``', '[]'],
      openParens: ['(', 'CASE'],
      closeParens: [')', 'END'],
      indexedPlaceholderTypes: ['?'],
      namedPlaceholderTypes: ['@', ':'],
      lineCommentTypes: ['#', '--']
  });

  var FORMATTERS = {
      db2: Db2Formatter,
      n1ql: N1qlFormatter,
      'pl/sql': PlSqlFormatter,
      plsql: PlSqlFormatter,
      redshift: StandardSqlFormatter,
      spark: SparkSqlFormatter,
      sql: StandardSqlFormatter$1,
      hive: SparkSqlFormatter$1

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

  };var format = function format(query) {
      var cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var Formatter = StandardSqlFormatter$1;
      if (cfg.language !== undefined) {
          Formatter = FORMATTERS[cfg.language];
      }
      if (Formatter === undefined) {
          throw Error('Unsupported SQL dialect: ' + cfg.language);
      }
      return new Formatter(cfg).format(query);
  };

  exports.format = format;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
