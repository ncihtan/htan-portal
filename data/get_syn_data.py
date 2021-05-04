import pandas as pd
import numpy as np
import wget
import json
import logging

import synapseclient

import schematic # for now install from here: https://github.com/Sage-Bionetworks/schematic/tree/develop
from schematic import CONFIG
from schematic.store.synapse import SynapseStorage
from schematic.schemas.explorer import SchemaExplorer



if __name__ == '__main__':

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
                    # exclude TNPs for now
                    # "HTAN TNP SARDANA": "hta13",
                    # "HTAN TNP - TMA": "hta14"
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
    url = "https://raw.githubusercontent.com/ncihtan/schematic/main/data/schema_org_schemas/HTAN.jsonld"
    #schema_file = wget.download(url, out = schema_filename)

    se = SchemaExplorer()

    se.load_schema(url)

    # get all manifests grouped by project (i.e. research center/atlas)
    metadata_manifests = all_files[all_files["name"].str.contains("synapse_storage_manifest")][["id", "parentId", "projectId"]].groupby(["projectId"])

    # portal data schema skeleton
    portal_data = {
                    "atlases":[],
                    "schemas":[]
    }

    # store all metadata synapse ids for downloading submitted metadata
    # directly
    portal_metadata = {}

    data_schemas = []

    # iterate over projects; map to HTAN ID, inspect metadata and add to portal JSON dump
    for project_id, dataset_group in metadata_manifests:
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
            manifest_location = "./tmp/" + center_id + "/"
            manifest_path = manifest_location + "synapse_storage_manifest.csv"
            syn.get(dataset["id"], downloadLocation=manifest_location, ifcollision="overwrite.local")

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

            # exclude HTAPP imaging data for now
            if center == "HTAN HTAPP" and ("Imaging" in component or "Other" in component):
                logging.info("Skipping Imaging data for HTAPP (" + component + ")")
                continue

            # get data type schema info
            try:
                schema_info = se.explore_class(component)
            except KeyError:
                logging.error("Component " + component + " does not exist in schema (" + manifest_path)
                continue

            # add metadata file
            portal_metadata.setdefault(center_id.upper(), {})[component] = {"synapseId":dataset["id"],"numItems":len(manifest_df)}

            # manifest might not have all columns from the schema, so add
            # missing columns
            schema_columns = [se.explore_class(c)['displayName'] for c in schema_info['dependencies']]
            for c in schema_columns:
                if c not in manifest_df.columns:
                    manifest_df[c] = len(manifest_df.values) * [np.nan]

            # use schema's column order and add synapse id to required columns
            # if it exists
            column_order = schema_columns
            if 'entityId' not in schema_columns and 'entityId' in manifest_df.columns:
                column_order += ['entityId']
            manifest_df = manifest_df[column_order]

            # data type schema label (TODO: use context from uri)
            data_schema = "bts:" + component

            # get records in this dataset
            record_list = []

            for i, row in manifest_df.iterrows():
                record = {"values":[v if not pd.isna(v) else None for v in list(row.values)]}

                record_list.append(record)

            # add records to atlas
            if data_schema in atlas:
                # there are multiple metadata files for this one data type
                atlas[data_schema]["record_list"] = atlas[data_schema]["record_list"] + record_list
            else:
                atlas[data_schema] = {
                                        "data_schema":data_schema,
                                        "record_list":record_list
                }

            # add data schema to JSON if not already there
            if not data_schema in data_schemas:
                data_schemas.append(data_schema)

                schema = {
                            "data_schema":data_schema,
                            "attributes":[]
                }

                # data type attributes from schema
                data_attributes = schema_info["dependencies"]

                # add schema attributes to data portal JSON
                for attribute in data_attributes:
                    attr_info = se.explore_class(attribute)
                    attr_id = "bts:" + attribute
                    attr_name = attr_info["displayName"]
                    attr_desc = attr_info["description"]

                    schema["attributes"].append({
                                            "id":attr_id,
                                            "display_name":attr_name,
                                            "description":attr_desc
                                            })


                # adding synapse ID to schema attributes
                schema["attributes"].append({
                                        "id":"synapseId",
                                        "display_name": "Synapse Id",
                                        "description": "Synapse ID for file"
                                        })

                portal_data["schemas"].append(schema)

        # add atlas to portal JSON
        portal_data["atlases"].append(atlas)


    # dump data portal JSON
    with open("./../public/syn_data.json", "w") as m_f:
        json.dump(portal_data, m_f, indent = 4)

    with open("./../data/syn_metadata.json", "w") as m_f:
        json.dump(portal_metadata, m_f, indent = 4)
