import React, { useState, useCallback, useEffect, useRef } from "react"
import { Link } from "gatsby"
import css from "./index.module.css"
import Icon from "../components/icon"
import cn from "classnames"
import Layout from "../components/layout"
import FaqSubsection from "../components/HomeFaqSubsection"
import DownloadSection from "../components/HomeDownloadSection"
import SEO from "../components/seo"
import TARGET_BLANK from "../helpers/targetBlank"

import packageJson from "../../../package.json"

const IndexPage = () => {
  const [openSections, setOpenSections] = useState({
    anki: true,
    how: true,
    immersion: true,
    beginner: true,
    content: true,
    speaking: true,
    featureRequest: true,
  })
  useEffect(
    () =>
      setOpenSections(o => {
        const result = {}
        for (const k in o) result[k] = false
        return result
      }),
    []
  )
  const handleClickFaq = useCallback(
    id => setOpenSections(o => ({ ...o, [id]: !o[id] })),
    []
  )

  const [ankiFocused, setAnkiFocused] = useState(false)
  const focusAnki = useCallback(() => {
    setOpenSections(o => ({ ...o, anki: true }))
    setAnkiFocused(true)
    setTimeout(() => {
      setAnkiFocused(false)
    }, 3000)
  }, [])
  const [howFocused, setHowFocused] = useState(false)
  const focusHow = useCallback(() => {
    setOpenSections(o => ({ ...o, how: true }))
    setHowFocused(true)
    setTimeout(() => {
      setHowFocused(false)
    }, 3000)
  }, [])

  return (
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
          <p>It makes it ridiculously easy to</p>
          <ol className={css.stepsList}>
            <li>grab sentences straight out of your video and audio files</li>
            <li>
              make <strong>media-rich</strong> flashcards tailored right to your
              level
            </li>
            <li>
              instantly bundle them into a ready-to-use{" "}
              <a href="#anki" onClick={focusAnki} className={css.link}>
                Anki deck
              </a>
              .
            </li>
          </ol>
        </section>
        <iframe
          className={css.demoVideo}
          title="demo-video"
          width="560"
          height="315"
          src="https://www.youtube-nocookie.com/embed/kFEfS8dyKQ8"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      <section className={css.introBottom}>
        <p>
          Try it out and see what it's like to learn a language with tools{" "}
          <strong>
            <a href="#how" onClick={focusHow} className={css.link}>
              made for learning
            </a>
            , not for profit!
          </strong>
        </p>
      </section>

      <h2 className={css.downloadHeading} id="download">
        Download the app
      </h2>

      <DownloadSection />

      <hr className={css.hr} />

      <FaqSubsection
        className={cn({ [css.focused]: ankiFocused })}
        id="anki"
        heading="What's Anki?"
        isOpen={openSections.anki}
        setOpenSections={setOpenSections}
      >
        <>
          <p>
            <a
              href="https://apps.ankiweb.net"
              className={css.link}
              {...TARGET_BLANK}
            >
              Anki
            </a>{" "}
            is the gold standard in <i>spaced-repetition</i> flashcard software.
            It's a favorite of medical students, as well as pretty much everyone
            on the Internet who wants to{" "}
            <strong>remember a whole lot of stuff</strong>.
          </p>
          <p>
            It's available on{" "}
            <a
              href="https://apps.ankiweb.net/#dlarea"
              className={css.link}
              {...TARGET_BLANK}
            >
              Desktop, Android, IOS
            </a>
            , and even in your web browser, so you can learn at home or on the
            go.
          </p>
          <p>
            Once you've created your flashcard deck in Knowclip, it's 100% ready
            to use in Anki. But if you'd like to further customize your cards,
            you can do that using Anki itself.
          </p>
        </>
      </FaqSubsection>

      <FaqSubsection
        className={cn({ [css.focused]: howFocused })}
        id="how"
        heading="How does Knowclip help me learn?"
        isOpen={openSections.how}
        setOpenSections={setOpenSections}
      >
        <>
          <p>
            Everyone knows the best way to learn a language is to{" "}
            <strong>immerse yourself in it</strong>. Thanks to the Internet,
            it's now possible to do this without ever leaving your home--you can
            immerse yourself in a new language via TV series, movies, podcasts,
            and audiobooks!
          </p>

          <p>
            Knowclip is a way to make native media approachable as a
            language-learner. Its friendly interface lets you move through
            real-life dialog at your own pace. And crucially, it lets you{" "}
            <strong>
              concentrate on those bits you can learn to understand naturally
            </strong>{" "}
            at your current level.
          </p>

          <p>
            This is important because{" "}
            <strong>
              there's more to the immersion story than most people realize
            </strong>
            . Knowclip's design acknowledges this, and helps you get{" "}
            <a href="#immersion" className={css.link}>
              the right kind of immersion
            </a>{" "}
            you need at this step in your journey towards fluency.
          </p>
        </>
      </FaqSubsection>

      <FaqSubsection
        id="immersion"
        heading="How can I learn from native media?"
        isOpen={openSections.immersion}
        setOpenSections={setOpenSections}
      >
        <>
          <p>
            When it comes to immersion in a new language, it's not enough just
            to maximize your exposure to native speech. In order to actually
            learn from that speech, it must be
          </p>
          <p>
            <ol>
              <li>
                <strong>within rich context</strong>, like the plot of a story
                or the thread of a conversation
              </li>
              <li>
                <strong>
                  <em>just</em> beyond your current level of understanding
                </strong>
                .
              </li>
            </ol>
          </p>
          <p>
            This way, your brain can <strong>fill in the gaps</strong> and make
            sense of new words or grammar structures almost automatically.
          </p>

          <p>
            This is the only way to{" "}
            <a
              href="https://youtu.be/J_EQDtpYSNM?t=230"
              className={css.link}
              {...TARGET_BLANK}
            >
              truly acquire a language
            </a>
            , versus just learning <em>about</em> it, like you would in a
            classroom.{" "}
            <strong>
              You don't need vocabulary lists or conjugation tables
            </strong>
            . You <em>definitely</em> don't need boring textbooks and silly
            classroom speaking exercises. What you need is{" "}
            <a
              href="http://www.antimoon.com/how/input.htm"
              className={css.link}
              {...TARGET_BLANK}
            >
              lots and lots of input
            </a>{" "}
            from engaging sources.
          </p>

          <p>
            Knowclip is here to <strong>keep your motivated</strong> while
            you're accumulating all those hours of input you'll need in order to
            become fluent. As a language-learner, there's a lot you won't
            understand, but Knowclip helps you{" "}
            <strong>
              focus on the bits you <em>can</em> understand
            </strong>
            . With the addition of{" "}
            <a href="#anki" className={css.link}>
              Anki
            </a>
            , you can be sure to remember what you learn and easily keep track
            of your progress.
          </p>
        </>
      </FaqSubsection>

      <FaqSubsection
        id="content"
        heading="Where can I find media to use with Knowclip?"
        isOpen={openSections.content}
        setOpenSections={setOpenSections}
      >
        <>
          <p>
            It depends! You can use pretty much any audio or video file on your
            computer with Knowclip. What's most important is that you{" "}
            <strong>find something that holds your interest</strong>. Something
            like your favorite TV show is ideal--if you're familiar with the
            story, it can help you stay engaged and{" "}
            <a href="#immersion" className={css.link}>
              make sense of the language
            </a>
            .
          </p>
          <p>
            Of course, finding that content to download is easier said than
            done. I would love to build a platform to make this easier, either
            as a web site, or as an integrated feature in Knowclip. Please
            consider{" "}
            <a href="https://patreon.com/knowclip" className={css.link}>
              supporting me on Patreon
            </a>{" "}
            so I can make this happen while continuing to keep Knowclip free to
            download and use!
          </p>
          <p>
            If you're a content creator, I would love to collaborate with you to
            make your work more easily available for use with Knowclip, while
            making sure you're fairly compensated. If that sounds interesting to
            you, please feel free to{" "}
            <a href="mailto:knowclip@protonmail.com" className={css.link}>
              get in touch
            </a>
            !
          </p>
        </>
      </FaqSubsection>

      <FaqSubsection
        id="speaking"
        heading="Can it help with speaking?"
        isOpen={openSections.speaking}
        setOpenSections={setOpenSections}
      >
        <>
          <p>
            The only way to learn to speak a language with real humans is by
          </p>
          <p>
            <ol>
              <li>Learning to understand the language</li>
              <li>Practicing speaking with real humans</li>
            </ol>
          </p>
          <p>
            Software can't replace with #2, at least not yet{" "}
            <span role="img" aria-label="smile">
              😉️
            </span>{" "}
            But immersing yourself in native media (with the help of Knowclip)
            is{" "}
            <a href="#how" className={css.link}>
              a great way to learn to understand the language
            </a>
            .
          </p>
          <p>
            Also keep in mind that{" "}
            <strong>
              #1 <em>must</em> happen before #2
            </strong>
            --you can't have a conversation with someone unless you can
            understand what they're saying! There are even people who advocate
            for a{" "}
            <a
              href="https://youtu.be/yW8M4Js4UBA?t=192"
              className={css.link}
              {...TARGET_BLANK}
            >
              silent period
            </a>{" "}
            when starting a new language.
          </p>
        </>
      </FaqSubsection>

      <FaqSubsection
        id="featureRequest"
        heading="I have an idea for a new feature!"
        isOpen={openSections.featureRequest}
        setOpenSections={setOpenSections}
      >
        <p>
          This is just a passion project of mine, but I've got big plans for the
          future of Knowclip. Some features I already have in mind are:
        </p>

        <p>
          <ul>
            <li>in-app popup dictionaries</li>
            <li>speech-to-text integration</li>
            <li>better podcasts/audiobooks support</li>
            <li>sentence difficulty ratings based on word frequency</li>
            <li>other export formats besides Anki .apkg</li>
            <li>integration with streaming services</li>
            <li>fixing out-of-sync subtitles within Knowclip</li>
            <li>
              support for different kinds of cards (i.e. not just for learning
              languages)
            </li>
          </ul>
        </p>

        <p>
          Keep in mind Knowclip is currently being developed by one person (me!)
          purely as a passion project. If you can support me on Patreon, you'll
          be helping me a great deal to continue working on Knowclip in my free
          time.
        </p>

        <p>Prioritize features most requested by supporters and in general</p>
      </FaqSubsection>
    </Layout>
  )
}

const unsignedProgramMessage = () => {
  return (
    <section>
      <h2>Thanks for downloading Knowclip!</h2>

      <p>
        Since you're running xxxxx, please don't forget to xxxxxxxxxx the
        installation instructions.
      </p>

      <h3>Why the extra step?</h3>

      <p>
        I'm just one lone developer making this app my free time, and I've
        released it for free because I believe education should be available to
        everyone.
      </p>

      <p>
        But Apple has a "code-signing" process that wasn't made with independent
        open-source developers like me in mind. They will only let users install
        my app the regular way if I 1) own an Apple computer and 2) pay a $99
        yearly fee.
      </p>

      <p>
        Maybe one day I might get enough supporters on Patreon to justify the
        cost. But for now, please bear with me :)
      </p>
    </section>
  )
}

export default IndexPage
