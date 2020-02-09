import React from "react"
import { Link } from "gatsby"
import css from "./index.module.css"

import Layout from "../components/layout"
import SEO from "../components/seo"

import packageJson from "../../../package.json"

const IndexPage = () => (
  <Layout>
    <SEO title="Learn languages for free through native media" />
    <section className={css.intro}>
      <h2 className={css.heading}>
        Learn a new language by enjoying <strong>native media</strong>.
      </h2>
      <p>
        Knowclip is a free desktop app that transforms your media into{" "}
        <strong>effective language-learning materials</strong>.
      </p>
    </section>

    <div className={css.middle}>
      <section className={css.steps}>
        <p>Its clean and simple UI makes it easy to</p>
        <ol className={css.stepsList}>
          <li>grab sentences straight out of your video and audio files</li>
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

    <h2 className={css.downloadHeading} id="download">
      Download the app
    </h2>
    <section className={css.download}>
      <p>Latest version: {packageJson.version}</p>

      <h3>Windows</h3>
      <h3>Mac</h3>
      <h3>Linux</h3>
    </section>

    <section className={css.anki} id="anki" tabIndex="0">
      <h2 className={css.heading}>What's Anki?</h2>
      <p>
        <a href="https://apps.ankiweb.net">Anki</a> is the gold standard in
        spaced-repetition flashcard software. It's a favorite of medical
        students, as well as pretty much everyone on the Internet who wants to{" "}
        <strong>remember a whole lot of stuff</strong>.
      </p>
      <p>
        It's available on Desktop, Android, and iOS, so you can learn at home or
        on the go.
      </p>
    </section>

    <section className={css.anki} onClick={e => e.preventDefault()}>
      <h2 className={css.heading}>I have a feature request!</h2>
      <p>LIST PLANNED FEATURES</p>
      <p>Great! I'd love to hear your feedback.</p>
      <p>
        Keep in mind Knowclip is currently being developed by one person purely
        as a passion project. If you can support me on Patreon, you'll be
        helping me a great deal to continue working on Knowclip in my free time.
      </p>
    </section>
    <section className={css.anki}>
      <h2 className={css.heading}>I found a bug!</h2>
      <p>
        Sorry about that! Please check on Github to see if the bug hasn't
        already been reported, and feel free to open an issue in case it hasn't.
      </p>
    </section>
  </Layout>
)

export default IndexPage
