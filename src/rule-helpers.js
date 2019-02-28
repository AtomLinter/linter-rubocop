'use babel'

const DOCUMENTATION_LIFETIME = 86400 * 1000
const docsRuleCache = new Map()

export function takeWhile(source, predicate, excludes) {
  const result = []
  const { length } = source
  let i = 0

  while (i < length && predicate(source[i], i)) {
    if (!excludes(source[i], i)) {
      result.push(source[i])
    }
    i += 1
  }

  return result
}

// Retrieves style guide documentation with cached responses
export async function getRuleMarkDown(url) {
  const rule = url.split('#')[1]
  if (docsRuleCache.has(rule)) {
    const cachedRule = docsRuleCache.get(rule)
    if (new Date().getTime() >= cachedRule.expires) {
      // If documentation is stale, clear cache
      docsRuleCache.delete(rule)
    } else {
      return cachedRule.markdown
    }
  }

  let rawRulesMarkdown
  const response = await fetch('https://raw.githubusercontent.com/bbatsov/ruby-style-guide/master/README.md')
  if (response.ok) {
    rawRulesMarkdown = await response.text()
  } else {
    return `***\nError retrieving documentation: ${response.statusText}`
  }

  const byLine = rawRulesMarkdown.split('\n')
  const ruleAnchors = byLine.reduce(
    (acc, line, idx) => (line.match(/\* <a name=/g) ? acc.concat([[idx, line]]) : acc),
    [],
  )

  ruleAnchors.forEach(([startingIndex, startingLine]) => {
    const ruleName = startingLine.split('"')[1]
    const beginSearch = byLine.slice(startingIndex + 1)

    // gobble all the documentation until you reach the next rule
    const documentationForRule = takeWhile(beginSearch, x => !x.match(/\* <a name=|##/), y => y.match(/.*<sup>.*<\/sup>/))
    const markdownOutput = '***\n'.concat(documentationForRule.join('\n'))

    docsRuleCache.set(ruleName, {
      markdown: markdownOutput,
      expires: new Date().getTime() + DOCUMENTATION_LIFETIME,
    })
  })

  return docsRuleCache.get(rule).markdown
}
