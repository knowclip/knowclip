import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import Image from "./lightbulb"
import css from "./header.module.css"
import cn from "classnames"

const Header = ({ siteTitle }) => (
  <header className={css.container}>
    <h1 className={cn(css.heading, css.filmBackground)}>
      <Image />

      <Link
        to="/"
        style={{
          color: `white`,
          textDecoration: `none`,
        }}
      >
        {siteTitle}
      </Link>
    </h1>
  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
