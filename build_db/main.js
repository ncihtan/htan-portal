import _ from 'lodash';
import fs from 'fs';
import axios from 'axios';
import {createTable} from "./client.js";
//import json from './processed_syn_data_20250122_1537.json' with { type: 'json' };
import organMappings from './organMappings.json' with { type: 'json' };

const fileFields = [
    "synapseId",
    "atlasid",
    "atlas_name",
    "level",
    "assayName",
    "Filename",
    "FileFormat",
    "Component",
    "DataFileID",
    "biospecimenIds",
    "demographicsIds.Gender",
    "demographicsIds.Ethnicity",
    "demographicsIds.Race",
    "demographicsIds.VitalStatus",
    "therapyIds.TreatmentType",
    "diagnosisIds.PrimaryDiagnosis",
    "diagnosisIds.TissueorOrganofOrigin",
    "ScRNAseqWorkflowType",
    "ScRNAseqWorkflowParametersDescription",
    "WorkflowVersion",
    "WorkflowLink",
    "AtlasMeta",
    "publicationIds",
    "diagnosisIds",
    "demographicsIds",
    "therapyIds",
    "viewers",
    "isRawSequencing",
    "downloadSource",
    "releaseVersion",
    "organType"
];


const caseFields = [  'Component',
    'HTANParticipantID',
    'Ethnicity',
    'Gender',
    'Race',
    'VitalStatus',
    'DaystoBirth',
    'CountryofResidence',
    'AgeIsObfuscated',
    'YearOfBirth',
    'OccupationDurationYears',
    'PrematureAtBirth',
    'WeeksGestationatBirth',
    'synapseId',
    'CauseofDeath',
    'CauseofDeathSource',
    'DaystoDeath',
    'YearofDeath',
    'atlasid',
    'atlas_name',
    'level',
    'assayName',
    'AtlasMeta',
    'ParticipantID',
    'publicationIds',
    // 'diagnosisIds.PrimaryDiagnosis',
    // "diagnosisIds.TissueorOrganofOrigin",
    // "diagnosisIds.SiteofResectionorBiopsy",
    // "diagnosisIds.ProgressionorRecurrenceType",
    // "diagnosisIds.Morphology"
];

const diagnosisFields = [
    'Component',
    'HTANParticipantID',
    'AgeatDiagnosis',
    'YearofDiagnosis',
    'PrimaryDiagnosis',
    'PrecancerousConditionType',
    'SiteofResectionorBiopsy',
    'TissueorOrganofOrigin',
    'Morphology',
    'TumorGrade',
    'ProgressionorRecurrence',
    'LastKnownDiseaseStatus',
    'DaystoLastFollowup',
    'DaystoLastKnownDiseaseStatus',
    'MethodofDiagnosis',
    'PriorMalignancy',
    'PriorTreatment',
    'MetastasisatDiagnosis',
    'MetastasisatDiagnosisSite',
    'FirstSymptomPriortoDiagnosis',
    'DaystoDiagnosis',
    'PercentTumorInvasion',
    'ResidualDisease',
    'SynchronousMalignancy',
    'TumorConfinedtoOrganofOrigin',
    'TumorFocality',
    'TumorLargestDimensionDiameter',
    'BreslowThickness',
    'VascularInvasionPresent',
    'VascularInvasionType',
    'AnaplasiaPresent',
    'AnaplasiaPresentType',
    'Laterality',
    'PerineuralInvasionPresent',
    'LymphaticInvasionPresent',
    'LymphNodesPositive',
    'LymphNodesTested',
    'PeritonealFluidCytologicalStatus',
    'ClassificationofTumor',
    'BestOverallResponse',
    'MitoticCount',
    'AJCCClinicalM',
    'AJCCClinicalN',
    'AJCCClinicalStage',
    'AJCCClinicalT',
    'AJCCPathologicM',
    'AJCCPathologicN',
    'AJCCPathologicStage',
    'AJCCPathologicT',
    'AJCCStagingSystemEdition',
    'CogNeuroblastomaRiskGroup',
    'CogRhabdomyosarcomaRiskGroup',
    'GreatestTumorDimension',
    'IGCCCGStage',
    'INPCGrade',
    'INPCHistologicGroup',
    'INRGStage',
    'INSSStage',
    'IRSGroup',
    'IRSStage',
    'ISSStage',
    'LymphNodeInvolvedSite',
    'MarginDistance',
    'MicropapillaryFeatures',
    'PregnantatDiagnosis',
    'SupratentorialLocalization',
    'TumorDepth',
    'WHOCNSGrade',
    'synapseId',
    'DaystoProgression',
    'DaystoProgressionFree',
    'ProgressionorRecurrenceType',
    'atlasid',
    'atlas_name',
    'level',
    'assayName',
    'AtlasMeta',
    'ParticipantID',
    'publicationIds'
];


function debug(file){
    //console.log(file);
}

function formatRow(file, data, fields, postProcess){

    //console.log(fields);

    //console.log(file.demographicsIds.map(id=>demographicsById[id]))

    const obj = {}
    fields.slice(0).forEach((k,v)=>{

        if (k.includes(".")) {
            const [root, prop] = k.split(".");
            switch (root) {
                case "demographicsIds":
                    obj[prop] = file[root].map(id=>data["demographicsByParticipantID"][id][prop]);
                    break;
                case "therapyIds":
                    obj[prop] = file[root].map(id=>{
                        const ret = data["therapyByParticipantID"][id][prop];
                        return ret;
                    });
                    break;
                case "diagnosisIds":
                    obj[prop] = file[root].map(id=>data["diagnosisByParticipantID"][id][prop]);
                    break;
                case "biospecimenIds":
                    obj[prop] = file[root].map(id=>data["biospecimenByBiospecimenID"][id][prop]);
                    break;

            }

            //obj[prop] = file[root].map(id=>demographicsById[id][prop]);
        } else {
            obj[k] = file[k];
        }
    })

    if (postProcess) {
        postProcess(obj);
    }

    return obj;
}

function findFields(data){

    //const fields = Object.keys(data[0]);
    const fields = _(Object.values(data))
        .flatMap((o)=>Object.keys(o))
        .filter(t=>/[a-z]/.test(t))
        .uniq()
        .value();


    const fieldsWithSomedata =_(fields).filter(field=>{
        const rowsWithData = _.filter(data,(row=>{
            return row[field]
        }));

        return _(rowsWithData).map("atlasid").uniq().value().length > 0

    }).value()


    return fieldsWithSomedata;


}

function postProcessFiles(file){
    _.forEach(organMappings,(val, key)=>{

        const target = _.isArray(file.TissueorOrganofOrigin) ? file.TissueorOrganofOrigin : [file.TissueorOrganofOrigin];
        if (_.intersection(val.byTissueOrOrganOfOrigin, target).length > 0) {
            file.organType = file.organType || [];
            file.organType.push(key);
        }
    });
    return file;
}

const JSONPATH = "http://localhost:3000/processed_syn_data.json"; //https://d13ch66cwesneh.cloudfront.net/processed_syn_data_20250122_1537.json

function main(){
    axios.get(JSONPATH).then(d=>{

        console.log("keys", Object.keys(d.data));

        //console.log(d.data.files.slice(0,10));


        //let fields = findFields(Object.values(d.data.publicationSummaryByPubMedID));

        function findCase(subject, caseMap, sampleMap){
            if (subject.ParentID in caseMap) {
                return subject.ParentID;
            } else if (subject.ParentID in sampleMap && subject.ParentID !== subject.BiospecimenID) {
                return findCase(sampleMap[subject.ParentID], caseMap, sampleMap);
            } else {
                console.log("not found", subject.ParentID);
                return undefined;
            }
        }

        //console.log(Object.values(d.data.publicationManifestByUid));

        const samples = Object.values(d.data.biospecimenByBiospecimenID);
        const caseMap = d.data.demographicsByParticipantID;
        const sampleMap = d.data.biospecimenByBiospecimenID;


        //console.log("top level", samples.filter(s=>s.ParentID in caseMap).length);

        console.log("total", Object.values(d.data.biospecimenByBiospecimenID).length);

        const specimenWithParticipantId = samples.reduce((agg, s)=>{
            const caseId = findCase(s, caseMap, sampleMap);
            if (caseId) {
                s.ParticipantID = caseId;
                agg.push(s);
            }
            return agg;
        },[]);

        console.log("hasCase", specimenWithParticipantId.length);


        //console.log(fields);

        const publicationManifestConfig = {
            fields: findFields(Object.values(d.data.publicationManifestByUid)),
            data:Object.values(d.data.publicationManifestByUid),
            tableName:"publication_manifest",
            derivedColumns:[
                "associatedFiles Array(TEXT) MATERIALIZED splitByChar(',',PublicationAssociatedParentDataFileID)",
                // "uid TEXT MATERIALIZED arrayElement(splitByChar('\/', PMID),4)"
            ]
        };

        const atlasConfig = {
            fields: findFields(d.data.atlases),
            data:d.data.atlases,
            tableName:"atlases",
            derivedColumns:[
            ]
        };

        const casesConfig = {
            fields: findFields(Object.values(d.data.demographicsByParticipantID)),
            data:Object.values(d.data.demographicsByParticipantID),
            tableName:"cases",
            derivedColumns:[
            ]
        };

        const diagnosisConfig = {
            fields: [...findFields(Object.values(d.data.diagnosisByParticipantID)),"organType"],
            data:Object.values(d.data.diagnosisByParticipantID),
            tableName:"diagnosis2",
            postProcess:postProcessFiles,
            derivedColumns:[
            ]
        };

        const fileConfig = {
            fields: fileFields,
            data:d.data.files,
            tableName:"files",
            postProcess:postProcessFiles,
            derivedColumns:[
                "viewersArr Array(TEXT) MATERIALIZED JSONExtractKeys(viewers)",
            ]
        };

        const specimenConfig = {
            fields: findFields(specimenWithParticipantId),
            data:specimenWithParticipantId,
            tableName:"specimen",
            derivedColumns:[
            ]
        };

        // const publicationConfig= {
        //     fields:findFields(Object.values(d.data.publicationSummaryByPubMedID)),
        //     data:Object.values(d.data.publicationSummaryByPubMedID),
        //     tableName:"publications",
        //     //derivedColumns:["pubmedid TEXT MATERIALIZED ifNull(simpleJSONExtractString(arrayElementOrNull(articleids,1),'value'),'')"]
        // };

        const config = diagnosisConfig; // publicationManifestConfig; //publicationManifestConfig;


        const preprocess = config.preprocess ? config.preprocess : (f)=>f;
        const rows = config.data.slice(0)
            .map(preprocess)
            .map(f=>formatRow(f, d.data, config.fields, config.postProcess));


        createTable(config.tableName, rows, config.fields, config.derivedColumns);

        // const out = rows.map(r=>JSON.stringify(r)).join("\n");
        //
        // //console.log(out);
        //
        // try {
        //     fs.writeFileSync("out.jsonl", out);
        //     console.log(`File has been written successfully. (${rows.length} rows)`);
        // } catch (err) {
        //     console.error('An error occurred:', err);
        // }

    })
}

main();