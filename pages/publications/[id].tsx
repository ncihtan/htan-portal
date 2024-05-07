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
import { fetchData } from '../../lib/helpers';
import { ScaleLoader } from 'react-spinners';
import {
    AtlasDescription,
    commonStyles,
    Entity,
    fillInEntities,
    filterFiles,
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

const filterByAttrName = (filters: SelectedFilter[]) => {
    return _.chain(filters)
        .groupBy((item) => item.group)
        .mapValues((filters: SelectedFilter[]) => {
            return new Set(filters.map((f) => f.value));
        })
        .value();
};

const getFilteredFiles = (
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    files: LoadDataResult
) => {
    return filterFiles(filterSelectionsByAttrName, fillInEntities(files));
};

const getBiospecimensData = (
    selectedFiltersByAttrName: { [x: string]: Set<string> },
    filteredFiles: Entity[]
) => {
    const samples = _.chain(filteredFiles)
        .flatMapDeep((file) => file.biospecimen)
        .uniqBy((f) => f.BiospecimenID)
        .value();
    const filteredCaseIds = _.keyBy(
        getFilteredCases(filteredFiles, selectedFiltersByAttrName, false),
        (c) => c.ParticipantID
    );
    return samples.filter((s) => {
        return s.ParticipantID in filteredCaseIds;
    });
};

interface PublicationPageProps {
    publicationUid: string;
    schemaDataById: SchemaDataById;
    genericAttributeMap: { [attr: string]: GenericAttributeNames };
}

const PublicationPage = (props: PublicationPageProps) => {
    const router = useRouter();
    const [data, setData] = useState<LoadDataResult>({} as LoadDataResult);
    const [biospecimensData, setBiospecimensData] = useState<Entity[]>([]);
    const [casesData, setCasesData] = useState<Entity[]>([]);
    const [assayData, setAssayData] = useState<{
        [assayName: string]: Entity[];
    }>({});
    const [publicationManifest, setPublicationManifest] = useState<
        PublicationManifest | undefined
    >(undefined);
    const [publicationSummary, setPublicationSummary] = useState<
        PublicationSummary | undefined
    >(undefined);

    useEffect(() => {
        async function getData() {
            await fetchData().then((data) => {
                setData(data);
                const publicationManifest =
                    data.publicationManifestByUid[props.publicationUid];
                setPublicationManifest(publicationManifest);
                const publicationSummary =
                    data.publicationSummaryByPubMedID?.[
                        getPublicationPubMedID(publicationManifest)
                    ];
                setPublicationSummary(publicationSummary);

                if (publicationManifest) {
                    const selectedFiltersByAttrName = filterByAttrName(
                        getPublicationFilters(publicationManifest)
                    );
                    const filteredFiles = getFilteredFiles(
                        selectedFiltersByAttrName,
                        data
                    );
                    const groupedData = groupFilesByAttrNameAndValue(
                        filteredFiles
                    );
                    setAssayData(groupedData['assayName']);
                    const biospecimensData = getBiospecimensData(
                        selectedFiltersByAttrName,
                        filteredFiles
                    );
                    setBiospecimensData(biospecimensData);
                    const casesData = getFilteredCases(
                        filteredFiles,
                        selectedFiltersByAttrName,
                        false
                    );
                    setCasesData(casesData);
                }
            });
        }
        getData();
    }, []);

    const isLoading = _.isEmpty(data);
    const doi = getPublicationDOI(publicationSummary, publicationManifest);
    const pubmedId = publicationManifest
        ? getPublicationPubMedID(publicationManifest)
        : undefined;

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                {isLoading && (
                    <div className={commonStyles.loadingIndicator}>
                        <ScaleLoader />
                    </div>
                )}
                {!isLoading && publicationManifest && (
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
                                    Publication
                                </span>
                                <h2 style={{ marginTop: 0, padding: 0 }}>
                                    {getPublicationTitle(
                                        publicationSummary,
                                        publicationManifest
                                    )}
                                </h2>
                                <p>
                                    Authors:{' '}
                                    {getPublicationAuthors(
                                        publicationSummary,
                                        publicationManifest
                                    ).map((author, index, authors) => (
                                        <>
                                            <span
                                                style={{
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                {author}
                                            </span>
                                            {index !== authors.length - 1 && (
                                                <>{', '}</>
                                            )}
                                        </>
                                    ))}{' '}
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
                                    {getPublicationJournal(
                                        publicationSummary,
                                        publicationManifest
                                    )}
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
                                    &nbsp; DOI:{' '}
                                    <a href={`https://doi.org/${doi}`}>{doi}</a>
                                    <br />
                                    Atlas:{' '}
                                    <AtlasDescription
                                        atlasMeta={
                                            publicationManifest.AtlasMeta
                                        }
                                        atlasName={
                                            publicationManifest.AtlasMeta
                                                .lead_institutions
                                        }
                                    />
                                </p>
                            </div>
                        </div>
                        <PublicationTabs
                            router={router}
                            abstract={publicationManifest.PublicationAbstract}
                            synapseAtlas={data.atlases.find(
                                (a) => a.htan_id === publicationManifest.atlasid
                            )}
                            biospecimens={biospecimensData}
                            cases={casesData}
                            assays={assayData}
                            supportingLinks={getPublicationSupportingLinks(
                                publicationManifest
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
    return {
        props: {
            publicationUid: context.params?.id,
            schemaDataById: await fetchAndProcessSchemaData(),
            genericAttributeMap: HTANToGenericAttributeMap, // TODO needs to be configurable
        },
    };
};

export async function getStaticPaths() {
    return {
        paths: [], // indicates that no page needs be created at build time
        // fallback: false,
        fallback: 'blocking', // page will wait for the HTML to be generated
    };
}
