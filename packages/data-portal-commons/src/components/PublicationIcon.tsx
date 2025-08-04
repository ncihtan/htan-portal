import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import Tooltip from 'rc-tooltip';
import React from 'react';

import { PublicationManifest } from '../lib/entity';
import { getCite, getPublicationUid } from '../lib/publicationHelpers';

export const PublicationIcon: React.FunctionComponent<{
    publicationManifest: PublicationManifest;
}> = (props) => {
    const { publicationManifest } = props;

    return (
        <Tooltip
            overlay={getCite(publicationManifest)}
            key={getPublicationUid(publicationManifest)}
        >
            <a
                href={`/publications/${getPublicationUid(publicationManifest)}`}
                key={getPublicationUid(publicationManifest)}
                style={{ paddingRight: 3 }}
            >
                <FontAwesomeIcon icon={faBook} />
            </a>
        </Tooltip>
    );
};

export default PublicationIcon;
