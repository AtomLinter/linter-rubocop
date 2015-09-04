{CompositeDisposable} = require 'atom'

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
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.config.observe('linter-rubocop.executablePath', (executablePath) =>
      @executablePath = executablePath
    )
    @subscriptions.add atom.config.observe('linter-rubocop.additionalArguments', (extraArguments) =>
      @arguments = extraArguments.split(' ').filter((i) => i)
    )

  deactivate: ->
    @subscriptions.dispose()

  provideLinter: ->
    helpers = require('atom-linter')
    provider =
      grammarScopes: ['source.ruby', 'source.ruby.rails', 'source.ruby.rspec', 'source.ruby.chef']
      scope: 'file'
      lintOnFly: true
      lint: (textEditor) =>
        return helpers.exec(@executablePath, ['-f', 'json', '-s', textEditor.getPath()].concat(@arguments),
          {stdin: textEditor.getText()}).then (contents) ->
            console.log(contents)
            return []
