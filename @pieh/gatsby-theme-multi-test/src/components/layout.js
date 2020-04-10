import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";

export const Layout = ({ children }) => {
  const {
    allProduct: { distinct: sources },
  } = useStaticQuery(graphql`
    {
      allProduct {
        distinct(field: source)
      }
    }
  `);

  return (
    <>
      <header>
        <p>
          <Link to="/">Multi test</Link>
        </p>
      </header>
      <main>{children}</main>
      <footer>
        <p>Created with Gatsby, {sources.join(`, `)} and ❤️</p>
        <small>
          <a href="https://motherfuckingwebsite.com/" rel="noreferrer noopener">
            Styling inspiration
          </a>{" "}
          (still have to work on JavaScript part!)
        </small>
      </footer>
    </>
  );
};
