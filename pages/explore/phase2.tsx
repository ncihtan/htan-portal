import { NextRouter, withRouter } from 'next/router';

import getAtlasMetaData from '../../lib/getAtlasMetaData';
import { isReleaseQCEnabled } from '../../lib/helpers';
import Explore2ClientComponent from '../explore2_client';
import { ExplorePageShell } from '../../components/ExplorePageShell';

interface ExplorePhase2PageProps {
    router: NextRouter;
}

const ExplorePhase2Page = ({ router }: ExplorePhase2PageProps) => (
    <ExplorePageShell
        router={router}
        getAtlasMetaData={getAtlasMetaData}
        isReleaseQCEnabled={isReleaseQCEnabled}
        ClientComponent={Explore2ClientComponent}
        mapClientProps={(props) => props}
    />
);

export default withRouter(ExplorePhase2Page);
