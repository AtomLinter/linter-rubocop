# Changelog

## [v1.1.0](https://github.com/AtomLinter/linter-rubocop/compare/v1.0.0...v1.1.0)

*   Use [atom-package-deps](https://www.npmjs.com/package/atom-package-deps) to ensure that Atom Linter is installed

## [v1.0.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.3...v1.0.0)

*   Re-write in ES2017 (No more ☕ script yey!)
*   Added Rubocop autocorrect functionality (`Linter Rubocop: Fix File`)

    Demo:
    https://gfycat.com/GrouchyCloudyAlleycat
###### Breaking changes:
* Does not support old Linter Rubocop configs `executablePath` and `additionalArguments`
* Minimum Atom engine of `1.4.0`

## [v0.5.3](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.2...v0.5.3)

*   Fixed activation on Chef code

## [v0.5.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.1...v0.5.2)

*   Add Ruby-on-Rails and Chef to the activation grammar list

## [v0.5.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.0...v0.5.1)

*   Only load the package when a Ruby file is opened

## [0.5.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.7...v0.5.0)

*   Note the minimum `rubocop` version of v0.37.0
*   Add specs and enable CI builds
*   Add links in messages to the rule documentation

## [0.4.7](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.6...v0.4.7)

### Maintenance

*   Upgrade to `atom-linter@4.3.0`.

## [0.4.6](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.5...v0.4.6)

### Maintenance

*   Upgrade to `atom-linter@4.2.0` which adds $PATH support.

## [0.4.5](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.4...v0.4.5)

### Maintenance

*   Upgrade to `atom-linter@4`.

## [0.4.4](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.3...v0.4.4)

### Bug Fixes

*   Fix `undefined` showing up in `command` option.

## [0.4.3](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.2...v0.4.3)

### Changes

*   Improve command description.

## [0.4.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.1...v0.4.2)

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

## [0.4.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.0...v0.4.1)

### Bug Fixes

*   The linter will now ignore `stderr` output from `rubocop` if it is still able to
    parse `stdout`.

## [0.4.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.2...v0.4.0)

### New Features

*   Use STDIN for linting
    [#72](https://github.com/AtomLinter/linter-rubocop/pull/72/files). This
    version requires `rubocop >= 0.34.0`.

## [0.2.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.1...v0.2.2)

### Bugs fixed

*   Expose `rubocopExecutablePath` in settings-view [#23](https://github.com/AtomLinter/linter-rubocop/issues/23)

## [0.2.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.0...v0.2.1)

### New Features

*   Support `rspec` syntax [#12](https://github.com/AtomLinter/linter-rubocop/pull/12)

## [0.2.0](https://github.com/AtomLinter/linter-rubocop/compare/c0e9273533150513f828959cbcd70062e3bf555f...v0.2.1)

### New Features

*   Run linter under `source.ruby.rails`, with `-R` flag [#5](https://github.com/AtomLinter/linter-rubocop/issues/5)
