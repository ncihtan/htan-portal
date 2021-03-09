import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';

const Design: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Design Principles" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-design-principles']);
    return { props: { data } };
};

export default Design;
