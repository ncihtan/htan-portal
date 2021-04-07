export default function interleave(array: any[], delimiter: any) {
    const ret = [];
    for (const obj of array) {
        ret.push(obj);
        ret.push(delimiter);
    }
    ret.pop();
    return ret;
}
