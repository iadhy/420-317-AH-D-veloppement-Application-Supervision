export function buildFilter(query){
    const filter = {};

    if (query.sensor) {
        filter.sensor = query.sensor;
    }

    const min = query.min === undefined ? undefined : Number(query.min);
    const max = query.max === undefined ? undefined : Number(query.max);

    if (Number.isFinite(min) || Number.isFinite(max)) {
        filter.value = {};
        if (Number.isFinite(min)) filter.value.$gte = min;
        if (Number.isFinite(max)) filter.value.$lte = max;
    }

    const from = query.from === undefined ? undefined : new Date(query.from);
    const fromValide = from instanceof Date && !Number.isNaN(from.valueOf());

    if (fromValide) {
        filter.createdAt = {};
        filter.createdAt.$gte = from;
    }

    return filter;
}

const SORTABLE_FIELDS = ["createdAt", "value"];

export function buildSort(query) {
    const field = SORTABLE_FIELDS.includes(query.sort) ? query.sort : "createdAt";
    const direction = query.order === "asc" ? 1 : -1;

    return {[field]: direction}
}