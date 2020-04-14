module.exports = ({ path = `content` }) => {
  return {
    plugins: [
      `gatsby-transformer-json`,
      {
        resolve: "gatsby-source-filesystem",
        options: {
          path,
        },
      },
    ],
  };
};
