import getAtlasMetaData from '../lib/getAtlasMetaData';
import { NextRouter, withRouter } from 'next/router';
import { isReleaseQCEnabled } from '../lib/helpers';
import Explore2ClientComponent from './explore2_client';
import { ExplorePageShell } from '../components/ExplorePageShell';

interface Explore2PageProps {
    router: NextRouter;
}

const Explore2Page = ({ router }: Explore2PageProps) => (
    <ExplorePageShell
        router={router}
        getAtlasMetaData={getAtlasMetaData}
        isReleaseQCEnabled={isReleaseQCEnabled}
        ClientComponent={Explore2ClientComponent}
        mapClientProps={(props) => props}
    />
);

export default withRouter(Explore2Page);
