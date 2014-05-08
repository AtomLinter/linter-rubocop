linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"

class LinterRubocop extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: 'source.ruby'

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: 'rubocop --format emacs'

  executablePath: null

  linterName: 'rubocop'

  # A regex pattern used to extract information from the executable's output.
  regex:
    '.+?:(?<line>\\d+):(?<col>\\d+): ' +
    '((?<warning>[RCW])|(?<error>[EF])): ' +
    '(?<message>.+)'

  constructor: (editorView)->
    atom.config.observe 'linter-rubocop.rubocopExecutablePath', =>
      @executablePath = atom.config.get 'linter-rubocop.rubocopExecutablePath'

  destroy: ->
    atom.config.unobserve 'linter-rubocop.rubocopExecutablePath'

module.exports = LinterRubocop
