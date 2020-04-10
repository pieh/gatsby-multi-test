import React from "react";
import { Link, graphql } from "gatsby";
import Image from "gatsby-image";
import { Layout } from "../components/layout";

const ProductPage = ({ data, pageContext }) => {
  const {
    product: {
      name,
      categories,
      photo: {
        childImageSharp: { fixed: photo },
      },
    },
  } = data;

  return (
    <Layout>
      <h1>{name}</h1>
      <Image fixed={photo} alt={name} />
      <h2>Categories</h2>
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

export default ProductPage;

export const query = graphql`
  query($id: String!) {
    product(id: { eq: $id }) {
      name
      photo {
        childImageSharp {
          fixed(width: 400, height: 200, fit: INSIDE) {
            ...GatsbyImageSharpFixed_withWebp
          }
        }
      }
      categories {
        name
        slug
        source
      }
    }
  }
`;
