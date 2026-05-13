import { tool } from 'ai';
import { z } from 'zod';

// `proposeView` is a no-op server-side: it exists so the model can hand the
// portal UI a one-click "Apply to Explore" button for its answer. The tool's
// execute() just echoes the structured input back; the chat route forwards it
// to the client over SSE, and ChatPanel renders the button.
//
// We keep the input schema deliberately narrow so the model can't propose
// destinations that aren't real Explore views.

const TAB_VALUES = [
    'atlas',
    'file',
    'cases',
    'biospecimen',
    'publication',
    'plots',
] as const;

export type ProposedView = {
    tab: typeof TAB_VALUES[number];
    filters: { group: string; value: string }[];
    label: string;
};

export function makeProposeViewTool() {
    return tool({
        description:
            'Offer the user a one-click button to load the Explore page with a specific tab and filter set applied. Call this when the question you just answered corresponds to a filterable view the user might want to interact with (e.g. "show me scRNA-seq breast files" -> file tab + assayName=scRNA-seq, organType=Breast). Do not call this for purely descriptive answers (e.g. counts of the whole portal).',
        inputSchema: z.object({
            tab: z
                .enum(TAB_VALUES)
                .describe(
                    'Which Explore tab to open. "atlas" for the atlas list, "file" for files, "cases" for participants, "biospecimen" for specimens, "publication" for publications, "plots" for the plot view.'
                ),
            filters: z
                .array(
                    z.object({
                        group: z
                            .string()
                            .describe(
                                'Attribute name as it appears in the portal UI, e.g. "AtlasName", "assayName", "organType", "PrimaryDiagnosis", "FileFormat", "TissueorOrganofOrigin", "Gender".'
                            ),
                        value: z
                            .string()
                            .describe(
                                'Exact value to filter by (case-sensitive). One entry per (group, value) pair — for multi-value filters, emit multiple entries with the same group.'
                            ),
                    })
                )
                .describe(
                    'Filters to apply. Can be empty if only the tab matters.'
                ),
            label: z
                .string()
                .max(80)
                .describe(
                    'Short human-readable label for the button, e.g. "View scRNA-seq breast files in Explore". Should describe what the user will see when they click.'
                ),
        }),
        execute: async (input): Promise<{ ok: true; view: ProposedView }> => {
            return { ok: true, view: input as ProposedView };
        },
    });
}
