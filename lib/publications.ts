import _ from 'lodash';
import { Author, PublicationData, PublicationInfo } from '../types';
import { getSchemaDataMap } from './dataSchemaHelpers';
import { ExploreSelectedFilter } from './types';

export const sequencingAssayName = ['Bulk DNA', 'Bulk RNA-seq', 'scRNA-seq'];
export const imagingAssayName = ['CyCIF', 'mIHC', 't-CyCIF', 'MIBI'];

const publications: any = {
    htapp_crc_pelka_2021: {
        title:
            'Spatially organized multicellular immune hubs in human colorectal cancer',
        htan_id: 'HTA1',
        htan_name: 'HTAN HTAPP',
        abstract:
            'Immune responses to cancer are highly variable, with mismatch repair-deficient (MMRd) tumors exhibiting more anti-tumor immunity than mismatch repair-proficient (MMRp) tumors. To understand the rules governing these varied responses, we transcriptionally profiled 371,223 cells from colorectal tumors and adjacent normal tissues of 28 MMRp and 34 MMRd individuals. Analysis of 88 cell subsets and their 204 associated gene expression programs revealed extensive transcriptional and spatial remodeling across tumors. To discover hubs of interacting malignant and immune cells, we identified expression programs in different cell types that co-varied across tumors from affected individuals and used spatial profiling to localize coordinated programs. We discovered a myeloid cell-attracting hub at the tumor-luminal interface associated with tissue damage and an MMRd-enriched immune hub within the tumor, with activated T cells together with malignant and myeloid cells expressing T cell-attracting chemokines. By identifying interacting cellular programs, we reveal the logic underlying spatially organized immune-malignant cell networks.',
    },
    duke_brca_risom_2021: {
        title:
            'Transition to invasive breast cancer is associated with progressive changes in the structure and composition of tumor stroma',
        htan_id: 'HTA6',
        htan_name: 'HTAN Duke',
        abstract:
            'Ductal carcinoma in situ (DCIS) is a pre-invasive lesion that is thought to be a precursor to invasive breast cancer (IBC). To understand the changes in the tumor microenvironment (TME) accompanying transition to IBC, we used multiplexed ion beam imaging by time of flight (MIBI-TOF) and a 37-plex antibody staining panel to interrogate 79 clinically annotated surgical resections using machine learning tools for cell segmentation, pixel-based clustering, and object morphometrics. Comparison of normal breast with patient-matched DCIS and IBC revealed coordinated transitions between four TME states that were delineated based on the location and function of myoepithelium, fibroblasts, and immune cells. Surprisingly, myoepithelial disruption was more advanced in DCIS patients that did not develop IBC, suggesting this process could be protective against recurrence. Taken together, this HTAN Breast PreCancer Atlas study offers insight into drivers of IBC relapse and emphasizes the importance of the TME in regulating these processes.',
    },
    hms_ckcm_nirmal_2022: {
        title:
            'The Spatial Landscape of Progression and Immunoediting in Primary Melanoma at Single-Cell Resolution',
        htan_id: 'HTA7',
        htan_name: 'HTAN HMS',
        abstract:
            'Cutaneous melanoma is a highly immunogenic malignancy that is surgically curable at early stages but life-threatening when metastatic. Here we integrate high-plex imaging, 3D high-resolution microscopy, and spatially resolved microregion transcriptomics to study immune evasion and immunoediting in primary melanoma. We find that recurrent cellular neighborhoods involving tumor, immune, and stromal cells change significantly along a progression axis involving precursor states, melanoma in situ, and invasive tumor. Hallmarks of immunosuppression are already detectable in precursor regions. When tumors become locally invasive, a consolidated and spatially restricted suppressive environment forms along the tumor-stromal boundary. This environment is established by cytokine gradients that promote expression of MHC-II and IDO1, and by PD1-PDL1-mediated cell contacts involving macrophages, dendritic cells, and T cells. A few millimeters away, cytotoxic T cells synapse with melanoma cells in fields of tumor regression. Thus, invasion and immunoediting can coexist within a few millimeters of each other in a single specimen.',
    },
    msk_sclc_chan_2021: {
        title:
            'Signatures of plasticity, metastasis, and immunosuppression in an atlas of human small cell lung cancer',
        htan_id: 'HTA8',
        htan_name: 'HTAN MSK',
        abstract:
            'Small cell lung cancer (SCLC) is an aggressive malignancy that includes subtypes defined by differential expression of ASCL1, NEUROD1, and POU2F3 (SCLC-A, -N, and -P, respectively). To define the heterogeneity of tumors and their associated microenvironments across subtypes, we sequenced 155,098 transcriptomes from 21 human biospecimens, including 54,523 SCLC transcriptomes. We observe greater tumor diversity in SCLC than lung adenocarcinoma, driven by canonical, intermediate, and admixed subtypes. We discover a PLCG2-high SCLC phenotype with stem-like, pro-metastatic features that recurs across subtypes and predicts worse overall survival. SCLC exhibits greater immune sequestration and less immune infiltration than lung adenocarcinoma, and SCLC-N shows less immune infiltrate and greater T cell dysfunction than SCLC-A. We identify a profibrotic, immunosuppressive monocyte/macrophage population in SCLC tumors that is particularly associated with the recurrent, PLCG2-high subpopulation.',
    },
    ohsu_brca_johnson_2022: {
        title:
            'An omic and multidimensional spatial atlas from serial biopsies of an evolving metastatic breast cancer',
        htan_id: 'HTA9',
        htan_name: 'HTAN OHSU',
        abstract:
            'Mechanisms of therapeutic resistance and vulnerability evolve in metastatic cancers as tumor cells and extrinsic microenvironmental influences change during treatment. To support the development of methods for identifying these mechanisms in individual people, here we present an omic and multidimensional spatial (OMS) atlas generated from four serial biopsies of an individual with metastatic breast cancer during 3.5 years of therapy. This resource links detailed, longitudinal clinical metadata that includes treatment times and doses, anatomic imaging, and blood-based response measurements to clinical and exploratory analyses, which includes comprehensive DNA, RNA, and protein profiles; images of multiplexed immunostaining; and 2- and 3-dimensional scanning electron micrographs. These data report aspects of heterogeneity and evolution of the cancer genome, signaling pathways, immune microenvironment, cellular composition and organization, and ultrastructure. We present illustrative examples of how integrative analyses of these data reveal potential mechanisms of response and resistance and suggest novel therapeutic vulnerabilities.',
    },
    vanderbilt_crc_chen_2021: {
        title:
            'Differential pre-malignant programs and microenvironment chart distinct paths to malignancy in human colorectal polyps',
        htan_id: 'HTA11',
        htan_name: 'HTAN Vanderbilt',
        abstract:
            'Colorectal cancers (CRCs) arise from precursor polyps whose cellular origins, molecular heterogeneity, and immunogenic potential may reveal diagnostic and therapeutic insights when analyzed at high resolution. We present a single-cell transcriptomic and imaging atlas of the two most common human colorectal polyps, conventional adenomas and serrated polyps, and their resulting CRC counterparts. Integrative analysis of 128 datasets from 62 participants reveals adenomas arise from WNT-driven expansion of stem cells, while serrated polyps derive from differentiated cells through gastric metaplasia. Metaplasia-associated damage is coupled to a cytotoxic immune microenvironment preceding hypermutation, driven partly by antigen-presentation differences associated with tumor cell-differentiation status. Microsatellite unstable CRCs contain distinct non-metaplastic regions where tumor cells acquire stem cell properties and cytotoxic immune cells are depleted. Our multi-omic atlas provides insights into malignant progression of colorectal polyps and their microenvironment, serving as a framework for precision surveillance and prevention of CRC.',
    },
};

const authorsById: { [id: string]: string[] } = {
    htapp_crc_pelka_2021: ['Pelka K', 'Hofree M', 'Chen JH'],
    duke_brca_risom_2021: ['Risom T', 'Glass DR', 'Averbukh I'],
    hms_ckcm_nirmal_2022: ['Nirmal AJ', 'Maliga Z', 'Vallius T'],
    msk_sclc_chan_2021: ['Chan JM', 'Quintanal-Villalonga Á', 'Gao VR'],
    ohsu_brca_johnson_2022: ['Johnson BE', 'Creason AL', 'Stommel JM'],
    vanderbilt_crc_chen_2021: ['Chen B', 'Scurrah CR', 'McKinley ET'],
};

const correspondingAuthorsById: { [id: string]: Author[] } = {
    htapp_crc_pelka_2021: [
        {
            name: 'Ana C. Anderson',
            email: 'acanderson@bwh.harvard.edu',
        },
        {
            name: 'Orit Rozenblatt-Rosen',
            email: 'orit@broadinstitute.org',
        },
        {
            name: 'Aviv Regev',
            email: 'aviv.regev.sc@gmail.com',
        },
        {
            name: 'Nir Hacohen',
            email: 'nhacohen@mgh.harvard.edu',
        },
    ],
    duke_brca_risom_2021: [
        {
            name: 'Robert B West',
            email: 'rbwest@stanford.edu',
        },
        {
            name: 'Michael Angelo',
            email: 'mangelo0@stanford.edu',
        },
    ],
    hms_ckcm_nirmal_2022: [
        {
            name: 'Peter K. Sorger',
            email: 'peter_sorger@hms.harvard.edu',
        },
    ],
    msk_sclc_chan_2021: [
        {
            name: "Dana Pe'er",
            email: 'peerster@gmail.com',
        },
        {
            name: 'Charles M. Rudin',
            email: 'rudinc@mskcc.org',
        },
    ],
    ohsu_brca_johnson_2022: [
        {
            name: 'Joe W. Gray',
            email: 'ude.usho@ojyarg',
        },
    ],
    vanderbilt_crc_chen_2021: [
        {
            name: 'Robert J. Coffey',
            email: 'robert.coffey@vumc.org',
        },
        {
            name: 'Martha J. Shrubsole',
            email: 'martha.shrubsole@vanderbilt.edu',
        },
        {
            name: 'Ken S. Lau',
            email: 'ken.s.lau@vanderbilt.edu',
        },
    ],
};

const publicationInfoById: { [id: string]: PublicationInfo } = {
    htapp_crc_pelka_2021: {
        journal: {
            name: 'Cell',
            link:
                'https://www.cell.com/cell/fulltext/S0092-8674(21)00945-4?_returnURL=https%3A%2F%2Flinkinghub.elsevier.com%2Fretrieve%2Fpii%2FS0092867421009454%3Fshowall%3Dtrue#%20',
        },
        pubmed: {
            name: '34450029',
            link: 'https://pubmed.ncbi.nlm.nih.gov/34450029/',
        },
        DOI: {
            name: '10.1016/j.cell.2021.08.003',
            link: 'https://doi.org/10.1016/j.cell.2021.08.003',
        },
        atlas: {
            name: '"Human Tumor Atlas Pilot Project (HTAPP)"',
            link: 'https://data.humantumoratlas.org/hta1',
        },
    },
    duke_brca_risom_2021: {
        journal: {
            name: 'Cell',
            link: 'https://pubmed.ncbi.nlm.nih.gov/35063072/',
        },
        pubmed: {
            name: '35063072',
            link: 'https://pubmed.ncbi.nlm.nih.gov/35063072/',
        },
        DOI: {
            name: '10.1016/j.cell.2021.12.023',
            link: 'https://doi.org/10.1016/j.cell.2021.12.023',
        },
        atlas: {
            name: 'Duke University',
            link: 'https://data.humantumoratlas.org/hta6',
        },
    },
    hms_ckcm_nirmal_2022: {
        journal: {
            name: 'Cancer Discov',
            link:
                'https://aacrjournals.org/cancerdiscovery/article/12/6/1518/699151/The-Spatial-Landscape-of-Progression-and',
        },
        pubmed: {
            name: '35404441',
            link: 'https://pubmed.ncbi.nlm.nih.gov/35404441/',
        },
        DOI: {
            name: '10.1158/2159-8290.CD-21-1357',
            link: 'https://doi.org/10.1158/2159-8290.cd-21-1357',
        },
        atlas: {
            name: 'Harvard Medical School, Brigham and Women’s Hospital',
            link: 'https://data.humantumoratlas.org/hta7',
        },
    },
    msk_sclc_chan_2021: {
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
    ohsu_brca_johnson_2022: {
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
    vanderbilt_crc_chen_2021: {
        journal: {
            name: 'Cell',
            link:
                'https://www.cell.com/cell/fulltext/S0092-8674(21)01381-7?_returnURL=https%3A%2F%2Flinkinghub.elsevier.com%2Fretrieve%2Fpii%2FS0092867421013817%3Fshowall%3Dtrue',
        },
        pubmed: {
            name: '34910928',
            link: 'https://pubmed.ncbi.nlm.nih.gov/34910928/',
        },
        DOI: {
            name: '10.1016/j.cell.2021.11.031',
            link: 'https://doi.org/10.1016/j.cell.2021.11.031',
        },
        atlas: {
            name: 'Vanderbilt University',
            link: 'https://data.humantumoratlas.org/hta11',
        },
    },
};

const filtersById: { [id: string]: ExploreSelectedFilter[] } = {
    htapp_crc_pelka_2021: [
        { group: 'AtlasName', value: 'HTAN HTAPP', id: 'HTA1' },
    ],
    duke_brca_risom_2021: [
        { group: 'AtlasName', value: 'HTAN Duke', id: 'HTA6' },
    ],
    hms_ckcm_nirmal_2022: [
        { group: 'AtlasName', value: 'HTAN HMS', id: 'HTA7' },
    ],
    msk_sclc_chan_2021: [{ group: 'AtlasName', value: 'HTAN MSK', id: 'HTA8' }],
    ohsu_brca_johnson_2022: [
        { group: 'AtlasName', value: 'HTAN OHSU', id: 'HTA9' },
    ],
    vanderbilt_crc_chen_2021: [
        { group: 'AtlasName', value: 'HTAN Vanderbilt', id: 'HTA11' },
    ],
};

export async function getAllPublicationIds() {
    const ids = [
        'htapp_crc_pelka_2021',
        'duke_brca_risom_2021',
        'hms_ckcm_nirmal_2022',
        'ohsu_brca_johnson_2022',
        'msk_sclc_chan_2021',
        'vanderbilt_crc_chen_2021',
    ];
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
    const correspondingAuthors = correspondingAuthorsById[id];
    const publicationData: PublicationData = {
        title,
        abstract,
        synapseAtlas: info,
        schemaDataById,
        authors,
        correspondingAuthors,
        publicationInfo,
        filters,
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
