import { PublicationData } from '../types';
import { getSchemaDataMap } from './dataSchemaHelpers';

const publicationInfoById: any = require('../pages/publication/hta9_info.json');
const biospecimensById: any = require('../pages/publication/hta9_samples.json');
const casesById: any = require('../pages/publication/hta9_cases.json');
const iamgesById: any = require('../pages/publication/hta9_images.json');
const sequencesById: any = require('../pages/publication/hta9_sequences.json');

export async function getAllPublicationIds() {
    // TODO: we need to read this from service
    const ids = ['brca_hta9_htan_2022', 'hta8'];

    // Returns an array that looks like this:
    // [
    //   {
    //     params: {
    //       id: 'brca_hta9_htan_2022'
    //     }
    //   },
    //   {
    //     params: {
    //       id: 'other_publication'
    //     }
    //   }
    // ]

    return ids.map((id) => {
        return {
            params: {
                id,
            },
        };
    });
}

export async function getPublicationData(id: string) {
    // TODO: fetch publication data
    // read data from a key-value pair map
    const info = publicationInfoById[id];
    const biospecimens = biospecimensById[id];
    const cases = casesById[id];
    const iamges = iamgesById[id];
    const sequences = sequencesById[id];
    // Prepare extra info
    const title = info.WPAtlas.title.rendered;
    const leadInstitute = {
        name: info.WPAtlas.lead_institutions,
    };
    const abstract = info.WPAtlas.abstract;
    const schemaDataById = await getSchemaDataMap();
    const publicationData: PublicationData = {
        title,
        leadInstitute,
        abstract,
        synapseAtlas: info,
        biospecimens,
        cases,
        iamges,
        sequences,
        schemaDataById,
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
