linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"
{findFile} = require "#{linterPath}/lib/utils"
{Range} = require 'atom'

class LinterRubocop extends Linter
  @syntax: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec']

<<<<<<< HEAD
  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: atom.config.get 'linter-rubocop.cmd'

=======
>>>>>>> Fix for Atom 1.x, use JSON formatter, add additionalArguments param
  linterName: 'rubocop'

  cmd: 'rubocop -f json'

  options: ['additionalArguments', 'executablePath']

  beforeSpawnProcess: (command, args, options) ->
    rails = @editor.getGrammar().scopeName is 'source.ruby.rails'
    {
      command,
      args: args.slice(0, -1).concat(
        if config = findFile @cwd, '.rubocop.yml' then ['-c', config] else []
        if rails then '-R' else []
        if @additionalArguments then @additionalArguments.split(' ') else []
        args.slice(-1)
      )
      options
    }

  processMessage: (message, cb) ->
    try
      {offenses} = JSON.parse(message).files[0]
    catch
      return cb [@createMessage {message}]

    cb(@createMessage offense for offense in offenses)

  createMessage: (offense) ->
    {
      line: line = (offense.location?.line or 1) - 1,
      col: col = (offense.location?.column or 1) - 1,
      level:
        switch offense.severity
          when 'refactor', 'convention', 'warning' then 'warning'
          else 'error'
      message: (offense.message or 'Unknown Error') +
        (if offense.cop_name then " (#{offense.cop_name})" else ''),
      linter: @linterName,
      range:
        new Range([line, col], [line, col + (offense.location?.length or 0)])
    }

module.exports = LinterRubocop
