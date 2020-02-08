import React from "react"
import { Link } from "gatsby"
import css from "./index.module.css"

import Layout from "../components/layout"
import SEO from "../components/seo"

import packageJson from "../../../package.json"

// const versionNumber = JSON.parse(packageJson).version

const IndexPage = () => (
  <Layout>
    <SEO title="Learn languages for free through native media" />
    <section className={css.intro}>
      <h2 className={css.heading}>
        Learn a new language by enjoying <strong>native media</strong>.
      </h2>
      <p>
        Knowclip is a free desktop app that lets you turn any media file on your
        computer into <strong>effective language-learning materials</strong>.
      </p>
    </section>

    <div className={css.middle}>
      <section className={css.steps}>
        <p>Its clean and simple UI makes it easy to</p>
        <ol>
          <li>grab sentences straight out of your media</li>
          <li>make media-rich flashcards</li>
          <li>
            instantly bundle them into a ready-to-use{" "}
            <a href="#anki">Anki deck</a>.
          </li>
        </ol>
      </section>
      <iframe
        className={css.demoVideo}
        title="demo-video"
        width="560"
        height="315"
        src="https://www.youtube-nocookie.com/embed/kFEfS8dyKQ8"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>

    <h4 className={css.downloadHeading}>Download</h4>
    <section className={css.download}>
      <p>Latest version: {packageJson.version}</p>
    </section>

    <section className={css.anki} id="anki">
      <h2 className={css.heading}>What's Anki?</h2>
      <p>
        Anki is the gold standard in spaced-repetition flashcard software. It's
        a favorite of medical students, as well as pretty much everyone on the
        Internet who wants to <strong>remember a whole lot of stuff</strong>.
      </p>
      <p>
        It's available on Desktop, Android, and iOS, so you can learn at home or
        on the go.
      </p>
    </section>
  </Layout>
)

export default IndexPage
