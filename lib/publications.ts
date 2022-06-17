import _ from 'lodash';
import { Author, PublicationData, PublicationInfo } from '../types';
import { getSchemaDataMap } from './dataSchemaHelpers';
import { ExploreSelectedFilter } from './types';

export const sequencingAssayName = ['Bulk DNA', 'Bulk RNA-seq', 'scRNA-seq'];
export const imagingAssayName = ['CyCIF', 'mIHC', 't-CyCIF', 'MIBI'];

const publications: any = {
    hta8: {
        title:
            'Signatures of plasticity, metastasis, and immunosuppression in an atlas of human small cell lung cancer',
        htan_id: 'HTA8',
        htan_name: 'HTAN MSK',
        abstract:
            'Small cell lung cancer (SCLC) is an aggressive malignancy that includes subtypes defined by differential expression of ASCL1, NEUROD1, and POU2F3 (SCLC-A, -N, and -P, respectively). To define the heterogeneity of tumors and their associated microenvironments across subtypes, we sequenced 155,098 transcriptomes from 21 human biospecimens, including 54,523 SCLC transcriptomes. We observe greater tumor diversity in SCLC than lung adenocarcinoma, driven by canonical, intermediate, and admixed subtypes. We discover a PLCG2-high SCLC phenotype with stem-like, pro-metastatic features that recurs across subtypes and predicts worse overall survival. SCLC exhibits greater immune sequestration and less immune infiltration than lung adenocarcinoma, and SCLC-N shows less immune infiltrate and greater T cell dysfunction than SCLC-A. We identify a profibrotic, immunosuppressive monocyte/macrophage population in SCLC tumors that is particularly associated with the recurrent, PLCG2-high subpopulation.',
    },
    brca_hta9_htan_2022: {
        title:
            'An omic and multidimensional spatial atlas from serial biopsies of an evolving metastatic breast cancer',
        htan_id: 'HTA9',
        htan_name: 'HTAN OHSU',
        abstract:
            'Mechanisms of therapeutic resistance and vulnerability evolve in metastatic cancers as tumor cells and extrinsic microenvironmental influences change during treatment. To support the development of methods for identifying these mechanisms in individual people, here we present an omic and multidimensional spatial (OMS) atlas generated from four serial biopsies of an individual with metastatic breast cancer during 3.5 years of therapy. This resource links detailed, longitudinal clinical metadata that includes treatment times and doses, anatomic imaging, and blood-based response measurements to clinical and exploratory analyses, which includes comprehensive DNA, RNA, and protein profiles; images of multiplexed immunostaining; and 2- and 3-dimensional scanning electron micrographs. These data report aspects of heterogeneity and evolution of the cancer genome, signaling pathways, immune microenvironment, cellular composition and organization, and ultrastructure. We present illustrative examples of how integrative analyses of these data reveal potential mechanisms of response and resistance and suggest novel therapeutic vulnerabilities.',
    },
};

const authorsById: { [id: string]: string[] } = {
    hta8: ['Chan JM', 'Quintanal-Villalonga Á', 'Gao VR'],
    brca_hta9_htan_2022: ['Johnson BE', 'Creason AL', 'Stommel JM'],
};

const correspondingAuthorById: { [id: string]: Author } = {
    hta8: {
        name: '',
        email: '',
    },
    brca_hta9_htan_2022: {
        name: 'Joe W. Gray',
        email: 'ude.usho@ojyarg',
    },
};

const publicationInfoById: { [id: string]: PublicationInfo } = {
    hta8: {
        journal: {
            name: 'Cancer Cell',
            link:
                'https://www.cell.com/cancer-cell/fulltext/S1535-6108(21)00497-9',
        },
        pubmed: {
            name: '34653364',
            link: 'https://pubmed.ncbi.nlm.nih.gov/34653364/',
        },
        DOI: {
            name: '10.1016/j.ccell.2021.09.008',
            link: 'https://doi.org/10.1016/j.ccell.2021.09.008',
        },
        atlas: {
            name: 'Memorial Sloan Kettering Cancer Center',
            link: 'https://data.humantumoratlas.org/hta8',
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
        atlas: {
            name: 'Oregon Health & Science University (OHSU)',
            link: 'https://data.humantumoratlas.org/hta9',
        },
    },
};

const filtersById: { [id: string]: ExploreSelectedFilter[] } = {
    hta8: [{ group: 'AtlasName', value: 'HTAN MSK' }],
    brca_hta9_htan_2022: [{ group: 'AtlasName', value: 'HTAN OHSU' }],
};

export async function getAllPublicationIds() {
    const ids = ['brca_hta9_htan_2022', 'hta8'];
    return ids.map((id) => {
        return {
            params: {
                id,
            },
        };
    });
}

export async function getPublicationData(id: string) {
    const info = publications[id];
    const title = info.title;
    const abstract = info.abstract;
    const schemaDataById = await getSchemaDataMap();
    const authors = authorsById[id];
    const publicationInfo = publicationInfoById[id];
    const filters = filtersById[id];
    const correspondingAuthor = correspondingAuthorById[id];
    const publicationData: PublicationData = {
        title,
        abstract,
        synapseAtlas: info,
        schemaDataById,
        authors,
        correspondingAuthor,
        publicationInfo,
        filters,
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
