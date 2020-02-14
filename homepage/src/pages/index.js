import React, { useState, useCallback, useEffect, useRef } from "react"
import { Link } from "gatsby"
import css from "./index.module.css"
import Icon from "../components/icon"
import cn from "classnames"
import Layout from "../components/layout"
import SEO from "../components/seo"

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
          Try it out and see how fun it can be to learn a language with tools
          that were made{" "}
          <a href="#how" onClick={focusHow} className={css.link}>
            to help you learn
          </a>
          , not for profit!
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
        handleClick={handleClickFaq}
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
            is the gold standard in flashcard software. It's a favorite of
            medical students, as well as pretty much everyone on the Internet
            who wants to <strong>remember a whole lot of stuff</strong>.
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
        handleClick={handleClickFaq}
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
            . Knowclip's design acknowledges that, and helps you get{" "}
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
        handleClick={handleClickFaq}
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
            , versus just learning <em>about</em> it like you would in a
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
        handleClick={handleClickFaq}
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
            done. I would <strong>love</strong> to build a platform to make this
            easier, either as a web site, or as an integrated feature in
            Knowclip. But I'll be needing lots of help! Please consider{" "}
            <a href="https://patreon.com/knowclip" className={css.link}>
              supporting me on Patreon
            </a>{" "}
            so I can make this happen while continuing to keep Knowclip free to
            download and use!
          </p>
          <p>
            If you're a content creator, I would <strong>love</strong> to
            collaborate with you to make your work more easily available for use
            with Knowclip, while making sure you're fairly compensated. If that
            sounds interesting to you, please feel free to{" "}
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
        handleClick={handleClickFaq}
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
            Software can't help with #2, at least not yet{" "}
            <span role="img" aria-label="smile">
              😉️
            </span>
            But immersing yourself in native media (with the help of Knowclip)
            is{" "}
            <a href="#how">a great way to learn to understand the language</a>.
          </p>
          <p>
            It's worth noting that{" "}
            <strong>
              #1 <em>must</em> happen before #2
            </strong>
            --you can't have a conversation in a conversation unless you can
            understand what the other person is saying! There are even people
            who advocate for a{" "}
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
        handleClick={handleClickFaq}
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
const WINDOWS = "WINDOWS"
const MAC = "MAC"
const LINUX = "LINUX"
const getOs = ({ userAgent }) => {
  if (userAgent.includes("Win")) return WINDOWS
  if (userAgent.includes("MacOS")) return MAC
  if (userAgent.includes("Linux")) return LINUX
}

const getFileName = (osCode, ext) =>
  `Knowclip_${packageJson.version}_${osCode}.${ext}`

const DownloadSection = () => {
  const [os, setOs] = useState(window ? getOs(window.navigator) : null)

  return (
    <section className={css.download}>
      <DownloadOsSection
        os={WINDOWS}
        current={os}
        setOs={setOs}
        osName="Windows"
        buttonText="for Windows 7+"
        fileName={getFileName("win", "exe")}
      >
        <ol>
          <li>Download the .exe file.</li>
          <li>Open the .exe</li>
          <li>
            Follow any prompts you may see to give Windows permission to run the
            app.
          </li>
        </ol>
        <p>
          Note that the app is only available on 64-bit machines. (You probably
          don't have to worry about this unless you have a really old computer{" "}
          <span role="img" aria-label="smile">
            🙂️
          </span>
          )
        </p>
      </DownloadOsSection>
      <DownloadOsSection
        os={MAC}
        current={os}
        osName="Mac"
        setOs={setOs}
        buttonText="for Mac OSX 10.10+"
        fileName={getFileName("mac", "dmg")}
      >
        <ol>
          <li>Download the .dmg archive.</li>
          <li>Open the .dmg and drag the app into your Applications folder.</li>
          <li>Open your Applications folder</li>
          <li>
            <strong>While holding the Ctrl key, single-click on the app</strong>
            . Press "Open" when you see a prompt, like in{" "}
            <a
              href="https://www.youtube.com/watch?v=AnCyEeOt82I"
              className={css.link}
            >
              this video
            </a>
            .
          </li>
        </ol>
      </DownloadOsSection>
      <DownloadOsSection
        os={LINUX}
        current={os}
        setOs={setOs}
        osName="Linux"
        buttonText="Debian archive (amd64)"
        fileName={getFileName("linux", "deb")}
      >
        <h5 className={css.subheading}>
          Debian-based distributions (Ubuntu, ElementaryOS, etc.)
        </h5>
        <ol>
          <li>Download the .deb package.</li>
          <li>
            Install it in your preferred manner, or via
            <pre>
              cd /your/download/folder/ # replace this!
              {"\n"}sudo dpkg -i {getFileName("linux", "deb")}
            </pre>
          </li>
          <li>
            Open up knowclip as you would any program, or in the terminal via{" "}
            <pre>knowclip</pre>
          </li>
        </ol>
        <h5 className={css.heading}>AppImage</h5>
        <p>
          For other distributions, there's an{" "}
          <a
            href={`https://github.com/knowclip/knowclip/releases/download/v${
              packageJson.version
            }/${getFileName("linux", "AppImage")}`}
            className={css.link}
          >
            AppImage
          </a>{" "}
          available for download, though it hasn't been as thoroughly tested.
        </p>
      </DownloadOsSection>
    </section>
  )
}

const DownloadOsSection = ({
  os,
  current,
  osName,
  setOs,
  children,
  buttonText,
  fileName,
}) => {
  const isCurrent = current === os
  return (
    <>
      <h3
        className={cn(css.downloadOsName, { [css.currentOsName]: isCurrent })}
        onClick={e => setOs(os)}
        tabIndex="0"
        onFocus={e => setOs(os)}
      >
        {osName}
      </h3>

      <section
        className={cn(css.downloadOsBody, {
          [css.hidden]: current && !isCurrent,
        })}
      >
        <section className={css.downloadButtonSection}>
          <a
            className={css.downloadButton}
            href={`https://github.com/knowclip/knowclip/releases/download/v${packageJson.version}/${fileName}`}
          >
            <div className={css.callToAction}>Download</div>
            <Icon className={css.downloadIcon} alt="Knowclip icon" />
            <div className={css.downloadName}>
              Knowclip{" "}
              <strong className={css.versionNumber}>
                {packageJson.version}
              </strong>{" "}
              <div> {buttonText}</div>
            </div>
          </a>
        </section>
        <section className={css.installationInstructions}>
          <h4 className={css.subheading}>Installation</h4>
          {children}
        </section>
      </section>
    </>
  )
}

const TARGET_BLANK = { target: "_blank", rel: "noopener noreferrer" }

const FaqSubsection = ({
  children,
  heading,
  id,
  isOpen,
  setOpenSections,
  handleClick: hc,
  className,
}) => {
  const open = useCallback(() => setOpenSections(o => ({ ...o, [id]: true })), [
    setOpenSections,
    id,
  ])
  const close = useCallback(
    () => setOpenSections(o => ({ ...o, [id]: false })),
    [setOpenSections, id]
  )
  const headingRef = useRef()
  const skipFocusAction = useRef(false)
  const handleHeadingMouseDown = useCallback(
    e => {
      const notFocused =
        document.activeElement && headingRef.current !== document.activeElement

      if (notFocused && isOpen) {
        skipFocusAction.current = true
        close()
      } else {
        hc(id)
      }
    },
    [isOpen, close, hc, id]
  )

  const handleFocus = useCallback(
    e => {
      console.log("skipFocusAction", id, skipFocusAction.current)
      if (!skipFocusAction.current && !isOpen) open()
      skipFocusAction.current = false
    },
    [open, isOpen]
  )

  return (
    <section
      className={cn(css.info, { [css.openInfo]: isOpen }, className)}
      id={id}
      tabIndex="0"
      onFocus={handleFocus}
    >
      <h2
        className={css.infoHeading}
        onMouseDown={handleHeadingMouseDown}
        ref={headingRef}
      >
        {heading}
      </h2>
      {children}
      {isOpen && (
        <p className={css.downloadLinkP}>
          <a href="#download" className={css.downloadLink}>
            Go to download &nbsp;&nbsp;↑
          </a>
        </p>
      )}
    </section>
  )
}

export default IndexPage
