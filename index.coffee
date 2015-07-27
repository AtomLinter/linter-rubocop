{BufferedProcess, CompositeDisposable} = require 'atom'
{exists, unlink, writeFile} = require 'fs'
{join, resolve} = require 'path'
{randomBytes} = require 'crypto'
{tmpdir} = require 'os'

findFile = (dir, file, cb) ->
  absolute = join dir, file
  exists absolute, (doesExist) ->
    return cb absolute if doesExist
    parent = resolve dir, '..'
    return cb() if dir is parent
    findFile parent, file, cb

lint = (editor, command, args) ->
  filePath = editor.getPath()
  tmpPath = join tmpdir(), randomBytes(32).toString 'hex'
  out = ''

  appendToOut = (data) -> out += data
  getConfig = (cb) -> findFile filePath, '.rubocop.yml', cb
  writeTmp = (cb) -> writeFile tmpPath, editor.getText(), cb
  cleanup = (cb) -> unlink tmpPath, cb

  new Promise (resolve, reject) -> getConfig (config) -> writeTmp (er) ->
    return reject er if er
    new BufferedProcess
      command: command
      args: [
        '-f'
        'json'
        (if config then ['-c', config] else [])...
        args...
        tmpPath
      ]
      stdout: appendToOut
      stderr: appendToOut
      exit: -> cleanup ->
        try {offenses: errors} = JSON.parse(out).files[0]
        return reject new Error out unless errors
        resolve errors.map (error) ->
          {line, column, length} =
            error.location || {line: 1, column: 1, length: 0}
          type:
            switch error.severity
              when 'refactor', 'convention', 'warning' then 'warning'
              else 'error'
          text: (error.message or 'Unknown Error') +
            (if error.cop_name then " (#{error.cop_name})" else ''),
          filePath: filePath,
          range: [[line - 1, column - 1], [line - 1, column + length - 1]]

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

  activate: ->
    prefix = 'linter-rubocop-caseywebdev.'
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.config.observe "#{prefix}executablePath",
      (executablePath) => @executablePath = executablePath
    @subscriptions.add atom.config.observe "#{prefix}additionalArguments",
      (args) => @additionalArguments = if args then args.split ' ' else []

  deactivate: ->
    @subscriptions.dispose()

  provideLinter: ->
    provider =
      grammarScopes: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec'],
      scope: 'file'
      lintOnFly: true
      lint: (editor) => lint editor, @executablePath, @additionalArguments
