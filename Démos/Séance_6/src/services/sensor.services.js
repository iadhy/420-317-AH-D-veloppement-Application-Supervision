const sensors = [];

export function create({ id, name, unit, threshold, direction}){
    const sensor = { id, name, unit, threshold, direction, active: true};
    sensors.push(sensor);
    return sensor;
}

