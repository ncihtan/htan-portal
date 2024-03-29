import _ from 'lodash';
import { Entity, FileViewerName } from './entity';

export function getViewerValues(
    entity: Entity,
    exclude: FileViewerName[] = [FileViewerName.cds, FileViewerName.idc]
) {
    return _(entity.viewers).keys().difference(exclude).value();
}
