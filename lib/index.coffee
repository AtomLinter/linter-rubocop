path = require 'path'
helpers = require 'atom-linter'
escapeHtml = require 'escape-html'

COMMAND_CONFIG_KEY = 'linter-rubocop.command'
DISABLE_CONFIG_KEY = 'linter-rubocop.disableWhenNoConfigFile'
OLD_EXEC_PATH_CONFIG_KEY = 'linter-rubocop.executablePath'
OLD_ARGS_CONFIG_KEY = 'linter-rubocop.additionalArguments'
DEFAULT_LOCATION = {line: 1, column: 1, length: 0}
DEFAULT_ARGS = [
  '--cache', 'false',
  '--force-exclusion',
  '--format', 'json',
  '--stdin',
  '--display-style-guide',
]
DEFAULT_MESSAGE = 'Unknown Error'
WARNINGS = new Set(['refactor', 'convention', 'warning'])

convertOldConfig = ->
  execPath = atom.config.get OLD_EXEC_PATH_CONFIG_KEY
  args = atom.config.get OLD_ARGS_CONFIG_KEY
  return unless execPath or args
  atom.config.set COMMAND_CONFIG_KEY, "#{execPath or ''} #{args or ''}".trim()
  atom.config.set OLD_EXEC_PATH_CONFIG_KEY, undefined
  atom.config.set OLD_ARGS_CONFIG_KEY, undefined

extractUrl = (message) ->
  [message, url] = message.split /\ \((.*)\)/, 2
  {message, url}

formatMessage = ({message, cop_name, url}) ->
  formatted_message = escapeHtml(message or DEFAULT_MESSAGE)
  formatted_cop_name =
    if cop_name?
      if url?
        " (<a href=\"#{escapeHtml url}\">#{escapeHtml cop_name}</a>)"
      else
        " (#{escapeHtml cop_name})"
    else
      ''
  formatted_message + formatted_cop_name

lint = (editor) ->
  convertOldConfig()
  command = atom.config.get(COMMAND_CONFIG_KEY).split(/\s+/).filter((i) -> i)
    .concat(DEFAULT_ARGS, filePath = editor.getPath())
  if atom.config.get(DISABLE_CONFIG_KEY) is true
    config = helpers.find(filePath, '.rubocop.yml')
    return [] if config is null
  cwd = path.dirname helpers.find filePath, '.'
  stdin = editor.getText()
  stream = 'both'
  helpers.exec(command[0], command[1..], {cwd, stdin, stream}).then (result) ->
    {stdout, stderr} = result
    parsed = try JSON.parse(stdout)
    throw new Error stderr or stdout unless typeof parsed is 'object'
    (parsed.files?[0]?.offenses or []).map (offense) ->
      {cop_name, location, message, severity} = offense
      {message, url} = extractUrl message
      {line, column, length} = location or DEFAULT_LOCATION
      type: if WARNINGS.has(severity) then 'Warning' else 'Error'
      html: formatMessage {cop_name, message, url}
      filePath: filePath
      range: [[line - 1, column - 1], [line - 1, column + length - 1]]

linter =
  name: 'RuboCop'
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
      description: '
        This is the absolute path to your `rubocop` command. You may need to run
        `which rubocop` or `rbenv which rubocop` to find this. Examples:
        `/usr/local/bin/rubocop` or `/usr/local/bin/bundle exec rubocop --config
        /my/rubocop.yml`.
      '
    disableWhenNoConfigFile:
      type: 'boolean'
      title: 'Disable when no .rubocop.yml config file is found'
      default: false
      description: '
        Only run linter if a RuboCop config file is found somewhere in the path
        for the current file.
      '

  provideLinter: -> linter
