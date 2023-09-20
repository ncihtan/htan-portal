export function getDelimitedValues(text: string, separator: string = ',') {
    return text.split(separator).map((v) => v.trim());
}
