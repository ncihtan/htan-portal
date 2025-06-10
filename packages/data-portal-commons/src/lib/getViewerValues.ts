import _ from 'lodash';
import { Entity, FileViewerName } from './entity';

export function getViewerValues(
    entity: Entity,
    exclude: FileViewerName[] = [FileViewerName.cds, FileViewerName.idc]
): FileViewerName[] {
    const viewers =
        typeof entity.viewers === 'string'
            ? JSON.parse(entity.viewers)
            : entity.viewers;
    return _(viewers).keys().difference(exclude).value() as FileViewerName[];
}
