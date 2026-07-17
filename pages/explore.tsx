import { NextRouter, withRouter } from 'next/router';

import getAtlasMetaData from '../lib/getAtlasMetaData';
import { getCloudBaseUrl, isReleaseQCEnabled } from '../lib/helpers';
import ExploreClientComponent from './explore_client';
import { ExplorePageShell } from '../components/ExplorePageShell';

interface ExplorePageProps {
    router: NextRouter;
}

const ExplorePage = ({ router }: ExplorePageProps) => (
    <ExplorePageShell
        router={router}
        getAtlasMetaData={getAtlasMetaData}
        isReleaseQCEnabled={isReleaseQCEnabled}
        ClientComponent={ExploreClientComponent}
        mapClientProps={(props) => ({
            ...props,
            cloudBaseUrl: getCloudBaseUrl(),
        })}
    />
);

export default withRouter(ExplorePage);
