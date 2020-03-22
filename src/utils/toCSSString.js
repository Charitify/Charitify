export default function toCSSString(styles = {}) {
  return Object.entries(styles)
    .filter(([_propName, propValue]) => propValue !== undefined && propValue !== null)
    .reduce((styleString, [propName, propValue]) => {
      propName = propName.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
      return `${styleString}${propName}:${propValue};`
    }, '')
}