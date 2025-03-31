import React, { useEffect, useState } from 'react';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import { GetStaticProps } from 'next';
import PageWrapper from '../../components/PageWrapper';
import { useRouter } from 'next/router';
import PublicationTabs from '../../components/PublicationTabs';
import styles from './styles.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import {
    Atlas,
    AtlasDescription,
    commonStyles,
    Entity,
    fillInEntities,
    filterFiles,
    getAllPublicationPagePaths,
    getFilteredCases,
    getPublicationAuthors,
    getPublicationDOI,
    getPublicationFilters,
    getPublicationJournal,
    getPublicationPubMedID,
    getPublicationSupportingLinks,
    getPublicationTitle,
    groupFilesByAttrNameAndValue,
    HTANToGenericAttributeMap,
    isManuscriptInReview,
    LoadDataResult,
    PublicationManifest,
    PublicationSummary,
} from '@htan/data-portal-commons';

import {
    ISelectedFiltersByAttrName,
    SelectedFilter,
} from '@htan/data-portal-filter';
import {
    fetchAndProcessSchemaData,
    SchemaDataById,
} from '@htan/data-portal-schema';
import { GenericAttributeNames } from '@htan/data-portal-utils';

import publicationIds from './static_page_ids.json';
import {
    assayQuery,
    caseQuery,
    doQuery,
    specimenQuery,
} from '../../lib/clickhouseStore';
import { usePathname } from 'next/navigation';

// const filterByAttrName = (filters: SelectedFilter[]) => {
//     return _.chain(filters)
//         .groupBy((item) => item.group)
//         .mapValues((filters: SelectedFilter[]) => {
//             return new Set(filters.map((f) => f.value));
//         })
//         .value();
// };
//
// const getFilteredFiles = (
//     filterSelectionsByAttrName: ISelectedFiltersByAttrName,
//     files: LoadDataResult
// ) => {
//     return filterFiles(filterSelectionsByAttrName, fillInEntities(files));
// };
//
// const getBiospecimensData = (
//     selectedFiltersByAttrName: { [x: string]: Set<string> },
//     filteredFiles: Entity[]
// ) => {
//     const samples = _.chain(filteredFiles)
//         .flatMapDeep((file) => file.biospecimen)
//         .uniqBy((f) => f.BiospecimenID)
//         .value();
//     const filteredCaseIds = _.keyBy(
//         getFilteredCases(filteredFiles, selectedFiltersByAttrName, false),
//         (c) => c.ParticipantID
//     );
//     return samples.filter((s) => {
//         return s.ParticipantID in filteredCaseIds;
//     });
// };

interface PublicationPageProps {
    publicationUid: string;
    schemaDataById: SchemaDataById;
    genericAttributeMap: { [attr: string]: GenericAttributeNames };
    specimen: Entity[];
    cases: Entity[];
    atlases: Atlas[];
    assays: Entity[];
}

const PublicationPage = (props: PublicationPageProps) => {
    const router = useRouter();
    // const [data, setData] = useState<LoadDataResult>({} as LoadDataResult);
    // const [biospecimensData, setBiospecimensData] = useState<Entity[]>([]);
    // const [casesData, setCasesData] = useState<Entity[]>([]);
    // const [assayData, setAssayData] = useState<{
    //     [assayName: string]: Entity[];
    // }>({});
    // const [publicationManifest, setPublicationManifest] = useState<
    //     PublicationManifest | undefined
    // >(undefined);
    // const [publicationSummary, setPublicationSummary] = useState<
    //     PublicationSummary | undefined
    // >(undefined);
    //
    // useEffect(() => {
    //     async function getData() {
    //         await fetchData().then((data) => {
    //             setData(data);
    //             const publicationManifest =
    //                 data.publicationManifestByUid[props.publicationUid];
    //             setPublicationManifest(publicationManifest);
    //             const publicationSummary =
    //                 data.publicationSummaryByPubMedID?.[
    //                     getPublicationPubMedID(publicationManifest)
    //                 ];
    //             setPublicationSummary(publicationSummary);
    //
    //             if (publicationManifest) {
    //                 const selectedFiltersByAttrName = filterByAttrName(
    //                     getPublicationFilters(publicationManifest)
    //                 );
    //                 const filteredFiles = getFilteredFiles(
    //                     selectedFiltersByAttrName,
    //                     data
    //                 );
    //                 const groupedData = groupFilesByAttrNameAndValue(
    //                     filteredFiles
    //                 );
    //                 setAssayData(groupedData['assayName']);
    //                 const biospecimensData = getBiospecimensData(
    //                     selectedFiltersByAttrName,
    //                     filteredFiles
    //                 );
    //                 setBiospecimensData(biospecimensData);
    //                 const casesData = getFilteredCases(
    //                     filteredFiles,
    //                     selectedFiltersByAttrName,
    //                     false
    //                 );
    //                 setCasesData(casesData);
    //
    //                 if (isReleaseQCEnabled()) {
    //                     const missingPublicationFiles = _.difference(
    //                         publicationManifest?.PublicationAssociatedParentDataFileID.split(
    //                             ','
    //                         ),
    //                         filteredFiles.map((f) => f.DataFileID)
    //                     );
    //
    //                     if (!_.isEmpty(missingPublicationFiles)) {
    //                         console.log(
    //                             `Missing publication files for ${props.publicationUid}: `
    //                         );
    //                         console.log(missingPublicationFiles);
    //                     }
    //                 }
    //             }
    //         });
    //     }
    //     getData();
    // }, []);

    const publication = props.publications.find(
        (p) => p.publicationId === router.query.id
    );

    // const isLoading = _.isEmpty(data);
    const doi = publication.elocationid?.replace(/^doi: /, '');
    const pubmedId = publication.uid;

    const atlasMeta = JSON.parse(publication.AtlasMeta);

    const assaysByAssayNameMap = _.groupBy(props.assays, 'assayName');

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                {publication && (
                    <div className={styles.publicationPage}>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <div
                                style={{
                                    fontSize: 50,
                                    width: 140,
                                    padding: 40,
                                    color: '#5f008c',
                                }}
                            >
                                <FontAwesomeIcon icon={faBook} />
                            </div>
                            <div style={{ width: '100%' }}>
                                <span style={{ fontStyle: 'italic' }}>
                                    {isManuscriptInReview(publication) ? (
                                        <>
                                            Manuscript (
                                            <strong className="text-danger">
                                                in review
                                            </strong>
                                            )
                                        </>
                                    ) : (
                                        'Publication'
                                    )}
                                </span>
                                <h2 style={{ marginTop: 0, padding: 0 }}>
                                    {publication.title}
                                </h2>
                                <p>
                                    Authors:{' '}
                                    {getPublicationAuthors(publication).map(
                                        (author, index, authors) => (
                                            <>
                                                <span
                                                    style={{
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    {author}
                                                </span>
                                                {index !==
                                                    authors.length - 1 && (
                                                    <>{', '}</>
                                                )}
                                            </>
                                        )
                                    )}{' '}
                                    <br />
                                    {/*<span>Contact: </span>
                                    {props.data.publicationData.correspondingAuthors.map(
                                        (correspondingAuthor, index) => (
                                            <>
                                                <a
                                                    href={`mailto:${correspondingAuthor.email}`}
                                                >
                                                    <span
                                                        style={{
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        {
                                                            correspondingAuthor.name
                                                        }
                                                    </span>
                                                </a>
                                                {index <
                                                    props.data.publicationData
                                                        .correspondingAuthors
                                                        .length -
                                                        1 && <>{', '}</>}
                                            </>
                                        )
                                    )}
                                    <br />*/}
                                    Journal: {publication.fulljournalname}
                                    {pubmedId && (
                                        <>
                                            &nbsp; Pubmed:{' '}
                                            <a
                                                href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}`}
                                            >
                                                {pubmedId}
                                            </a>{' '}
                                        </>
                                    )}
                                    {publication.elocationid && (
                                        <>
                                            &nbsp; DOI:{' '}
                                            <a href={`https://doi.org/${doi}`}>
                                                {doi}
                                            </a>
                                        </>
                                    )}
                                    <br />
                                    Atlas:{' '}
                                    <AtlasDescription
                                        atlasMeta={atlasMeta}
                                        atlasName={atlasMeta.lead_institutions}
                                    />
                                </p>
                            </div>
                        </div>
                        <PublicationTabs
                            router={router}
                            abstract={publication.PublicationAbstract}
                            synapseAtlases={props.atlases}
                            biospecimens={props.specimen}
                            cases={props.cases}
                            assays={assaysByAssayNameMap}
                            supportingLinks={getPublicationSupportingLinks(
                                publication
                            )}
                            schemaDataById={props.schemaDataById}
                            genericAttributeMap={props.genericAttributeMap}
                        />
                    </div>
                )}
            </PageWrapper>
        </>
    );
};

export default PublicationPage;

export const getStaticProps: GetStaticProps = async (context) => {
    const publications = await doQuery('SELECT * FROM publication_manifest');

    const specimen = await doQuery(`
        SELECT * FROM specimen WHERE
        has(publicationIds,'${context.params.id}') 
    `);
    const cases = await doQuery(`
        SELECT * FROM cases WHERE
        has(publicationIds,'${context.params.id}')
    `);

    const atlases = await doQuery(`SELECT * FROM atlases`);

    const assays = await doQuery(
        assayQuery({ publicationId: context.params.id })
    );

    return {
        props: {
            publicationUid: context.params?.id,
            schemaDataById: await fetchAndProcessSchemaData(),
            genericAttributeMap: HTANToGenericAttributeMap, // TODO needs to be configurable
            publications,
            specimen,
            cases,
            assays,
            atlases,
        },
    };
};

export async function getStaticPaths() {
    return {
        paths: getAllPublicationPagePaths(publicationIds), // indicates that no page needs be created at build time
        fallback: false,
        // TODO disabling dynamic pages for now
        // paths: [], // indicates that no page needs be created at build time
        // fallback: 'blocking', // page will wait for the HTML to be generated
    };
}
