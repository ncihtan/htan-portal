import React, { useEffect, useState } from 'react';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import PageWrapper from '../../components/PageWrapper';
import { useRouter } from 'next/router';
import PublicationTabs from '../../components/PublicationTabs';
import styles from './styles.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { ScaleLoader } from 'react-spinners';
import {
    assayQuery,
    Atlas,
    AtlasDescription,
    commonStyles,
    doQuery,
    Entity,
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

interface PublicationData {
    schemaDataById: SchemaDataById;
    genericAttributeMap: { [attr: string]: GenericAttributeNames };
    specimen: Entity[];
    cases: Entity[];
    atlases: Atlas[];
    assays: Entity[];
    publications: PublicationManifest[];
}

const PublicationPage = () => {
    const router = useRouter();
    const [data, setData] = useState<PublicationData | null>(null);

    useEffect(() => {
        if (!router.isReady) return;

        const publicationId = router.query.id as string;

        // Validate publicationId to prevent SQL injection — block characters
        // that are unsafe in SQL string literals while allowing unicode letters.
        if (/['";\\\/\x00]/.test(publicationId)) {
            return;
        }

        async function fetchData() {
            const [
                publications,
                specimen,
                cases,
                atlases,
                assays,
                schemaDataById,
            ] = await Promise.all([
                doQuery<PublicationManifest>(
                    'SELECT * FROM publication_manifest'
                ),
                doQuery<Entity>(`
                    SELECT * FROM specimen WHERE
                    has(publicationIds,'${publicationId}') 
                `),
                doQuery<Entity>(`
                    SELECT * FROM cases WHERE
                    has(publicationIds,'${publicationId}')
                `),
                doQuery<Atlas>(`SELECT * FROM atlases`),
                doQuery<Entity>(assayQuery({ publicationId })),
                fetchAndProcessSchemaData(),
            ]);

            setData({
                schemaDataById,
                genericAttributeMap: HTANToGenericAttributeMap,
                publications: postProcessPublications(publications),
                assays: postProcessFiles(assays),
                specimen,
                cases,
                atlases,
            });
        }

        fetchData();
    }, [router.isReady, router.query.id]);

    if (!data) {
        return (
            <>
                <PreReleaseBanner />
                <PageWrapper>
                    <div className={commonStyles.loadingIndicator}>
                        <ScaleLoader />
                    </div>
                </PageWrapper>
            </>
        );
    }

    const publication = data.publications.find(
        (p: PublicationManifest) => p.publicationId === router.query.id
    );
    const publicationsByUid = _.keyBy(
        data.publications,
        (p) => p.publicationId
    );

    if (!publication) {
        return <div>There is no publication corresponding to this id.</div>;
    }

    const doi = getPublicationDOI(publication);
    const pubmedId = getPublicationPubMedID(publication);

    const atlasMeta = publication.AtlasMeta;

    const assaysByAssayNameMap = _.groupBy(data.assays, 'assayName');

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
                            synapseAtlases={data.atlases}
                            biospecimens={data.specimen}
                            cases={data.cases}
                            assays={assaysByAssayNameMap}
                            supportingLinks={getPublicationSupportingLinks(
                                publication
                            )}
                            schemaDataById={data.schemaDataById}
                            genericAttributeMap={data.genericAttributeMap}
                            publicationsByUid={publicationsByUid}
                        />
                    </div>
                )}
            </PageWrapper>
        </>
    );
};

export default PublicationPage;

