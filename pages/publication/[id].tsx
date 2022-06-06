import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
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

const PublicationPage = (props: { data: Publication }) => {
    const router = useRouter();

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <div className={styles.publicationPage}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                fontSize: 50,
                                width: 110,
                                padding: 30,
                                color: '#5f008c',
                            }}
                        >
                            <FontAwesomeIcon icon={faBook} />
                        </div>
                        <div>
                            <span style={{ fontStyle: 'italic' }}>
                                Publication
                            </span>
                            <h2 style={{ marginTop: 0, padding: 0 }}>
                                {props.data.publicationData.title}
                            </h2>
                            <p>
                                Authors:{' '}
                                <span style={{ fontStyle: 'italic' }}>
                                    Johnson BE, Creason AL, Stommel JM, et al.
                                </span>
                                <br />
                                Journal:{' '}
                                <span>
                                    <a href="https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(22)00025-8">
                                        Cell Rep Med.
                                    </a>
                                </span>{' '}
                                &nbsp; Pubmed:{' '}
                                <a href="https://pubmed.ncbi.nlm.nih.gov/35243422/">
                                    35243422
                                </a>{' '}
                                &nbsp; DOI:{' '}
                                <a href="https://doi.org/10.1016/j.xcrm.2022.100525">
                                    10.1016/j.xcrm.2022.100525
                                </a>
                                <br />
                                Atlas:{' '}
                                {props.data.publicationData.leadInstitute.name}
                            </p>
                        </div>
                    </div>
                    <PublicationTabs
                        router={router}
                        abstract={props.data.publicationData.abstract}
                        synapseAtlas={props.data.publicationData.synapseAtlas}
                        biospecimens={props.data.publicationData.biospecimens}
                        cases={props.data.publicationData.cases}
                        images={props.data.publicationData.iamges}
                        sequences={props.data.publicationData.sequences}
                        schemaDataById={
                            props.data.publicationData.schemaDataById
                        }
                        // schemaDataById={this.state.schemaDataById}
                        // filteredFiles={this.filteredFiles}
                        // filteredSynapseAtlases={this.filteredAtlases}
                        // filteredSynapseAtlasesByNonAtlasFilters={
                        //     this.filteredAtlasesByNonAtlasFilters
                        // }
                        // selectedSynapseAtlases={this.selectedAtlases}
                        // allSynapseAtlases={this.allAtlases}
                        // onSelectAtlas={this.onSelectAtlas}
                        // samples={this.filteredSamples}
                        // cases={this.filteredCases}
                        // filteredCasesByNonAtlasFilters={
                        //     this.filteredCasesByNonAtlasFilters
                        // }
                        // filteredSamplesByNonAtlasFilters={
                        //     this.filteredSamplesByNonAtlasFilters
                        // }
                        // nonAtlasSelectedFiltersByAttrName={
                        //     this.nonAtlasSelectedFiltersByAttrName
                        // }
                        // wpData={this.props.wpAtlases}
                        // getGroupsByPropertyFiltered={
                        //     this.getGroupsByPropertyFiltered
                        // }
                        // showAllBiospecimens={this.showAllBiospecimens}
                        // showAllCases={this.showAllCases}
                        // toggleShowAllBiospecimens={
                        //     this.toggleShowAllBiospecimens
                        // }
                        // toggleShowAllCases={this.toggleShowAllCases}
                    />
                </div>
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
