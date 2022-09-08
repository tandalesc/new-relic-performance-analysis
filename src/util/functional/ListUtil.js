
export function toMap(iterable, keyFn = (x => x)) {
    return iterable.reduce((acc, e) => ({ ...acc, [keyFn(e)]: e }), {});
}