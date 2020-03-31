import data from "../data/data.json";

export default function getData(){

    (data as any).centerB = data.centerA;
    (data as any).centerC = data.centerA;

    return data;

}
