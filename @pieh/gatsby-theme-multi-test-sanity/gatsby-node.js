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
      return "Sanity";
    },
  };

  const name = { type: "String!", resolve: createParentFieldResolver(`name`) };

  const createSlugField = (type) => {
    return {
      type: `String!`,
      resolve: (source, args, context) => {
        const sanitySlug = getParent(source, context).slug;
        if (!sanitySlug) {
          return "wat";
        }
        return `/sanity/${type}/${sanitySlug.current}`;
      },
    };
  };

  actions.createTypes([
    schema.buildObjectType({
      name: `SanityProductAdapted`,
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

            const sanityCategories = context.nodeModel.getNodesByIds({
              ids: parent.categories.map((c) => c._ref),
            });

            const categories = context.nodeModel.getNodesByIds({
              ids: _.flatten(sanityCategories.map((node) => node.children)),
              type: "SanityCategoryAdapted",
            });

            return categories;
          },
        },
      },
    }),
    schema.buildObjectType({
      name: `SanityCategoryAdapted`,
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
                type: `SanityProductAdapted`,
              },
              {
                connectionType: `SanityProductAdapted`,
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
    node.internal.type === `SanityProduct` ||
    node.internal.type === `SanityCategory`
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

    console.log("Sanity wat");
    console.log(node);

    if (
      node.internal.type === `SanityProduct` &&
      node.photo &&
      node.photo.asset
    ) {
      const assetNode = getNode(node.photo.asset._ref);
      const { url } = assetNode;

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
