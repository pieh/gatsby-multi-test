require(`dotenv`).config({
  path: `.env.${process.env.NODE_ENV}`,
});
require("dotenv").config();

module.exports = {
  plugins: [
    `@pieh/gatsby-theme-multi-test`,
    {
      resolve: `@pieh/gatsby-theme-multi-test-contentful`,
      options: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
        host: process.env.CONTENTFUL_HOST,
      },
    },
    {
      resolve: `@pieh/gatsby-theme-multi-test-datocms`,
      options: {
        apiToken: process.env.DATO_API_TOKEN,
      },
    },
    {
      resolve: `@pieh/gatsby-theme-multi-test-cosmicjs`,
      options: {
        bucketSlug: process.env.COSMIC_BUCKET,
        read_key: process.env.COSMIC_READ_KEY,
      },
    },
  ],
};
