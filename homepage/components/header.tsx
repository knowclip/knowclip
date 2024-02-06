import React from "react"
import css from "./header.module.css"
import cn from "classnames"
import Link from "next/link"

const Header = ({ siteTitle = "" }: { siteTitle: string }) => (
  <header className={css.container}>
    <h1 className={cn(css.heading, css.filmBackground)}>
      <img src="/lightbulb.png" className={css.lightbulbIcon} alt="" />
      <Link href="/" passHref>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
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

export default Header
