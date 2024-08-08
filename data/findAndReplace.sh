gsed -i 's/scatacseq/scATAC-seq/g' public/syn_data.json &&
gsed -i 's/BulkWES/BulkDNA/g' public/syn_data.json &&
gsed -i 's/BulkWES/BulkDNA/g' data/syn_metadata.json &&
gsed -i 's/"Database Search Result"/"LC-MS3"/g' public/syn_data.json &&
gsed -i 's/"Protein Database"/"LC-MS3"/g' public/syn_data.json &&
gsed -i 's/t-CyCIF/CyCIF/g' public/syn_data.json &&
gsed -i 's/t-CyCIF/CyCIF/g' data/imaging_assay_type_level2.csv &&
gsed -i 's/Level3Segmentation/Level3/g' public/syn_data.json &&
gsed -i 's/Level3Segmentation/Level3/g' data/syn_metadata.json &&
gsed -i 's/"SRRSBiospecimen"/"Biospecimen"/g' public/syn_data.json &&
gsed -i 's/"SRRSImagingLevel2"/"ImagingLevel2"/g' public/syn_data.json &&
gsed -i 's/"scRNA-Seq"/"scRNA-seq"/g' public/syn_data.json &&
gsed -i 's/"RPPA level2"/"RPPA"/g' public/syn_data.json &&
gsed -i 's/"exseq"/"ExSEQ"/g' public/syn_data.json &&
gsed -i 's/"ExSeq"/"ExSEQ"/g' public/syn_data.json &&
gsed -i 's/"10XGenomicsXeniumISSExperiment"/"10XXeniumISS"/g' public/syn_data.json &&
gsed -i 's/"10XGenomicsXeniumISSExperiment"/"10XXeniumISS"/g' data/syn_metadata.json