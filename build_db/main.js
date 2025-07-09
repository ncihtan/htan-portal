import _ from 'lodash';
import { createTable } from "./client.js";
import {
    normalizeTissueOrOrganOrSite,
    normalizeTreatment
} from "@htan/data-portal-commons";

// prettier-ignore
import processedSynJson from '../public/processed_syn_data.json' with { type: 'json' };
// prettier-ignore
import organMappings from '../packages/data-portal-commons/src/assets/human-organ-mappings.json' with { type: 'json' };

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

function formatRow(file, data, fields, postProcess) {
    let obj = {}

    fields.slice(0).forEach((k, v) => {
        if (k.includes(".")) {
            const [root, prop] = k.split(".");
            switch (root) {
                case "demographicsIds":
                    obj[prop] = file[root].map(id => data["demographicsByParticipantID"][id][prop]);
                    break;
                case "therapyIds":
                    obj[prop] = file[root].map(id => data["therapyByParticipantID"][id][prop]);
                    break;
                case "diagnosisIds":
                    obj[prop] = file[root].map(id => data["diagnosisByParticipantID"][id][prop]);
                    break;
                case "biospecimenIds":
                    obj[prop] = file[root].map(id => data["biospecimenByBiospecimenID"][id][prop]);
                    break;
            }
        } else {
            obj[k] = file[k];
        }
    })

    if (postProcess) {
        obj = postProcess(obj);
    }

    return obj;
}

function generateCaseData(
    demographicsByParticipantID,
    diagnosisByParticipantID
) {
    const cases = _.map(demographicsByParticipantID, (demo) => {
        const dia = diagnosisByParticipantID[demo.ParticipantID];
        if (dia) {
            return {
                ...dia,
                ...demo
            };
        }
        else {
            return demo;
        }
    });

    const participantsWithoutDemographics = _.difference(_.keys(diagnosisByParticipantID), _.keys(demographicsByParticipantID));

    return cases.concat(participantsWithoutDemographics.map((participantID) => diagnosisByParticipantID[participantID]));
}

function findFields(data) {
    //const fields = Object.keys(data[0]);
    const fields = _(Object.values(data))
        .flatMap((o)=>Object.keys(o))
        .filter(t=>/[a-z]/.test(t))
        .uniq()
        .value();

    // filter out fields with no data
    return _(fields).filter(field => {
        const rowsWithData = _.filter(data, (row => row[field]));
        return _(rowsWithData).map("atlasid").uniq().value().length > 0
    }).value();
}

function postProcessFiles(file) {
    // update organ type
    _.forEach(organMappings,(val, key)=>{
        const target = _.isArray(file.TissueorOrganofOrigin) ? file.TissueorOrganofOrigin : [file.TissueorOrganofOrigin];
        if (_.intersection(
                _(val.byTissueOrOrganOfOrigin).compact().map(normalizeTissueOrOrganOrSite).value(),
                _(target).compact().map(normalizeTissueOrOrganOrSite).value()
            ).length > 0
        ) {
            file.organType = file.organType || [];
            file.organType.push(key);
        }
    });

    // normalize treatment values
    const treatmentType = _.isArray(file.TreatmentType) ? file.TreatmentType: [file.TreatmentType];
    file.TreatmentType = _(treatmentType).compact().flatMap(normalizeTreatment).value();

    // remove duplicate values
    return _.mapValues(file, (value) => _.isArray(value) ? _(value).uniq().compact().value(): value);
}

function findCase(subject, caseMap, sampleMap){
    if (subject.ParentID in caseMap) {
        return subject.ParentID;
    } else if (subject.ParentID in sampleMap && subject.ParentID !== subject.BiospecimenID) {
        return findCase(sampleMap[subject.ParentID], caseMap, sampleMap);
    } else {
        console.log("[Not Found]", subject.ParentID);
        return undefined;
    }
}

async function main(){
    // console.log(Object.keys(processedSynJson));
    const d = {
        data: processedSynJson
    };
    // console.log("keys", Object.keys(d.data));

    const samples = Object.values(d.data.biospecimenByBiospecimenID);
    const caseMap = d.data.demographicsByParticipantID;
    const sampleMap = d.data.biospecimenByBiospecimenID;

    // console.log("total", Object.values(d.data.biospecimenByBiospecimenID).length);

    const specimenWithParticipantId = samples.reduce((agg, s) => {
        const caseId = findCase(s, caseMap, sampleMap);
        if (caseId) {
            s.ParticipantID = caseId;
            agg.push(s);
        }
        return agg;
    }, []);

    // console.log("hasCase", specimenWithParticipantId.length);

    let configs = {
        publicationManifestConfig : {
            fields: [
                'Authors',
                'CitedInNumber',
                'Component',
                'CorrespondingAuthor',
                'CorrespondingAuthorORCID',
                'DataType',
                'EutilsAuthors',
                'EutilsDOI',
                'EutilsDate',
                'EutilsJournal',
                'EutilsSortDate',
                'EutilsTitle',
                'HTANCenterID',
                'HTANGrantID',
                'License',
                'LocationofPublication',
                'PublicationAbstract',
                'PublicationContentType',
                'PublicationcontainsHTANID',
                'Publication-associatedHTANParentDataFileID',
                'SupportingLink',
                'SupportingLinkDescription',
                'Title',
                'Tool',
                'YearofPublication',
                'atlasid',
                'atlas_name',
                'level',
                'assayName',
                'AtlasMeta',
                'PublicationAssociatedParentDataFileID',
                'GrantID',
                'CenterID',
                'PublicationContainsID',
                'publicationId',
                'PMID'
            ]
            ,
            data: Object.values(d.data.publicationManifestByUid),
            tableName: "publication_manifest",
            derivedColumns: [
                "associatedFiles Array(TEXT) MATERIALIZED splitByChar(',',PublicationAssociatedParentDataFileID)",
                // "uid TEXT MATERIALIZED arrayElement(splitByChar('\/', PMID),4)"
            ]
        },
        atlasConfig : {
            fields: findFields(d.data.atlases),
            data: d.data.atlases,
            tableName: "atlases",
            derivedColumns: []
        },
        demographicsConfig : {
            fields: findFields(Object.values(d.data.demographicsByParticipantID)),
            data: Object.values(d.data.demographicsByParticipantID),
            tableName: "demographics",
            derivedColumns: []
        },
        diagnosisConfig : {
            fields: [...findFields(Object.values(d.data.diagnosisByParticipantID)),"organType"],
            data: Object.values(d.data.diagnosisByParticipantID),
            tableName: "diagnosis",
            postProcess: postProcessFiles,
            derivedColumns: []
        },
        casesConfig: {
            fields: _.uniq([
                ...findFields(Object.values(d.data.demographicsByParticipantID)),
                ...findFields(Object.values(d.data.diagnosisByParticipantID))
            ]),
            data: generateCaseData(d.data.demographicsByParticipantID, d.data.diagnosisByParticipantID),
            tableName: "cases",
            postProcess: postProcessFiles,
            derivedColumns: []
        },
        fileConfig : {
            fields: fileFields,
            data: d.data.files,
            tableName: "files",
            postProcess: postProcessFiles,
            derivedColumns: [
                "viewersArr Array(TEXT) MATERIALIZED JSONExtractKeys(viewers)",
            ]
        },
        specimenConfig : {
            fields: findFields(specimenWithParticipantId),
            data: specimenWithParticipantId,
            tableName: "specimen",
            derivedColumns: []
        }
    };

    function doCreate(config) {
        const preprocess = config.preprocess ? config.preprocess : (f) => f;
        const rows = config.data
            .map(preprocess)
            .map(f => formatRow(f, d.data, config.fields, config.postProcess));

        return createTable(config.tableName, rows, config.fields, config.derivedColumns);
    }

    // enable this if you only want to import new publication data
    // configs = { publicationManifestConfig:configs.publicationManifestConfig };

    for (const config in configs) {
        console.log(`creating table ${configs[config].tableName}`);
        await doCreate(configs[config])
        console.log(`table created ${configs[config].tableName}`);
    }
}

main();