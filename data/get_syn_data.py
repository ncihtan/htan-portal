import pandas as pd
import wget
import json
import logging

import synapseclient

import schematic 
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
                    "HTAN TNP SARDANA": "hta13",
                    "HTAN TNP - TMA": "hta14"
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


    data_schemas = []

    # iterate over projects; map to HTAN ID, inspect metadata and add to portal JSON dump
    for project_id, dataset_group in metadata_manifests:
        atlas = {}
        center = syn.get(project_id, downloadFile = False).name
        if not center in htan_centers:
            #do not include project outside official HTAN centers (e.g. test ones)
            continue
        center_id = htan_centers[center]

        atlas["htan_id"] = center_id
        atlas["htan_name"] = center

        logging.info("ATLAS: " + center)

        datasets = dataset_group.to_dict("records")

        for dataset in datasets:
            manifest_location = "./tmp/"
            manifest_path = manifest_location + "synapse_storage_manifest.csv"
            syn.get(dataset["id"], downloadLocation=manifest_location, ifcollision="overwrite.local")
            
            manifest_data = pd.read_csv(manifest_path).to_numpy()

            # data type/schema component
            component = manifest_data[0][0]
        
            logging.info("Data type: " + component)
           
            # get data type schema info 
            schema_info = se.explore_class(component)
             
            # data type schema label (TODO: use context from uri)
            data_schema = "bts:" + component

            # get records in this dataset 
            record_list = []
            
            for values in manifest_data:
               
                record = {"values":list(values)}
                record_list.append(record)

            # add records to atlas
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
    with open("./syn_data.json", "w") as m_f:
        json.dump(portal_data, m_f, indent = 4)
