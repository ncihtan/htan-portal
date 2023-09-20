import React, { useEffect, useState } from 'react';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import { GetStaticProps } from 'next';
import { Publication } from '../../types';
import PageWrapper from '../../components/PageWrapper';
import {
    getAllPublicationIds,
    getPublicationData,
} from '../../lib/publications';
import { useRouter } from 'next/router';
import PublicationTabs from '../../components/PublicationTabs';
import styles from './styles.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { fetchData, fillInEntities, LoadDataResult } from '../../lib/helpers';
import { ScaleLoader } from 'react-spinners';
import {
    filterFiles,
    getFilteredCases,
    groupFilesByAttrNameAndValue,
} from '../../lib/filterHelpers';

import {
    ISelectedFiltersByAttrName,
    SelectedFilter,
} from '../../packages/data-portal-filter/src/libs/types';
import { Entity } from '../../packages/data-portal-commons/src/libs/entity';

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

const filterAssayData = (
    groupedData: { [attrName: string]: { [attrValue: string]: Entity[] } },
    filterAssayName: string[]
) => {
    const filteredData = _.chain(groupedData['assayName'])
        .keys()
        .filter((key) => filterAssayName.includes(key))
        .flatMap((key) => groupedData['assayName'][key])
        .value();
    return filteredData;
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

const PublicationPage = (props: { data: Publication }) => {
    const router = useRouter();
    const [data, setData] = useState<LoadDataResult>({} as LoadDataResult);
    const [biospecimensData, setBiospecimensData] = useState<Entity[]>([]);
    const [casesData, setCasesData] = useState<Entity[]>([]);
    const [assayData, setAssayData] = useState<{
        [assayName: string]: Entity[];
    }>({});

    useEffect(() => {
        async function getData() {
            await fetchData().then((data) => {
                setData(data);
                const selectedFiltersByAttrName = filterByAttrName(
                    props.data.publicationData.filters
                );
                const filteredFiles = getFilteredFiles(
                    selectedFiltersByAttrName,
                    data
                );
                const groupedData = groupFilesByAttrNameAndValue(filteredFiles);
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
            });
        }
        getData();
    }, []);

    const isLoading = _.isEmpty(data);

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                {isLoading && (
                    <div className={styles.loadingIndicator}>
                        <ScaleLoader />
                    </div>
                )}
                {!isLoading && (
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
                                    {props.data.publicationData.title}
                                </h2>
                                <p>
                                    Authors:{' '}
                                    {props.data.publicationData.authors.map(
                                        (author, index) => (
                                            <>
                                                <span
                                                    style={{
                                                        fontStyle: 'italic',
                                                    }}
                                                >
                                                    {author}
                                                </span>
                                                {', '}
                                                {index ===
                                                    props.data.publicationData
                                                        .authors.length -
                                                        1 && <>{'et al.'}</>}
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
                                    <span>
                                        <a
                                            href={
                                                props.data.publicationData
                                                    .publicationInfo.journal
                                                    .link
                                            }
                                        >
                                            {
                                                props.data.publicationData
                                                    .publicationInfo.journal
                                                    .name
                                            }
                                        </a>
                                    </span>{' '}
                                    &nbsp; Pubmed:{' '}
                                    <a
                                        href={
                                            props.data.publicationData
                                                .publicationInfo.pubmed.link
                                        }
                                    >
                                        {
                                            props.data.publicationData
                                                .publicationInfo.pubmed.name
                                        }
                                    </a>{' '}
                                    &nbsp; DOI:{' '}
                                    <a
                                        href={
                                            props.data.publicationData
                                                .publicationInfo.DOI.link
                                        }
                                    >
                                        {
                                            props.data.publicationData
                                                .publicationInfo.DOI.name
                                        }
                                    </a>
                                    <br />
                                    Atlas:{' '}
                                    <a
                                        href={
                                            props.data.publicationData
                                                .publicationInfo.atlas.link
                                        }
                                    >
                                        {
                                            props.data.publicationData
                                                .publicationInfo.atlas.name
                                        }
                                    </a>
                                </p>
                            </div>
                        </div>
                        <PublicationTabs
                            router={router}
                            abstract={props.data.publicationData.abstract}
                            synapseAtlas={
                                props.data.publicationData.synapseAtlas
                            }
                            biospecimens={biospecimensData}
                            cases={casesData}
                            assays={assayData}
                            schemaDataById={
                                props.data.publicationData.schemaDataById
                            }
                            genericAttributeMap={
                                props.data.publicationData.genericAttributeMap
                            }
                        />
                    </div>
                )}
            </PageWrapper>
        </>
    );
};

export default PublicationPage;

export const getStaticProps: GetStaticProps = async (context) => {
    // @ts-ignore
    const data = await getPublicationData(context.params.id);
    return { props: { data } };
};

export async function getStaticPaths() {
    const paths = await getAllPublicationIds();
    return {
        paths,
        fallback: false,
    };
}
