import { PublicationData } from '../types';
import { getSchemaDataMap } from './dataSchemaHelpers';

const publicationInfo: any = require('../pages/publication/hta9_info.json');
const bopspeciments: any = require('../pages/publication/hta9_samples.json');

export async function getAllPublicationIds() {
    // TODO: we need to read this from service
    const ids = ['brca_hta9_htan_2022'];

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
    // TODO: read data from a key-value pair map
    const title = publicationInfo[0].WPAtlas.title.rendered;
    const leadInstitute = {
        name: publicationInfo[0].WPAtlas.lead_institutions,
    };

    const abstract = publicationInfo[0].WPAtlas.abstract;
    const schemaDataById = await getSchemaDataMap();
    const publicationData: PublicationData = {
        title,
        leadInstitute,
        abstract,
        synapseAtlas: publicationInfo[0],
        bopspeciments,
        schemaDataById,
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
