import _ from 'lodash';
import {
    Author,
    PublicationData,
    PublicationInfo,
    ToolsExample,
} from '../types';
import { getSchemaDataMap } from './dataSchemaHelpers';
import { filterFiles, groupFilesByAttrNameAndValue } from './filterHelpers';
import { fillInEntities, LoadDataResult } from './helpers';
import { ExploreSelectedFilter } from './types';

// const publicationInfoById: any = require('../pages/publication/hta9_info.json');
const biospecimensById: any = require('../pages/publication/hta9_samples.json');
const casesById: any = require('../pages/publication/hta9_cases.json');
const imagesById: any = require('../pages/publication/hta9_images.json');
const sequencesById: any = require('../pages/publication/hta9_sequences.json');
const publications: any = {
    hta8: {
        title:
            'Transition to Metastatic State: Lung Cancer, Pancreatic Cancer and Brain Metastasis',
        htan_id: 'HTA8',
        htan_name: 'HTAN HTAPP',
        atlas: 'Memorial Sloan Kettering Cancer Center',
        abstract:
            'Metastasis embodies the whole-organism pathophysiology of cancer. The spread of cancer cells beyond the primary tumor site is responsible for the majority of cancer deaths and is the most overt expression of cancer’s complex evolutionary dynamics. Intimately related to the intricate processes of development and immunity, the transition from locally invasive to metastatic cancer also poses a major scientific hurdle. Recent technological and computational advancements enable dynamic, multidimensional, multiplanar analysis of multiple tissues. We are applying these advances to clinical samples with the aim of generating a high-resolution spatiotemporal tissue atlas of the most lethal cancers in the United States: lung cancer, pancreatic cancer, and metastases of the central nervous system. Our approach is to obtain high-quality human biospecimens from surgical resections, biopsy, or autopsy of primary and disseminated tumors. Samples are interrogated using single-cell and single-nucleus RNA sequencing as well as spatially informative multiplexed molecular profiling using protein and RNA in situ hybridization–based technologies. Integration, analysis, and presentation of these datasets will be undertaken with the goal of generating human tumor atlases of value to the entire cancer research community.',
        authors: [
            {
                name: "Pe'Er, Dana",
                email: '',
            },
            {
                name: 'Iacobuzio-Donahue, Christine A',
                email: '',
            },
        ],
    },
    brca_hta9_htan_2022: {
        title:
            'An omic and multidimensional spatial atlas from serial biopsies of an evolving metastatic breast cancer',
        htan_id: 'HTA9',
        htan_name: 'HTAN OHSU',
        atlas: 'Oregon Health & Science University (OHSU)',
        abstract:
            'Mechanisms of therapeutic resistance and vulnerability evolve in metastatic cancers as tumor cells and extrinsic microenvironmental influences change during treatment. To support the development of methods for identifying these mechanisms in individual people, here we present an omic and multidimensional spatial (OMS) atlas generated from four serial biopsies of an individual with metastatic breast cancer during 3.5 years of therapy. This resource links detailed, longitudinal clinical metadata that includes treatment times and doses, anatomic imaging, and blood-based response measurements to clinical and exploratory analyses, which includes comprehensive DNA, RNA, and protein profiles; images of multiplexed immunostaining; and 2- and 3-dimensional scanning electron micrographs. These data report aspects of heterogeneity and evolution of the cancer genome, signaling pathways, immune microenvironment, cellular composition and organization, and ultrastructure. We present illustrative examples of how integrative analyses of these data reveal potential mechanisms of response and resistance and suggest novel therapeutic vulnerabilities.',
        authors: [
            {
                name: 'Johnson BE',
                email: '',
            },
            {
                name: 'Creason AL',
                email: '',
            },
            {
                name: 'Stommel JM',
                email: '',
            },
        ],
    },
};

const toolsExampleById: { [id: string]: ToolsExample } = {
    hta8: {
        exampleCaseName: '',
        exampleCaseCbioportalLink: '',
        exampleCaselMinervaLink: '',
    },
    brca_hta9_htan_2022: {
        exampleCaseName: 'HTA9_1',
        exampleCaseCbioportalLink:
            'https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1',
        exampleCaselMinervaLink:
            'https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1',
    },
};

const authorsById: { [id: string]: Author[] } = {
    hta8: [
        {
            name: "Pe'Er, Dana",
            email: '',
        },
        {
            name: 'Iacobuzio-Donahue, Christine A',
            email: '',
        },
    ],
    brca_hta9_htan_2022: [
        {
            name: 'Johnson BE',
            email: '',
        },
        {
            name: 'Creason AL',
            email: '',
        },
        {
            name: 'Stommel JM',
            email: '',
        },
    ],
};

const publicationInfoById: { [id: string]: PublicationInfo } = {
    hta8: {
        journal: {
            name: '',
            link: '',
        },
        pubmed: {
            name: '',
            link: '',
        },
        DOI: {
            name: '',
            link: '',
        },
    },
    brca_hta9_htan_2022: {
        journal: {
            name: 'Cell Rep Med.',
            link:
                'https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(22)00025-8',
        },
        pubmed: {
            name: '35243422',
            link: 'https://pubmed.ncbi.nlm.nih.gov/35243422/',
        },
        DOI: {
            name: '10.1016/j.xcrm.2022.100525',
            link: 'https://doi.org/10.1016/j.xcrm.2022.100525',
        },
    },
};

const filtersById: { [id: string]: ExploreSelectedFilter[] } = {
    hta8: [{ group: 'AtlasName', value: 'HTAN MSK' }],
    brca_hta9_htan_2022: [{ group: 'AtlasName', value: 'HTAN OHSU' }],
};

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
    const info = publications[id];
    const biospecimens = biospecimensById[id];
    const cases = casesById[id];
    const images = imagesById[id];
    const sequences = sequencesById[id];
    // Prepare extra info
    const title = info.title;
    const leadInstitute = {
        name: info.atlas,
    };
    const abstract = info.abstract;
    const schemaDataById = await getSchemaDataMap();
    const toolsExample = toolsExampleById[id];
    const authors = authorsById[id];
    const publicationInfo = publicationInfoById[id];
    // get extra data
    const rawData = await fetch(
        'https://htan-synapse-json.surge.sh/processed_syn_data.json'
    );
    const text = await rawData.text();
    const fetchedData: LoadDataResult = JSON.parse(text) as LoadDataResult;
    const filters = filtersById[id];

    const selectedFiltersByAttrName = _.chain(filters)
        .groupBy((item) => item.group)
        .mapValues((filters: ExploreSelectedFilter[]) => {
            return new Set(filters.map((f) => f.value));
        })
        .value();
    const filteredFiles = filterFiles(
        selectedFiltersByAttrName,
        fillInEntities(fetchedData)
    );
    const groupedFilesByAttrNameAndValue = groupFilesByAttrNameAndValue(
        filteredFiles
    );
    const levelData = groupedFilesByAttrNameAndValue['Level'];

    const publicationData: PublicationData = {
        title,
        leadInstitute,
        abstract,
        synapseAtlas: info,
        biospecimens,
        cases,
        images,
        sequences,
        schemaDataById,
        toolsExample,
        authors,
        publicationInfo,
        levelData,
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
