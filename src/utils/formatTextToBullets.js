export default function formatTextToBullets(text) {
    const lines = typeof text === 'string' ? text.split(/[\n\r]/gm) : []
    const plainTextLines = lines.map(line => line.replace(/^(•\s+)/g, ''))
    const filteredLines = plainTextLines.filter(line => line !== '•')
    const formattedLines = filteredLines.map(line => `• ${line}`)
    return formattedLines.join('\n')
}
