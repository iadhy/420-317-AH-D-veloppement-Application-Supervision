import { computeStats } from "../stats.js";

const measures = [];

export function add(measure){
    measures.push(measure);
    return measure;
}

export function list(){
    return measures;
}

export function getLatest(){
    return measures.at(-1) ?? null;
}

export function getById(id){
    return measures.find((measure) => measure.id === id) ?? null;
}

export function getStats(){
    return computeStats(measures);
}