export default function(formValues, newValues) {
    if (!formValues) return newValues
    if (!newValues) return formValues

    return Object.keys(newValues).reduce((acc, key) => {         
        if (newValues[key] === undefined) return acc
        acc[key] = newValues[key]
        return acc
    }, formValues)
}