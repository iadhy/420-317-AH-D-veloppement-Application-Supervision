const measures = []


export function add(measure) {
    measures.push(measure);
    return measure;
}

export function list(){
    return measures;
}

export function getLatest() {
    return measures.at(-1) ?? null;
}