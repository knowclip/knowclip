import React from "react"
import css from "./header.module.css"
import cn from "classnames"
import Link from 'next/link'

const Header = ({ siteTitle }: { siteTitle: string }) => (
  <header className={css.container}>
    <h1 className={cn(css.heading, css.filmBackground)}>
      <img src="/static/lightbulb.png" className={css.lightbulbIcon} alt="" />

      <Link
        href="/" passHref>
        <a
          style={{
            color: `white`,
            textDecoration: `none`,
          }}
        >
          {siteTitle}
        </a>
      </Link>
    </h1>
  </header>
)

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
