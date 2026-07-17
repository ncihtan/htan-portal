import { NextRouter, withRouter } from 'next/router';

import getAtlasMetaData from '../../lib/getAtlasMetaData';
import { getCloudBaseUrl, isReleaseQCEnabled } from '../../lib/helpers';
import ExploreClientComponent from '../explore_client';
import { ExplorePageShell } from '../../components/ExplorePageShell';

interface ExplorePhase1PageProps {
    router: NextRouter;
}

const ExplorePhase1Page = ({ router }: ExplorePhase1PageProps) => (
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

export default withRouter(ExplorePhase1Page);
