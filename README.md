linter-rubocop
=========================

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides an interface to [rubocop](https://github.com/bbatsov/rubocop). It will be used with files that have the “Ruby” syntax.

## Installation
Linter package must be installed in order to use this plugin. If Linter is not installed, please follow the instructions [here](https://github.com/AtomLinter/Linter).

### rubocop installation
Before using this plugin, you must ensure that `rubocop` is installed on your system. To install `rubocop`, do the following:

1. Install [ruby](https://www.ruby-lang.org/).

2. Install [rubocop](https://github.com/bbatsov/rubocop) by typing the following in a terminal:
   ```
   gem install rubocop
   ```

Now you can proceed to install the linter-rubocop plugin.

### Plugin installation
```
$ apm install linter-rubocop
```

## Settings
You can configure linter-rubocop by editing ~/.atom/config.cson (choose Open Your Config in Atom menu):

#### rubocopExecutablePath
```
'linter-rubocop':
  'rubocopExecutablePath': null # rubocop path. 
```
Run `which rubocop` to find the path,
if you using rbenv run `rbenv which rubocop`

**Note**: This plugin finds the nearest .rubocop.yml file and uses the --config command line argument to use that file, so you may not use the --config argument in the linter settings.

## Contributing
If you would like to contribute enhancements or fixes, please do the following:

1. Fork the plugin repository.
1. Hack on a separate topic branch created from the latest `master`.
1. Commit and push the topic branch.
1. Make a pull request.
1. welcome to the club

Please note that modifications should follow these coding guidelines:

- Indent is 2 spaces.
- Code should pass coffeelint linter.
- Vertical whitespace helps readability, don’t be afraid to use it.

Thank you for helping out!

## Donation
[![Share the love!](https://chewbacco-stuff.s3.amazonaws.com/donate.png)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=KXUYS4ARNHCN8)
