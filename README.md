# HTAN Data Portal

This repo contains the code for the [Human Tumor Atlas Network Data Portal](https://humantumoratlas.org/)

## Framework

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/zeit/next.js/tree/canary/packages/create-next-app)

## Backend

All data is coming from [Synapse](https://www.synapse.org/). We have a Python script that generates a JSON file that contains all the metadata. There is currently no backend, it's a fully static site i.e. all filtering happens on the frontend.

### Update Data Files

#### Update release information

Only certain metadata rows and data files on Synapse are released. We keep
track of this information in Google BigQuery. One can get the latest dump of
that using these commands (requires access to the htan-dcc google project):

```bash
cd data
bq extract --destination_format CSV released.entities_v6_1 gs://htan-release-files/entities_v6_1.csv
bq extract --destination_format CSV released.metadata_v6_1 gs://htan-release-files/metadata_v6_1.csv
bq extract --destination_format NEWLINE_DELIMITED_JSON released.cds_drs_mapping_V2 gs://htan-release-files/cds_drs_mapping.json
gsutil cp gs://htan-release-files/entities_v6_1.csv entities_v6_1.csv
gsutil cp gs://htan-release-files/metadata_v6_1.csv metadata_v6_1.csv
gsutil cp gs://htan-release-files/cds_drs_mapping.json cds_drs_mapping.json
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

At the moment all data is hosted on S3 for producion. This is because there is a file size limit for vercel. To update it:

1. gzip file (note that it's already gzipped in the repo)
2. Remove ".gz" extension so it's just json and rename to include current date in filename.
3. Upload file to s3 bucket "htanfiles" (part of schultz AWS org)
4. The file needs two meta settings:  `Content-Encloding=gzip` and `Content-Type=application/json`
5. Once file is up, change path in
`/lib/helpers.ts`

Or step 1-4 as command:

```bash
MY_AWS_PROFILE=inodb
aws s3 cp processed_syn_data.json.gz s3://htanfiles/processed_syn_data_$(date "+%Y%m%d_%H%M").json --profile=${MY_AWS_PROFILE} --content-encoding gzip --content-type=application/json --acl public-read
aws s3 cp metadata_gzip s3://htanfiles/metadata --recursive --profile=${MY_AWS_PROFILE} --content-encoding gzip --content-type=text/csv --acl public-read
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
