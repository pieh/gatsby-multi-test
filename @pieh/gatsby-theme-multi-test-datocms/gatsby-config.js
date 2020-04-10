const isProd = process.env.NODE_ENV === "production";

module.exports = ({ apiToken }) => {
  return {
    plugins: [
      {
        resolve: `@gatsbyjs/gatsby-source-datocms`,
        options: {
          apiToken,
          disableLiveReload: isProd,
        },
      },
    ],
  };
};
