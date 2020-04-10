const _ = require(`lodash`);
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

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
      return "Cosmic";
    },
  };

  const name = { type: "String!", resolve: createParentFieldResolver(`title`) };

  const createSlugField = (type) => {
    return {
      type: `String!`,
      resolve: (source, args, context) => {
        return `/cosmicjs/${type}/${getParent(source, context).slug}`;
      },
    };
  };

  actions.createTypes([
    schema.buildObjectType({
      name: `CosmicjsProductsAdapted`,
      interfaces: [`Node`, `Product`],
      fields: {
        name,
        source,
        slug: createSlugField(`product`),

        description: {
          type: "String!",
          resolve: createParentFieldResolver(`content`),
        },
        photo: {
          type: `File`,
          resolve: async (source, args, context, info) => {
            const parent = getParent(source, context);
            if (!parent || !parent.fields) {
              return null;
            }

            const localFile = context.nodeModel.getNodeById({
              id: parent.fields.photoId,
            });
            return localFile;
          },
        },
        categories: {
          type: `[Category]!`,
          resolve: (source, args, context, info) => {
            const parent = getParent(source, context);
            if (!parent || !parent.metadata || !parent.metadata.categories) {
              return [];
            }

            const CosmicCategories = context.nodeModel.getNodesByIds({
              ids: parent.metadata.categories.map((c) => c._id),
            });

            const categories = context.nodeModel.getNodesByIds({
              ids: _.flatten(CosmicCategories.map((node) => node.children)),
              type: "CosmicjsCategoriesAdapted",
            });

            return categories;
          },
        },
      },
    }),
    schema.buildObjectType({
      name: `CosmicjsCategoriesAdapted`,
      interfaces: [`Node`, `Category`],
      fields: {
        name,
        source,
        slug: createSlugField(`category`),

        products: {
          type: `[Product]!`,
          resolve: async (source, args, context, info) => {
            const nodes = await context.nodeModel.runQuery(
              {
                query: {
                  filter: {
                    categories: { elemMatch: { id: { eq: source.id } } },
                  },
                },
                type: `CosmicjsProductsAdapted`,
              },
              {
                connectionType: `CosmicjsProductsAdapted`,
              }
            );

            return nodes || [];
          },
        },
      },
    }),
  ]);
};

exports.onCreateNode = async ({
  node,
  actions,
  getNode,
  getCache,
  createNodeId,
}) => {
  if (
    node.internal.type === `CosmicjsProducts` ||
    node.internal.type === `CosmicjsCategories`
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

    if (
      node.internal.type === `CosmicjsProducts` &&
      node.metadata &&
      node.metadata.photo
    ) {
      const { url } = node.metadata.photo;

      const imageNode = await createRemoteFileNode({
        url,
        parentNodeId: node.id,
        getCache,

        createNode: actions.createNode,
        createNodeId,
      });

      actions.createParentChildLink({
        parent: node,
        child: imageNode,
      });

      actions.createNodeField({
        node,
        name: "photoId",
        value: imageNode.id,
      });
    }
  }
};
