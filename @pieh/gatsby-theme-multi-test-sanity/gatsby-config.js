const isProd = process.env.NODE_ENV === "production";

module.exports = ({ projectId, dataset, token }) => {
  return {
    plugins: [
      {
        resolve: "gatsby-source-sanity",
        options: {
          projectId,
          dataset,
          token: !isProd ? token : undefined,
          watchMode: !isProd,
          overlayDrafts: !isProd,
        },
      },
    ],
  };
};
