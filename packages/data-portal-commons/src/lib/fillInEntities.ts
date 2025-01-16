import { Entity } from './entity';
import { LoadDataResult } from './types';
import _ from 'lodash';

export function fillInEntities(data: LoadDataResult): Entity[] {
    const biospecimenMap = data.biospecimenByBiospecimenID;
    const diagnosisMap = data.diagnosisByParticipantID;
    const demoMap = data.demographicsByParticipantID;
    const therapyMap = data.therapyByParticipantID;

    // TODO we cannot do this, we need to deal with this in a different way in Plots tab
    // data.files = data.files.filter((f) => {
    //     return f.demographicsIds.length > 0 && f.diagnosisIds.length > 0;
    // });

    data.files.forEach((file) => {
        (file as Entity).biospecimen = file.biospecimenIds.map(
            (id) => biospecimenMap[id] as Entity
        );
        (file as Entity).diagnosis = file.diagnosisIds.map(
            (id) => diagnosisMap[id] as Entity
        );
        (file as Entity).demographics = file.demographicsIds.map(
            (id) => demoMap[id] as Entity
        );
        (file as Entity).therapy = file.therapyIds.map(
            (id) => therapyMap[id] as Entity
        );
        (file as Entity).cases = _.uniqBy(
            mergeCaseData(
                file.caseIds,
                diagnosisMap as { [id: string]: Entity },
                demoMap as { [id: string]: Entity },
                therapyMap as { [id: string]: Entity }
            ),
            (c) => c.ParticipantID
        );
    });

    return data.files as Entity[];
}

function mergeCaseData(
    participantIds: string[],
    diagnosisByParticipantID: { [participantID: string]: Entity },
    demographicsByParticipantID: { [participantID: string]: Entity },
    therapyByParticipantID: { [participantID: string]: Entity }
) {
    return participantIds.map((id) => ({
        ...diagnosisByParticipantID[id],
        ...demographicsByParticipantID[id],
        ...therapyByParticipantID[id],
    }));
}
