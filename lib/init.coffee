module.exports =
  config:
    executablePath:
      title: 'Rubocop Executable Path'
      description: 'The path where rubocop is located'
      type: 'string'
      default: ''
    cmd:
      title: 'Rubocop Custom Command'
      description: 'Use a custom command to launch Rubocop. Please, do not ' +
                   'forget the options --force-exclusion --format emacs. And ' +
                   'do not forget to restart Atom or reload the packages.'
      type: 'string'
      default: 'rubocop --force-exclusion --format emacs'

  activate: ->
    console.log 'activate linter-rubocop'
