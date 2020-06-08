export default function formatTextToBullets(text) {
    // const lines = typeof text === 'string' ? text.split(/\n/gm) : []
    // const plainTextLines = lines.map(line => line.replace(/^(•\s?)/gm, ''))
    // const formattedLines = plainTextLines.map(line => `• ${line}`)
    // console.log(lines, plainTextLines, formattedLines)
    // return formattedLines.join('\n')
    return text.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+•?\s{1,}/gm, '\n• ')
}
