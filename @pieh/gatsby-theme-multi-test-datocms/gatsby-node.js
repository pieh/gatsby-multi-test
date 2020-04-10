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
      return "DatoCMS";
    },
  };

  const name = { type: "String!", resolve: createParentFieldResolver(`name`) };

  const createSlugField = (type) => {
    return {
      type: `String!`,
      resolve: (source, args, context) => {
        return `/datocms/${type}/${getParent(source, context).slug}`;
      },
    };
  };

  actions.createTypes([
    schema.buildObjectType({
      name: `DatoCmsProductAdapted`,
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
            const datoCMSCategories = context.nodeModel.getNodesByIds({
              ids: parent.categories___NODE,
            });

            const categories = context.nodeModel.getNodesByIds({
              ids: _.flatten(datoCMSCategories.map((node) => node.children)),
              type: "DatoCmsCategoryAdapted",
            });

            return categories;
          },
        },
      },
    }),
    schema.buildObjectType({
      name: `DatoCmsCategoryAdapted`,
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
                type: `DatoCmsProductAdapted`,
              },
              {
                connectionType: `DatoCmsProductAdapted`,
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

exports.onCreateNode = async ({
  node,
  actions,
  getNode,
  getCache,
  createNodeId,
}) => {
  if (
    node.internal.type === `DatoCmsProduct` ||
    node.internal.type === `DatoCmsCategory`
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

    if (node.internal.type === `DatoCmsProduct` && node.photo) {
      const assetNode = getNode(node.photo.uploadId___NODE);
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

      // debugger;
    }
  }
};
