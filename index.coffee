helpers = require 'atom-linter'

COMMAND_CONFIG_KEY = 'linter-rubocop.executablePath'
ARGS_CONFIG_KEY = 'linter-rubocop.additionalArguments'
DEFAULT_LOCATION = {line: 1, column: 1, length: 0}
DEFAULT_ARGS = ['--cache', 'false', '--force-exclusion', '-f', 'json', '-s']
DEFAULT_MESSAGE = 'Unknown Error'
WARNINGS = new Set(['refactor', 'convention', 'warning'])

lint = (editor) ->
  command = atom.config.get(COMMAND_CONFIG_KEY)
  args = atom.config.get(ARGS_CONFIG_KEY).split(/\s+/).filter((i) -> i)
    .concat(DEFAULT_ARGS, path = editor.getPath())
  options = {stdin: editor.getText()}
  helpers.exec(command, args, options).then (result) ->
    (JSON.parse(result).files[0]?.offenses || []).map (offense) ->
      {cop_name, location, message, severity} = offense
      {line, column, length} = location || DEFAULT_LOCATION
      type: if WARNINGS.has(severity) then 'Warning' else 'Error'
      text: (message || DEFAULT_MESSAGE) +
        (if cop_name then " (#{cop_name})" else '')
      filePath: path
      range: [[line - 1, column - 1], [line - 1, column + length - 1]]

linter =
  grammarScopes: [
    'source.ruby'
    'source.ruby.rails'
    'source.ruby.rspec'
    'source.ruby.chef'
  ]
  scope: 'file'
  lintOnFly: true
  lint: lint

module.exports =
  config:
    executablePath:
      type: 'string'
      title: 'Executable Path'
      default: 'rubocop'
    additionalArguments:
      title: 'Additional Arguments'
      type: 'string'
      default: ''

  provideLinter: -> linter
