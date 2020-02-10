import React, { useState, useCallback, useEffect } from "react"
import { Link } from "gatsby"
import css from "./index.module.css"
import Icon from "../components/lightbulb"
import icon from "../icon.png"
import cn from "classnames"
import Layout from "../components/layout"
import SEO from "../components/seo"

import packageJson from "../../../package.json"

const IndexPage = () => {
  const [ankiFocused, setAnkiFocused] = useState(false)
  const focusAnki = useCallback(() => {
    setAnkiFocused(true)
    setTimeout(2000, () => {
      console.log("now!")
      setAnkiFocused(false)
    })
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
          <p>Its clean and simple UI makes it easy to</p>
          <ol className={css.stepsList}>
            <li>grab sentences straight out of your video and audio files</li>
            <li>
              make <strong>media-rich</strong> flashcards tailored specifically
              to your level
            </li>
            <li>
              instantly bundle them into a ready-to-use{" "}
              <a href="#anki" onClick={focusAnki}>
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
        ></iframe>
      </div>

      <h2 className={css.downloadHeading} id="download">
        Download the app
      </h2>

      <DownloadSection />

      <hr className={css.hr} />

      <section
        className={cn(css.anki, { [css.focusedOnce]: ankiFocused })}
        id="anki"
      >
        <h2 className={css.heading}>What's Anki?</h2>
        <p>
          Anki is the gold standard in{" "}
          <a href="https://apps.ankiweb.net">
            spaced-repetition flashcard software
          </a>
          . It's a favorite of medical students, as well as pretty much everyone
          on the Internet who wants to{" "}
          <strong>remember a whole lot of stuff</strong>.
        </p>
        <p>
          It's available on{" "}
          <a href="https://apps.ankiweb.net/#dlarea">Desktop, Android, IOS</a>,
          and even in your web browser, so you can learn at home or on the go.
        </p>
        {/* </section>
      <section className={css.anki}>
        <h2 className={css.heading}>I want to customize my cards!</h2> */}
        <p>
          Once you've created your flashcard deck in Knowclip (it's{" "}
          <a href="https://www.youtube.com/watch?v=AnCyEeOt82I">easy</a>
          !), it's 100% ready to use in Anki. But if you'd like to further
          customize your cards, you can do that using Anki itself.
        </p>
      </section>

      <section className={css.anki}>
        <h2 className={css.heading}>I have a feature request!</h2>
        <p>
          This is just a passion project of mine, but I've got big plans for the
          future. Some features I already have in mind are:
        </p>

        <ul>
          <li>speech-to-text integration</li>
          <li>filling in flashcard fields automatically using transcripts</li>
          <li>other export formats besides Anki .apkg</li>
          <li>fixing out-of-sync subtitles within Knowclip</li>
          <li>
            support for different kinds of cards (i.e. not just for learning
            languages)
          </li>
        </ul>

        <p>
          Keep in mind Knowclip is currently being developed by one person (me!)
          purely as a passion project. If you can support me on Patreon, you'll
          be helping me a great deal to continue working on Knowclip in my free
          time.
        </p>
      </section>

      <section className={css.anki}>
        <h2 className={css.heading}>I found a bug!</h2>
        <p>
          Sorry about that! Please check on Github to see if the bug hasn't
          already been reported, and feel free to open an issue in case it
          hasn't.
        </p>
      </section>
    </Layout>
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
        buttonText="Windows 78/10 (64 bit)"
        fileName={getFileName("win", "exe")}
      >
        <ol>
          <li>Download the .exe file.</li>
          <li>
            Open the .exe and follow any prompts you may see to give Windows
            permission to run the app.
          </li>
        </ol>
      </DownloadOsSection>
      <DownloadOsSection
        os={MAC}
        current={os}
        osName="Mac"
        setOs={setOs}
        buttonText="for Mac OSX 10.10+"
        fileName={getFileName("mac", "zip")}
      >
        <ol>
          <li>Download the .zip archive.</li>
          <li>Open the .zip and extract the app.</li>
          <li>
            In that folder,{" "}
            <strong>while holding the Ctrl key, single-click on the app</strong>
            . Press "Open" when you see a prompt, like in{" "}
            <a href="https://www.youtube.com/watch?v=AnCyEeOt82I">this video</a>
            .
          </li>
        </ol>
      </DownloadOsSection>
      <DownloadOsSection
        os={LINUX}
        current={os}
        setOs={setOs}
        osName="Linux"
        buttonText="Debian installer (amd64)"
        fileName={getFileName("linux", "deb")}
      >
        <h5>Debian-based distributions (Ubuntu, ElementaryOS, etc.)</h5>
        <ol>
          <li>Dowload the .deb package.</li>
          <li>
            Install it in your preferred manner, or via
            <pre>
              cd /replace/this/with/your/download/directory/
              {"\n"}sudo dpkg -i {getFileName("linux", "deb")}
            </pre>
          </li>
          <li>
            Open up knowclip as you would any program, or in the terminal via{" "}
            <pre>knowclip</pre>
          </li>
        </ol>
        <h5>AppImage</h5>
        <p>
          For other distributions, there's an <a href="">AppImage</a> available
          for download, though it hasn't been as thoroughly tested.
        </p>
      </DownloadOsSection>
    </section>
  )
}

const DownloadOsSection = ({
  os,
  current,
  osName,
  downloadUrl,
  setOs,
  children,
  buttonText,
}) => {
  const isCurrent = current === os
  return (
    <>
      <h3
        className={cn(css.downloadOsName, { [css.currentOsName]: isCurrent })}
        onClick={e => setOs(os)}
      >
        {osName}
      </h3>

      <section
        className={cn(css.downloadOsBody, {
          [css.hidden]: current && !isCurrent,
        })}
      >
        {/* <p className="">Latest version: </p> */}
        {/* <strong className={css.versionNumber}>{packageJson.version}</strong> */}
        <a className={css.downloadButton}>
          {/* <span className={css.callToAction}>Download the latest version: </span> */}
          {/* <Icon /> */}
          <span className={css.downloadText}>Download</span>{" "}
          <Icon className={css.downloadIcon} src={icon} alt="Knowclip icon" />
          <div className={css.downloadName}>
            Knowclip{" "}
            <strong className={css.versionNumber}>{packageJson.version}</strong>{" "}
            {buttonText}
          </div>
        </a>
        <section className={css.installationInstructions}>
          <h4>Installation</h4>
          {children}
        </section>
      </section>
    </>
  )
}

export default IndexPage
