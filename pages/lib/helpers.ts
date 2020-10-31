import _ from "lodash";
import fetch from "node-fetch";

function getRecords(obj:any) : any {
    if (_.isObject(obj) || _.isArray(obj)) {
        return _.map(obj, (n:any) => {
            if (n.record_list) {
                return n.record_list;
            } else {
                return getRecords(n);
            }
        });
    } else {
        return undefined;
    }
}

export function getData(data:any) : entity[] {

    _.forEach(data.atlases,(atlas)=>{
        _.forEach(atlas,(t)=>{
            const schemaName = t.data_schema;
            if (schemaName) {
                const schema = data.schemas.find((s:any)=>s.data_schema === schemaName.split(":")[1]);
                //console.log("here", schema.attributes);
                t.fields = schema.attributes;

                //console.log(t.fields);

                t.record_list = t.record_list.map((record:any)=>{
                    const obj: any = {};

                    t.fields.forEach((f:any,i:number)=>{
                        obj[f.id.replace(/^bts:/,"")] = record[i];
                    });


                    obj["atlasid"] = atlas.htan_id;

                    return obj;
                });

            }
        });
    });

    const objs = _.chain(getRecords(data))
        .flatMapDeep()
        .filter((n)=>!!n)
        .value();

    return objs;

}


export interface entity {
    "atlasid": string;
    "AssayType":  string
    "Component" :string
    "HTANDataFileID" : string
    "HTANParentBiospecimenID":string
    "fileFormat" : string
    "filename": string;
    "HTANParentID": string;

    "biospecimen" : entity | undefined;
    "diagnosis" : entity | undefined;
}

export async function doIt() {

    const data = await fetch("/sim.json").then((r)=>r.json());

    console.log(data);

    const flatData : entity[] = getData(data);

    //console.log(flatData);

    const files = flatData.filter((obj)=>{
        return !!obj.filename
    });

    const biospecimen = flatData.filter((obj)=>{
        return obj.Component === "bts:Biospecimen"
    });

    const diagnoses = flatData.filter((obj)=>{
        return obj.Component === "bts:Diagnosis"
    });

    //console.log(diagnoses);

    _.forEach(files,(file)=>{
        const specimen = _.find(biospecimen,{ "HTANBiospecimenID":file.HTANParentBiospecimenID }) as (entity | undefined);

        if (specimen) {
            //console.log(specimen);

            const diagnosis =  _.find(diagnoses,{ "HTANParticipantID":specimen.HTANParentID }) as (entity | undefined);
            file.diagnosis = diagnosis;
        }

        file.biospecimen = specimen;
        //file.participant =
    });

    // console.log("diags",diagnosis);

    // const files = _.map(data.atlases,(atlas)=>{
    //     return _.reduce(atlas,(agg, el, key)=>{
    //        if (/Bulk/.test(key)) {
    //            agg.push(el.record_list);
    //        }
    //        return agg;
    //     },[]).flat();
    // });

    //console.log(files.flat());
    return files;

}
