import click
from collections import OrderedDict
import pandas as pd
from pandas.api.types import is_numeric_dtype
import numpy as np
import wget
import json
import logging
import glob
import os

import synapseclient

import schematic # follow installation instructions here: https://github.com/Sage-Bionetworks
from schematic import CONFIG
from schematic.store.synapse import SynapseStorage
from schematic.schemas.explorer import SchemaExplorer


MAX_AGE_IN_DAYS = 32849
MIN_AGE_IN_DAYS = 6570
CAP_AGE_COLUMNS = ["Age at Diagnosis", "Relationship Age at Diagnosis"]

MANIFESTS_WITHOUT_ENTITY_ID = ['Biospecimen','Demographics','Diagnosis','Exposure','FamilyHistory','FollowUp','MolecularTest','Therapy']

@click.command()
@click.option('--include-at-risk-populations/--exclude-at-risk-populations', default=False)
@click.option('--include-released-only/--include-unreleased', default=False)
@click.option('--do-not-download-from-synapse', default=False)
def generate_json(include_at_risk_populations, include_released_only, do_not_download_from_synapse):
    logging.disable(logging.DEBUG)

    # map: HTAN center names to HTAN IDs
    htan_centers = {
        "HTAN HTAPP": "hta1",
        "PCAPP Pilot Project": "hta2",
        "HTAN BU": "hta3",
        "HTAN CHOP": "hta4",
        "HTAN DFCI": "hta5",
        "HTAN Duke": "hta6",
        "HTAN HMS": "hta7",
        "HTAN MSK": "hta8",
        "HTAN OHSU": "hta9",
        "HTAN Stanford": "hta10",
        "HTAN Vanderbilt": "hta11",
        "HTAN WUSTL": "hta12",
        "HTAN TNP SARDANA": "hta13",
        "HTAN TNP - TMA": "hta14",
        "HTAN SRRS": "hta15"
    }


    # load schematic config
    schematic.CONFIG.load_config('./config-htan.yml')

    # instantiate synapse client
    syn = synapseclient.Synapse()

    try:
        syn.login(rememberMe = True)
    except synapseclient.core.exceptions.SynapseNoCredentialsError:
        print("Please make sure the 'username' and 'password'/'api_key' values have been filled out in .synapseConfig.")
    except synapseclient.core.exceptions.SynapseAuthenticationError:
        print("Please make sure the credentials in the .synapseConfig file are correct.")

    # instantiate storage assets (e.g. master fileview specified in config)
    syn_store = SynapseStorage()

    # get a list of all files in asset store
    all_files = syn_store.storageFileviewTable

    # download latest schema
    schema_filename = "HTAN.jsonld"
    url = "https://raw.githubusercontent.com/ncihtan/data-models/main/HTAN.model.jsonld"
    #schema_file = wget.download(url, out = schema_filename)

    se = SchemaExplorer()

    se.load_schema(url)

    # get manifest files and group by parent id
    synapse_storage_manifest_files = all_files[all_files["name"].str.contains("synapse_storage_manifest")]
    synapse_storage_manifest_files_grouped_by_parent = synapse_storage_manifest_files.groupby(["parentId"])

    # if synapse_storage_manifest.csv is the only file keep it,
    # otherwise keep ALL OTHER files except synapse_storage_manifest.csv
    metadata_manifests_newest_per_folder = synapse_storage_manifest_files[
        synapse_storage_manifest_files.apply(
            lambda f:
                "synapse_storage_manifest_" in f["name"]
                or
                synapse_storage_manifest_files_grouped_by_parent.groups[f["parentId"]].size == 1,
            axis=1
        )
    ]

    #  group them by project (i.e. research center/atlas)
    metadata_manifests_per_project = metadata_manifests_newest_per_folder[["id", "parentId", "projectId"]].groupby(["projectId"])

    # portal data schema skeleton
    portal_data = {
        "atlases": []
    }

    if include_released_only:
        released_entities_df = pd.read_csv("entities_v6_0.csv")
        include_release_ids = set(released_entities_df['entityId'])

    # store all metadata synapse ids for downloading submitted metadata directly
    portal_metadata = {}

    released_metadata_df = pd.read_csv("metadata_v6_0.csv")
    released_synapse_metadata_ids = set(released_metadata_df['Manifest_Id'])

    # iterate over projects; map to HTAN ID, inspect metadata and add to portal JSON dump
    for project_id, dataset_group in metadata_manifests_per_project:
        atlas = {}
        center = syn.get(project_id, downloadFile = False).name
        if not center in htan_centers:
            #do not include project outside official HTAN centers (e.g. test ones)
            continue
        center_id = htan_centers[center]

        atlas["htan_id"] = center_id.upper()

        atlas["htan_name"] = center

        logging.info("ATLAS: " + center)

        datasets = dataset_group.to_dict("records")

        for dataset in datasets:
            # only consider metadata currently in release
            if dataset["id"] not in released_synapse_metadata_ids:
                continue

            manifest_location = "./tmp/" + center_id + "/" + dataset["id"] + "/"
            manifest_path = manifest_location + "synapse_storage_manifest.csv"

            released_record = released_metadata_df[released_metadata_df["Manifest_Id"] == dataset["id"]].sort_values("Manifest_Version",ascending=False).iloc[0]

            if not do_not_download_from_synapse:
                if dataset["id"] == "syn25619062":
                    # TODO: Use harcoded version for HMS b/c: https://github.com/ncihtan/data-release-tracker/issues/407
                    syn.get(dataset["id"], downloadLocation=manifest_location, version=6, ifcollision="overwrite.local")
                elif pd.isna(released_record["Manifest_Version"]):
                    syn.get(dataset["id"], downloadLocation=manifest_location, ifcollision="overwrite.local")
                else:
                    syn.get(dataset["id"], version=released_record["Manifest_Version"], downloadLocation=manifest_location, ifcollision="overwrite.local")
                # files can be named *.csv
                # TODO: would be better of syn.get can take output file argument
                os.rename(glob.glob(manifest_location + "*.csv")[0], manifest_path)

            manifest_df = pd.read_csv(manifest_path)

            # data type/schema component
            try:
                component = manifest_df['Component'].values[0]
            except KeyError:
                logging.error("Manifest data unexpected: " + manifest_path + " no Component column")
                continue
            except IndexError:
                logging.error("Manifest data unexpected: " + manifest_path + " " + str(manifest_df['Component'].values))
                continue

            # skip components that are NA
            if pd.isna(component):
                logging.error("Component is N/A: " + manifest_path + " " + str(manifest_df.values[0]))
                continue

            logging.info("Data type: " + component)

            # # exclude HTAPP imaging data for now
            # if center == "HTAN HTAPP" and ("Imaging" in component or "Other" in component or "Bulk" in component):
            #     logging.info("Skipping Imaging and Bulk data for HTAPP (" + component + ")")
            #     continue
            #
            # # exclude HTAPP PML datasets
            # if center == "HTAN HTAPP" and len(manifest_df) > 0 and "Filename" in manifest_df.columns and ("PML" in manifest_df["Filename"].values[0] or "10x" in manifest_df["Filename"].values[0]):
            #     continue

            # get data type schema info
            try:
                schema_info = se.explore_class(component)
            except KeyError:
                logging.error("Component " + component + " does not exist in schema (" + manifest_path)
                continue

            # cap ages <18 and >89 for privacy reasons
            for age_column in CAP_AGE_COLUMNS:
                if age_column in manifest_df.columns and is_numeric_dtype(manifest_df[age_column]):
                    older_than_89 = manifest_df[age_column] > MAX_AGE_IN_DAYS
                    manifest_df.loc[older_than_89, [age_column, "Age Is Obfuscated"]] = [MAX_AGE_IN_DAYS, True]
                    # Keep 0 as is:
                    # For some cases e.g. precancers, this field is not applicable.
                    # Centers use 0 as an opt-out value to get around the requirement.
                    younger_than_18 = (manifest_df[age_column] > 0) & (manifest_df[age_column] < MIN_AGE_IN_DAYS)
                    manifest_df.loc[younger_than_18, [age_column, "Age Is Obfuscated"]] = [MIN_AGE_IN_DAYS, True]

            # manifest might not have all columns from the schema, so add
            # missing columns
            schema_columns = [se.explore_class(c)['displayName'] for c in schema_info['dependencies']]
            for c in schema_columns:
                if c not in manifest_df.columns:
                    manifest_df[c] = len(manifest_df.values) * [np.nan]

            # use schema's column order and add synapse id to required columns
            # if it exists
            # TODO: schema_columns can contain duplicates for whatever reason.
            # But if one gets rid of them it messes up column indexes
            # downstream
            column_order = schema_columns

            # Uuid is now called Id, but ofc there are still some old files with
            # Uuid column name 😭
            # see Jira ticket: https://sagebionetworks.jira.com/browse/HTAN-224
            if 'Uuid' in manifest_df.columns:
                manifest_df = manifest_df.rename(columns={"Uuid":"Id"})

            if 'entityId' not in schema_columns and 'entityId' in manifest_df.columns:
                column_order += ['entityId']
            if 'Id' not in schema_columns and 'Id' in manifest_df.columns:
                column_order += ['Id']
            if 'Assay Type' not in schema_columns and 'Assay Type' in manifest_df.columns:
                column_order += ['Assay Type']
            if 'HTAN Parent Biospecimen ID' not in schema_columns and 'HTAN Parent Biospecimen ID' in manifest_df.columns:
                column_order += ['HTAN Parent Biospecimen ID']

            # add columns not in the schema
            schemaless_columns = []
            for c in manifest_df.columns:
                if c not in column_order:
                    schemaless_columns += [c]
            schemaless_columns.sort()
            column_order += schemaless_columns

            manifest_df = manifest_df[column_order]

            # data type schema label (TODO: use context from uri)
            data_schema = "bts:" + component

            # get records in this dataset
            record_list = []

            # ignore files without both synapse id and Id
            if "entityId" not in manifest_df.columns and "Id" not in manifest_df.columns:
                logging.error("Manifest data unexpected: " + manifest_path + " no entityId or Id column")
                continue

            if "entityId" not in manifest_df.columns:
                rows_without_both_synapse_id_and_id = pd.isnull(manifest_df["Id"]) & pd.isnull(manifest_df["Id"])
            elif "Id" not in manifest_df.columns and "Id" not in manifest_df.columns:
                rows_without_both_synapse_id_and_id = pd.isnull(manifest_df["entityId"])
            else:
                rows_without_both_synapse_id_and_id = pd.isnull(manifest_df[["entityId", "Id"]]).all(1)

            number_of_rows_without_both_synapse_id_and_id = rows_without_both_synapse_id_and_id.sum()

            if number_of_rows_without_both_synapse_id_and_id > 0:
                logging.error("skipping {} rows without synapse id in {}" .format(number_of_rows_without_both_synapse_id_and_id, manifest_path))
                manifest_df = manifest_df[~rows_without_both_synapse_id_and_id].copy()

            # replace race for protected populations
            if not include_at_risk_populations and 'Race' in manifest_df:
                manifest_df['Race'] = manifest_df['Race']\
                    .str.replace('american indian or alaska native', 'Not Reported')\
                    .str.replace('native hawaiian or other pacific islander', 'Not Reported')

            # remove any duplicates
            if "HTAN Partipant ID" in manifest_df.columns:
                duplicates = manifest_df.duplicated("HTAN Participant ID")
                if duplicates.any():
                    logging.error("Removing duplicates in " + manifest_path + ": " + str(manifest_df.loc[duplicates]))
                    manifest_df = manifest_df.drop_duplicates(subset='HTAN Participant ID')

            # TODO: exclude Stanford proteomics data temporarily due to linking (is this still necessary?)
            # issues
            if center == "HTAN Stanford" and "Other" in component and len(manifest_df) > 0 and "proteomics" in manifest_df['Filename'].values[0]:
                continue

            # only include released data
            if include_released_only and "entityId" in manifest_df.columns:
                if component in MANIFESTS_WITHOUT_ENTITY_ID:
                    pass
                else:
                    if 'Filename' in manifest_df.columns:
                        manifest_df = manifest_df[
                            manifest_df["entityId"].isin(include_release_ids)
                        ].copy()
                    else:
                        manifest_df = manifest_df[manifest_df["entityId"].isin(include_release_ids)].copy()


            if len(manifest_df) == 0:
                continue

            # add metadata file
            # TODO: note that metadata from excluded images could still be in
            # the raw manifest files, so numItems might be bigger
            center_metadata = {"component": component, "synapseId":dataset["id"],"numItems":len(manifest_df)}
            try:
                portal_metadata[center_id.upper()] += [center_metadata]
            except KeyError:
                portal_metadata[center_id.upper()] = [center_metadata]
            # store normalized metadata for export
            # result is manually uploaded to surge.sh (TODO: find a better way)
            os.makedirs("metadata", exist_ok=True)
            manifest_df.to_csv("metadata/{}.csv".format(dataset["id"]), index=False)


            for i, row in manifest_df.iterrows():
                record = {"values":[v if not pd.isna(v) else None for v in list(row.values)]}

                record_list.append(record)

            # add records to atlas
            if data_schema in atlas:
                # there are multiple metadata files for this one data type
                atlas[data_schema]["record_list"] = atlas[data_schema]["record_list"] + record_list
            else:
                atlas[data_schema] = {
                    "data_schema": data_schema,
                    "column_order": column_order,
                    "record_list": record_list
                }

        # add atlas to portal JSON
        portal_data["atlases"].append(atlas)


    # dump data portal JSON
    with open("./../public/syn_data.json", "w") as m_f:
        json.dump(portal_data, m_f, indent = 4)

    with open("./../data/syn_metadata.json", "w") as m_f:
        json.dump(portal_metadata, m_f, indent = 4)

    logging.info("Data fetch successful. Please run `yarn processSynapseData` in the main project directory to complete the data update.")


if __name__ == '__main__':
    generate_json()