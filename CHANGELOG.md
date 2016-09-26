# Changelog

## 0.5.0

*   Note the minimum `rubocop` version of v0.37.0
*   Add specs and enable CI builds
*   Add links in messages to the rule documentation

## 0.4.7

### Maintenance

*   Upgrade to `atom-linter@4.3.0`.

## 0.4.6

### Maintenance

*   Upgrade to `atom-linter@4.2.0` which adds $PATH support.

## 0.4.5

### Maintenance

*   Upgrade to `atom-linter@4`.

## 0.4.4

### Bug Fixes

*   Fix `undefined` showing up in `command` option.

## 0.4.3

### Changes

*   Improve command description.

## 0.4.2

### Changes

*   There is now a single `command` option. Example commands are `rubocop`,
    `bundle exec rubocop`, `rubocop --config /my/config`, etc. The necessary
    arguments `linter-rubocop` needs will be automatically appended to whatever base
    command you specify. Existing `executablePath` and `additionalArguments`
    config options will automatically be merged into the `command` option on the
    first run.

### Bug Fixes

*   The linter will now run in the directory of the file being linted. This
    should make `bundle exec rubocop` function correctly again.

## 0.4.1

### Bug Fixes

*   The linter will now ignore `stderr` output from `rubocop` if it is still able to
    parse `stdout`.

## 0.4.0

### New Features

*   Use STDIN for linting
    [#72](https://github.com/AtomLinter/linter-rubocop/pull/72/files). This
    version requires `rubocop >= 0.34.0`.

## 0.2.2

### Bugs fixed

*   Expose `rubocopExecutablePath` in settings-view [#23](https://github.com/AtomLinter/linter-rubocop/issues/23)

## 0.2.1

### New Features

*   Support `rspec` syntax [#12](https://github.com/AtomLinter/linter-rubocop/pull/12)

## 0.2.0

### New Features

*   Run linter under `source.ruby.rails`, with `-R` flag [#5](https://github.com/AtomLinter/linter-rubocop/issues/5)
