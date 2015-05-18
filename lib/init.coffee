module.exports =
  config:
    executablePath:
      title: 'Rubocop Executable Path'
      description: 'The path where rubocop is located'
      type: 'string'
      default: ''

  activate: ->
    console.log 'activate linter-rubocop'
