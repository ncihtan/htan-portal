import { BaseSerializableEntity } from './entity';

export function isLowestLevel(entity: BaseSerializableEntity) {
    return entity.Islowestlevel?.toLowerCase().startsWith('yes');
}
