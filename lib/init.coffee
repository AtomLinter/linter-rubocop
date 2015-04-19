module.exports =
  config:
    rubocopExecutablePath:
      type: 'string'
      default: ''

  activate: ->
    console.log 'activate linter-rubocop'
