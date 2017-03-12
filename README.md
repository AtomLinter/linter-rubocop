# linter-rubocop

[![Gitter](https://img.shields.io/badge/gitter-join%20chat-1dce73.svg?style=flat)](https://gitter.im/AtomLinter/Linter?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/AtomLinter/linter-rubocop.svg?branch=master)](https://travis-ci.org/AtomLinter/linter-rubocop)
[![Plugin installs!](https://img.shields.io/apm/dm/linter-rubocop.svg)](https://atom.io/packages/linter-rubocop)
[![Package version!](https://img.shields.io/apm/v/linter-rubocop.svg?style=flat)](https://atom.io/packages/linter-rubocop)
[![Dependencies!](https://david-dm.org/AtomLinter/Linter.svg)](https://david-dm.org/AtomLinter/linter-rubocop)

This linter plugin for [Linter](https://github.com/AtomLinter/Linter) provides
an interface to [rubocop](https://github.com/bbatsov/rubocop). It will be used
with files that have the “Ruby” syntax.

## Installation

Linter package must be installed in order to use this plugin. If Linter is not
installed, please follow the instructions [here](https://github.com/AtomLinter/Linter).

### `rubocop` installation

Before using this plugin, you must ensure that `rubocop`, version 0.37 or
greater, is installed on your system. To install `rubocop`, do the following:

1.  Install [ruby](https://www.ruby-lang.org/).

2.  Install [rubocop](https://github.com/bbatsov/rubocop) by typing the
    following in a terminal:

    ```shell
    gem install rubocop
    ```

Now you can proceed to install the linter-rubocop plugin.

### Plugin installation

```shell
apm install linter-rubocop
```

## Settings

You can configure linter-rubocop by editing `~/.atom/config.cson`
(choose Open Your Config in Atom menu):

### Using RVM

If you're using RVM and receiving errors in Atom that indicate Rubocop can't be
found, you may need to change `/bin` to `/wrappers` in the path that gets
returned from `which rubocop` before using it as your `executablePath` setting.
For example, change:

```text
/Users/JohnDoe/.rvm/gems/ruby-2.2.4@global/bin/rubocop
```

To:

```text
/Users/JohnDoe/.rvm/gems/ruby-2.2.4@global/wrappers/rubocop
```

## Contributing

If you would like to contribute enhancements or fixes, please do the following:

1.  Fork the plugin repository.
2.  Hack on a separate topic branch created from the latest `master`.
3.  Commit and push the topic branch.
4.  Make a pull request.
5.  Welcome to the club!

Please note that modifications should follow these coding guidelines:

-   Indent is 2 spaces.
-   Code should pass the `coffeelint` linter.
-   Vertical whitespace helps readability, don’t be afraid to use it.

Thank you for helping out!

## Donation

[![Share the love!](https://s3-eu-west-1.amazonaws.com/atom-linter/we-need-your-help.png?style=flat)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=KXUYS4ARNHCN8 "Share the love")

[![Gratipay donate button](https://img.shields.io/gratipay/hd-deman.svg?style=flat)](https://www.gratipay.com/hd-deman/ "Donate weekly to this project using Gratipay")
[![PayPayl donate button](https://img.shields.io/badge/paypal-donate-yellow.svg?style=flat)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=KXUYS4ARNHCN8 "Donate once-off to this project using Paypal")
[![BitCoin donate button](https://img.shields.io/badge/bitcoin-donate-yellow.svg?style=flat)](https://www.coinbase.com/checkouts/2945dab392cb1cefbb7097e4cd17a603 "Donate once-off to this project using BitCoin")
