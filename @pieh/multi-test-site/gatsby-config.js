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
      },
    },
  ],
};
