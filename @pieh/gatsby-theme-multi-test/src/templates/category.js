import React from "react";
import { Link, graphql } from "gatsby";

import { Layout } from "../components/layout";

const CategoryPage = ({ data }) => {
  const {
    category: { name, products },
  } = data;

  return (
    <Layout>
      <h1>{name}</h1>
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.slug}>
            <Link to={product.slug}>
              {product.name} (from {product.source})
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default CategoryPage;

export const query = graphql`
  query($id: String!) {
    category(id: { eq: $id }) {
      name
      products {
        name
        slug
        source
      }
    }
  }
`;
