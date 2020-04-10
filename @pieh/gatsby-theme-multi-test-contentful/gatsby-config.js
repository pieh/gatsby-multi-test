module.exports = ({ spaceId, accessToken, host }) => {
  return {
    plugins: [
      {
        resolve: `gatsby-source-contentful`,
        options: {
          spaceId,
          accessToken,
          host,
          downloadLocal: true,
        },
      },
    ],
  };
};
