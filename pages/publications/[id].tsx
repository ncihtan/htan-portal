import React from 'react';
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
    assayQuery,
    Atlas,
    AtlasDescription,
    doQuery,
    Entity,
    getAllPublicationPagePaths,
    getPublicationAuthors,
    getPublicationDOI,
    getPublicationJournal,
    getPublicationPubMedID,
    getPublicationSupportingLinks,
    getPublicationTitle,
    HTANToGenericAttributeMap,
    isManuscriptInReview,
    postProcessFiles,
    postProcessPublications,
    PublicationManifest,
} from '@htan/data-portal-commons';
import {
    fetchAndProcessSchemaData,
    SchemaDataById,
} from '@htan/data-portal-schema';
import { GenericAttributeNames } from '@htan/data-portal-utils';

import publicationIds from './static_page_ids.json';

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
    publications: PublicationManifest[];
}

const PublicationPage = (props: PublicationPageProps) => {
    const router = useRouter();

    const publication = props.publications.find(
        (p: PublicationManifest) => p.publicationId === router.query.id
    );
    const publicationsByUid = _.keyBy(
        props.publications,
        (p) => p.publicationId
    );

    if (!publication) {
        return <div>There is no publication corresponding to this id.</div>;
    }

    const doi = getPublicationDOI(publication);
    const pubmedId = getPublicationPubMedID(publication);

    const atlasMeta = publication.AtlasMeta;

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
                                    {getPublicationTitle(publication)}
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
                                    Journal:{' '}
                                    {getPublicationJournal(publication)}
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
                                    {doi && (
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
                            publicationsByUid={publicationsByUid}
                        />
                    </div>
                )}
            </PageWrapper>
        </>
    );
};

export default PublicationPage;

export const getStaticProps: GetStaticProps = async (context) => {
    const publications = await doQuery<PublicationManifest>(
        'SELECT * FROM publication_manifest'
    );

    const publicationId = context.params?.id || '';

    const specimen = await doQuery<Entity>(`
        SELECT * FROM specimen WHERE
        has(publicationIds,'${publicationId}') 
    `);
    const cases = await doQuery<Entity>(`
        SELECT * FROM cases WHERE
        has(publicationIds,'${publicationId}')
    `);

    const atlases = await doQuery<Atlas>(`SELECT * FROM atlases`);

    const assays = await doQuery<Entity>(
        assayQuery({ publicationId: publicationId })
    );

    return {
        props: {
            publicationUid: context.params?.id,
            schemaDataById: await fetchAndProcessSchemaData(),
            genericAttributeMap: HTANToGenericAttributeMap, // TODO needs to be configurable
            publications: postProcessPublications(publications),
            assays: postProcessFiles(assays),
            specimen,
            cases,
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
