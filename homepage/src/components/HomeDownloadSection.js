import React, { useState, useEffect } from "react"
import css from "../pages/index.module.css"
import Icon from "../components/icon"
import cn from "classnames"
import TARGET_BLANK from "../helpers/targetBlank"

import packageJson from "../../../package.json"

const WINDOWS = "WINDOWS"
const MAC = "MAC"
const LINUX = "LINUX"
const getOs = ({ userAgent }) => {
  if (userAgent.includes("MacOS")) return MAC
  if (userAgent.includes("Linux")) return LINUX
  if (userAgent.includes("Win")) return WINDOWS
  return WINDOWS
}

const getFileName = (osCode, ext) =>
  `Knowclip_${packageJson.version}_${osCode}.${ext}`

const DownloadSection = () => {
  const [os, setOs] = useState()

  useEffect(() => {
    console.log("hiiii", getOs(window.navigator))
    setOs(getOs(window.navigator))
  }, [])

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
        <h5 className={css.subheading}>AppImage</h5>
        <p>
          For other distributions, there's an{" "}
          <a
            href={`https://github.com/knowclip/knowclip/releases/download/v${
              packageJson.version
            }/${getFileName("linux", "AppImage")}`}
            className={css.link}
            {...TARGET_BLANK}
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
        onClick={() => setOs(os)}
        tabIndex="0"
        onFocus={() => setOs(os)}
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
            <div className={css.callToAction}>Download latest</div>
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

export default DownloadSection
