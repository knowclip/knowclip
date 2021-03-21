/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { PropsWithChildren } from "react"

import Head from 'next/head'
import Header from "./header"
import Footer from "./Footer"
import css from "./layout.module.css"

const Layout = ({ children, title = '' }: PropsWithChildren<{ title?: string }>) => {

  return (
    <>
      <Head>
        <title>{title ? `${title} | ` : ''}Knowclip | The media player for learning languages</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400&display=swap" rel="stylesheet"></link>
        <meta name="description" content="Transform any video or audio file into effective language-learning materials." />
      </Head>
      <Header siteTitle="Knowclip" />
      <main className={css.main}>{children}</main>
      <Footer className={css.footer} />
    </>
  )
}

export default Layout
