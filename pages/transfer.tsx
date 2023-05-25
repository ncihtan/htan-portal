import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import PreReleaseBanner from '../components/PreReleaseBanner';

import PageWrapper from '../components/PageWrapper';

const Transfer = () => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row className={'contentWrapper'}>
                        <h1>Data Transfer</h1>
                        <p>
                            We currently only accept data submissions of <a href="/research-network">atlas
                            teams that are part of HTAN</a>. If you would like to
                            submit data, please see the <a href="https://dca-docs.scrollhelp.site/DCA/Working-version/HTAN/" target="_blank">HTAN Data Ingress docs</a>.
                        </p>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export default Transfer;
