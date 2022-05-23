export function getAllPublicationIds() {
    // TODO: we need to read this from service
    const ids = ['brca_hta9_htan_2022'];

    // Returns an array that looks like this:
    // [
    //   {
    //     params: {
    //       id: 'brca_hta9_htan_2022'
    //     }
    //   },
    //   {
    //     params: {
    //       id: 'other_publication'
    //     }
    //   }
    // ]

    return ids.map((id) => {
        return {
            params: {
                id,
            },
        };
    });
}

export async function getPublicationData(id: string) {
    // TODO: fetch publication data
    const publicationData = {
        title: 'publication title',
        description: 'publication description',
    };
    // Combine the data with the id
    return {
        id,
        publicationData,
    };
}
