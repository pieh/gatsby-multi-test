module.exports = ({ bucketSlug, read_key }) => {
  return {
    plugins: [
      {
        resolve: `gatsby-source-cosmicjs`,
        options: {
          bucketSlug, // Get this value in Bucket > Settings
          objectTypes: [`products`, `categories`],
          // If you have enabled read_key to fetch data (optional).
          apiAccess: {
            read_key, // Get this value in Bucket > Settings
          },
          localMedia: false, // Download media locally for gatsby image (optional)
        },
      },
    ],
  };
};
