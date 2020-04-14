const _ = require(`lodash`);
const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

exports.createSchemaCustomization = ({
  actions,
  schema,
  getNode,
  getNodes,
  store,
}) => {
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
            const t = getNode(parent.fields.photoId);
            const nodes = getNodes();
            const state = store.getState();
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
  const b = 4;
  if (
    node.internal.type === `DatoCmsProduct` ||
    node.internal.type === `DatoCmsCategory`
  ) {
    console.log("[dato-cms] Running onCreateNode", node.id);
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

      console.log(`[dato-cms] Downloading ${url}`);

      const imageNode = await createRemoteFileNode({
        url,
        parentNodeId: node.id,
        getCache,

        createNode: actions.createNode,
        createNodeId,
      });

      // workaround bug in createRemoteFileNode - it store created node objects
      // in internal cache, but doesn't track if nodes were garbage collected
      // because of that I need to make sure that this node actually exists before trying
      // to use it
      if (!getNode(imageNode.id)) {
        delete node.internal.owner;
        createNode(node, {
          name: `gatsby-source-filesystem`,
        });
      }

      actions.createParentChildLink({
        parent: node,
        child: imageNode,
      });

      actions.createNodeField({
        node,
        name: "photoId",
        value: imageNode.id,
      });

      console.log(`[dato-cms] Downloaded ${url}`);
      // console.log('stuff')
    }
    console.log("[dato-cms] Ran onCreateNode", node.id);
  }
};
