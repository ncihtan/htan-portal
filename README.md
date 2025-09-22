# HTAN Data Portal

This repo contains the code for the [Human Tumor Atlas Network Data Portal](https://humantumoratlas.org/)

## Framework

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/zeit/next.js/tree/canary/packages/create-next-app)

## Backend

All data is coming from [Synapse](https://www.synapse.org/). We have a Python script that generates a JSON file that contains all the metadata. There is currently no backend, it's a fully static site i.e. all filtering happens on the frontend.

## Data Updates

| Category             | Update Event                                      | Process                                                                         |
|----------------------|---------------------------------------------------|---------------------------------------------------------------------------------|
| Publication          | HTAN center has new publication                   | Update Publications JSON. Alex has script to generate this                      |
| Tool                 | HTAN center has new tool                          | Update Tools JSON. Add entry manually                                           |
| Data                 | New major or point data release                   | Follow steps in Update Data Files section. Dar'ya manages BigQuery tables       |
| Data Access          | CRDC-GC releases level1-2 data                    | Follow steps in Update Data Files section (particularly crdcgc_drs mapping update) |
| Viewers              | CellXGene releases single cell data               | Update cellxgene viewers JSON. Add entry manually                               |
| Viewers              | New Minerva Viewers generated                     | Adam generates the Minerva viewers. Follow steps in Update Data Files section   |

### Update Data Files

#### Update release information

Only certain metadata rows and data files on Synapse are released. We keep
track of this information in Google BigQuery. One can get the latest dump of
that using these commands (requires access to the htan-dcc google project):

```bash
bq extract --destination_format CSV released.entities_v6_3 gs://htan-release-files/entities_v6_3.csv
bq extract --destination_format CSV released.metadata_v6_3 gs://htan-release-files/metadata_v6_3.csv
bq extract --destination_format NEWLINE_DELIMITED_JSON released.cds_drs_mapping_V2 gs://htan-release-files/crdcgc_drs_mapping.json
gsutil cp gs://htan-release-files/entities_v6_3.csv data/entities_v6_3.csv
gsutil cp gs://htan-release-files/metadata_v6_3.csv data/metadata_v6_3.csv
gsutil cp gs://htan-release-files/crdcgc_drs_mapping.json packages/data-portal-commons/src/assets/crdcgc_drs_mapping.json
```

#### Pull files from Synapse and Process for ingestion

```bash
# Run the script that pulls all the HTAN metadata
# It outputs a JSON in public/syn_data.json and a JSON with links to metadata in data/syn_metadata.json
python get_syn_data.py
cd ..
# Do additional data transformations and generated the processed JSON
yarn run updateData
```

### Export to bucket

At the moment metadata is hosted on S3 for production. To update it:

1. gzip all the files in the metadata directory (Note that these files are not stored in the repo)
2. Remove ".gz" extension from the gzipped files so they're just csv files
3. Upload files to the s3 bucket "htanfiles/metadata" (part of schultz AWS org)
4. The file needs two meta settings:  `Content-Encloding=gzip` and `Content-Type=text/csv`

Or step 1-4 as command:

```bash
MY_AWS_PROFILE=203403084713
MY_AWS_USERNAME=htan_service_account
yarn gzipMetadata 
saml2aws login --force --session-duration=28800 -a ${MY_AWS_PROFILE} --username=${MY_AWS_USERNAME}
aws s3 cp metadata_gzip s3://sc-203403084713-pp-5kti2c6hsoc5c-bucket-qarb8wed4umr/metadata --recursive --profile=${MY_AWS_PROFILE} --content-encoding gzip --content-type=text/csv
```

## Testing

There are currently no automated tests, other than building the project, so be careful when merging to master

## Getting Started

First, make sure you have the latest processed json file:

```bash
yarn gunzip
```

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing any page. The page auto-updates as you edit the file.

## Debugging processSynapseJSON

Add `debugger;` somewhere in the code. Then run:

```bash
node --openssl-legacy-provider ./node_modules/.bin/ncc build --source-map --no-source-map-register  data/processSynapseJSON.ts
```

Followed by:

```bash
node  --inspect-brk dist/index.js
```

Now you can attach to it in e.g. VSCode

## Learn More about Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment

The app is deployed using the [ZEIT Now Platform](https://zeit.co/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
