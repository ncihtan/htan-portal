import _ from 'lodash';

// Identifier and metadata fields: never rewrite these, they are used for joins
// or are not user-facing categorical values.
const EXCLUDED_FIELDS = new Set([
    'Component',
    'HTANParticipantID',
    'ParticipantID',
    'synapseId',
    'atlasid',
    'atlas_name',
    'level',
    'assayName',
    'AtlasMeta',
    'publicationIds',
]);

/**
 * Picks a single spelling among values that differ only by case or
 * surrounding whitespace (e.g. "Female" / "female"): the most frequent one
 * wins; ties are broken by
 * preferring a leading uppercase letter, then alphabetically, so the result is
 * deterministic.
 */
function pickCanonicalValue(countsByValue) {
    return _(countsByValue)
        .toPairs()
        .sortBy([
            ([, count]) => -count,
            ([value]) => (/^[A-Z]/.test(value) ? 0 : 1),
            ([value]) => value,
        ])
        .first()[0]
        .trim();
}

/**
 * Builds a map of field -> lowercased value -> canonical value, for every
 * string field (except excluded ones) across the given records. Only values
 * that actually have multiple casings are included.
 */
export function buildCanonicalValueMap(records) {
    // field -> lowercased value -> original value -> count
    const counts = {};

    records.forEach((record) => {
        _.forEach(record, (value, field) => {
            if (EXCLUDED_FIELDS.has(field) || !_.isString(value)) {
                return;
            }
            const key = value.trim().toLowerCase();
            counts[field] = counts[field] || {};
            counts[field][key] = counts[field][key] || {};
            counts[field][key][value] = (counts[field][key][value] || 0) + 1;
        });
    });

    return _.mapValues(counts, (byKey) =>
        _(byKey)
            .pickBy((countsByValue) => _.size(countsByValue) > 1)
            .mapValues(pickCanonicalValue)
            .value()
    );
}

/**
 * Rewrites, in place, string values that differ only by case to a single
 * canonical spelling per field, so that e.g. "Female" and "female" are
 * combined into one value. Returns the canonical value map (for logging).
 */
export function normalizeValueCasing(records) {
    const canonicalValueMap = buildCanonicalValueMap(records);

    records.forEach((record) => {
        _.forEach(record, (value, field) => {
            if (!_.isString(value)) {
                return;
            }
            const canonical =
                canonicalValueMap[field]?.[value.trim().toLowerCase()];
            // check the type rather than truthiness: the canonical value can
            // legitimately be '' (e.g. when grouping '' with ' ')
            if (_.isString(canonical)) {
                record[field] = canonical;
            }
        });
    });

    return canonicalValueMap;
}
