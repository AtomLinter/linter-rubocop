'use babel'

const parseFromStd = (stdout, stderr) => {
  if (stderr) throw new Error(stderr)
  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    throw new Error(stdout)
  }
  return parsed
}

export default parseFromStd
