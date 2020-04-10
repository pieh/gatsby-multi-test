const _ = require(`lodash`);

exports.createSchemaCustomization = ({ actions, schema }) => {
  const getParent = (node, context) => {
    return context.nodeModel.getNodeById({
      id: node.parent,
    });
  };

  const createParentFieldResolver = (field) => (source, args, context) => {
    return getParent(source, context)[field];
  };

  const source = {
    type: "String!",
    resolve: () => {
      return "Contentful";
    },
  };

  const name = { type: "String!", resolve: createParentFieldResolver(`name`) };

  const createSlugField = (type) => {
    return {
      type: `String!`,
      resolve: (source, args, context) => {
        return `/contentful/${type}/${getParent(source, context).slug}`;
      },
    };
  };

  actions.createTypes([
    schema.buildObjectType({
      name: `ContentfulProductAdapted`,
      interfaces: [`Node`, `Product`],
      fields: {
        name,
        source,
        slug: createSlugField(`product`),

        description: {
          type: "String!",
          resolve: createParentFieldResolver(`description`),
        },
        photo: {
          type: `File`,
          resolve: (source, args, context, info) => {
            const parent = getParent(source, context);
            const asset = context.nodeModel.getNodeById({
              id: parent.photo___NODE,
            });
            const localFile = context.nodeModel.getNodeById({
              id: asset.localFile___NODE,
            });
            return localFile;
          },
        },
        categories: {
          type: `[Category]!`,
          resolve: (source, args, context, info) => {
            const parent = getParent(source, context);
            const contentfulCategories = context.nodeModel.getNodesByIds({
              ids: parent.categories___NODE,
            });

            const categories = context.nodeModel.getNodesByIds({
              ids: _.flatten(contentfulCategories.map((node) => node.children)),
              type: "ContentfulCategoryAdapted",
            });

            return categories;
          },
        },
      },
    }),
    schema.buildObjectType({
      name: `ContentfulCategoryAdapted`,
      interfaces: [`Node`, `Category`],
      fields: {
        name,
        source,
        slug: createSlugField(`category`),

        products: {
          type: `[Product]!`,
          resolve: async (source, args, context, info) => {
            // seems that there is a bug in contentful plugin so can't use plugins back refs - see commented out code
            // good news - this can be pretty much reused with plugins that don't have back refs
            const nodes = await context.nodeModel.runQuery(
              {
                query: {
                  filter: {
                    categories: { elemMatch: { id: { eq: source.id } } },
                  },
                },
                type: `ContentfulProductAdapted`,
              },
              {
                connectionType: `ContentfulProductAdapted`,
              }
            );

            return nodes || [];

            // const parent = getParent(source, context);
            // const contentfulProducts = context.nodeModel.getNodesByIds({
            //   ids: parent.product___NODE,
            // });
            // const products = context.nodeModel.getNodesByIds({
            //   ids: _.flatten(contentfulProducts.map((node) => node.children)),
            //   type: "ContentfulProductAdapted",
            // });

            // return products;
          },
        },
      },
    }),
  ]);
};

exports.onCreateNode = ({ node, actions }) => {
  if (
    node.internal.type === `ContentfulProduct` ||
    node.internal.type === `ContentfulCategory`
  ) {
    const child = {
      id: `${node.id} > e`,
      parent: node.id,
      internal: {
        type: `${node.internal.type}Adapted`,
        contentDigest: node.internal.contentDigest,
      },
    };
    actions.createNode(child);
    actions.createParentChildLink({
      parent: node,
      child,
    });
  }
};
