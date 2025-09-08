import _ from 'lodash';
import { Entity, FileViewerName } from './entity';

export function getViewerValues(
    entity: Entity,
    exclude: FileViewerName[] = [FileViewerName.crdcGc, FileViewerName.idc]
): FileViewerName[] {
    const viewers = _.isString(entity.viewers)
        ? JSON.parse(entity.viewers)
        : entity.viewers;

    return _(viewers)
        .omitBy(_.isUndefined)
        .keys()
        .difference(exclude)
        .value() as FileViewerName[];
}
