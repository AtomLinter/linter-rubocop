helpers = require 'atom-linter'

COMMAND_CONFIG_KEY = 'linter-rubocop.command'
OLD_EXEC_PATH_CONFIG_KEY = 'linter-rubocop.executablePath'
OLD_ARGS_CONFIG_KEY = 'linter-rubocop.additionalArguments'
DEFAULT_LOCATION = {line: 1, column: 1, length: 0}
DEFAULT_ARGS = ['--cache', 'false', '--force-exclusion', '-f', 'json', '-s']
DEFAULT_MESSAGE = 'Unknown Error'
WARNINGS = new Set(['refactor', 'convention', 'warning'])

convertOldConfig = ->
  execPath = atom.config.get OLD_EXEC_PATH_CONFIG_KEY
  args = atom.config.get OLD_ARGS_CONFIG_KEY
  return unless execPath || args
  atom.config.set COMMAND_CONFIG_KEY, "#{execPath} #{args}".trim()
  atom.config.set OLD_EXEC_PATH_CONFIG_KEY, undefined
  atom.config.set OLD_ARGS_CONFIG_KEY, undefined

lint = (editor) ->
  convertOldConfig()
  command = atom.config.get(COMMAND_CONFIG_KEY).split(/\s+/).filter((i) -> i)
    .concat(DEFAULT_ARGS, path = editor.getPath())
  options = {stdin: editor.getText(), stream: 'both'}
  helpers.exec(command[0], command[1..], options).then (result) ->
    {stdout, stderr} = result
    parsed = try JSON.parse(stdout)
    throw new Error stderr || stdout unless typeof parsed is 'object'
    (parsed.files?[0]?.offenses || []).map (offense) ->
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
    command:
      type: 'string'
      title: 'Command'
      default: 'rubocop'
      description:
        'Examples: `rubocop`, `bundle exec rubocop --config /my/rubocop.yml`'

  provideLinter: -> linter
