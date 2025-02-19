import { Entity } from './entity';
import {
    computeEntityReportByAssay,
    computeEntityReportByOrgan,
    EntityReportByAttribute,
    getNormalizedOrgan,
    NOT_REPORTED,
} from './entityReportHelpers';

export type DashboardData = {
    hero_blurb: string;
    synapseCounts: EntityReport[];
    organSummary: EntityReportByAttribute[];
    assaySummary: EntityReportByAttribute[];
};

export type EntityReport = {
    description: string;
    text: string;
};

export function computeDashboardData(files: Entity[]): EntityReport[] {
    const uniqueAtlases = new Set();
    const uniqueOrgans = new Set();
    const uniqueBiospecs = new Set();
    const uniqueCases = new Set();

    for (const file of files) {
        if (file.atlasid) {
            uniqueAtlases.add(file.atlasid);
        }
        for (const biospecimen of file.biospecimen) {
            uniqueBiospecs.add(biospecimen.BiospecimenID);
        }
        for (const diagnosis of file.diagnosis) {
            uniqueCases.add(diagnosis.ParticipantID);
            uniqueOrgans.add(getNormalizedOrgan(diagnosis));
        }
        for (const demographics of file.demographics) {
            uniqueCases.add(demographics.ParticipantID);
        }
    }

    // remove "Not Reported" from the organ list
    uniqueOrgans.delete(NOT_REPORTED);

    return [
        { description: 'Atlases', text: uniqueAtlases.size.toString() },
        { description: 'Organs', text: uniqueOrgans.size.toString() },
        { description: 'Cases', text: uniqueCases.size.toString() },
        { description: 'Biospecimens', text: uniqueBiospecs.size.toString() },
    ];
}

export function getDashboardData(files: Entity[]): DashboardData {
    const blurb = `
    HTAN is a National Cancer Institute (NCI)-funded Cancer MoonshotSM initiative to construct 3-dimensional atlases of the dynamic cellular, morphological, and molecular features of human cancers as they evolve from precancerous lesions to advanced disease. (Cell April 2020)
    `;

    return {
        hero_blurb: blurb,
        synapseCounts: computeDashboardData(files),
        organSummary: computeEntityReportByOrgan(files),
        assaySummary: computeEntityReportByAssay(files),
    };
}
