import React from "react";
import { Link, graphql } from "gatsby";
import { Layout } from "../components/layout";

const IndexPage = ({ data }) => {
  const {
    allCategory: { nodes: categories },
  } = data;

  return (
    <Layout>
      <h1>Categories</h1>
      <ul>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link to={category.slug}>
              {category.name} (from {category.source})
            </Link>
          </li>
        ))}
      </ul>
    </Layout>
  );
};

export default IndexPage;

export const query = graphql`
  {
    allCategory {
      nodes {
        name
        slug
        source
      }
    }
  }
`;
