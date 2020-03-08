import React, { useState, useEffect, useCallback } from "react"
import css from "../pages/index.module.css"
import Icon from "../components/icon"
import cn from "classnames"
import TARGET_BLANK from "../helpers/targetBlank"

import packageJson from "../../../package.json"

const WINDOWS = "win"
const MAC = "mac"
const LINUX = "linux"
const getOs = ({ userAgent }) => {
  if (userAgent.includes("MacOS")) return MAC
  if (userAgent.includes("Linux")) return LINUX
  if (userAgent.includes("Win")) return WINDOWS
  return WINDOWS
}

const getFileName = (osCode, ext, arch) =>
  `Knowclip_${[packageJson.version, osCode, arch]
    .filter(s => s)
    .join("_")}.${ext}`

const getDownloadUrl = (osCode, ext, arch) =>
  `https://github.com/knowclip/knowclip/releases/download/v${
    packageJson.version
  }/${getFileName(osCode, ext, arch)}`

const DownloadSection = () => {
  const [os, setOs] = useState()
  const [firstOs, setFirstOs] = useState()

  useEffect(() => {
    const firstOs = getOs(window.navigator)
    setOs(firstOs)
    setFirstOs(firstOs)
  }, [])
  useEffect(() => {
    const hash = window.location.hash || ""
    const focusedId = hash.replace("#", "")
    const focusedElement = focusedId && document.getElementById(focusedId)
    focusedElement &&
      focusedElement.scrollIntoView &&
      focusedElement.scrollIntoView()
  }, [firstOs])

  const [macInstallVideoIsOpen, setMacInstallVideoIsOpen] = useState(false)
  const openMacInstallVideo = useCallback(e => {
    e.preventDefault()
    setMacInstallVideoIsOpen(true)
  }, [])

  return (
    <section className={css.download}>
      <DownloadOsSection
        current={os}
        setOs={setOs}
        os={WINDOWS}
        defaultExt={"exe"}
        osName="Windows"
        buttonText="for Windows 7+"
      >
        {showPostDownloadMessage => (
          <>
            <ol>
              <li>
                <a
                  href={getDownloadUrl(os, "exe")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  {...TARGET_BLANK}
                >
                  Download
                </a>{" "}
                the .exe file.
              </li>
              <li>Open the .exe file.</li>
              <li>
                Follow any prompts you may see to give Windows permission to run
                the app.
              </li>
            </ol>
            <p>
              Note that the app is currently only available on 64-bit machines.
              (You probably don't have to worry about this unless you have a
              really old computer{" "}
              <span role="img" aria-label="smile">
                🙂️
              </span>
              )
            </p>
          </>
        )}
      </DownloadOsSection>
      <DownloadOsSection
        current={os}
        setOs={setOs}
        os={MAC}
        osName="Mac"
        buttonText="for Mac OS X 10.10+"
        defaultExt="dmg"
      >
        {showPostDownloadMessage => (
          <>
            <ol>
              <li>
                <a
                  href={getDownloadUrl(os, "dmg")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  {...TARGET_BLANK}
                >
                  Download
                </a>{" "}
                the .dmg archive.
              </li>
              <li>
                Open the .dmg and drag the app into your Applications folder.
              </li>
              <li>Open your Applications folder.</li>
              <li>
                <strong>
                  While holding the Ctrl key, single-click on the app
                </strong>{" "}
                and select "Open". Press "Open" when you see a prompt, like in{" "}
                <a
                  href="https://www.youtube.com/watch?v=AnCyEeOt82I"
                  className={css.link}
                  onClick={openMacInstallVideo}
                >
                  this 30-second video
                </a>
                .
                {macInstallVideoIsOpen && (
                  <div className={css.responsiveVideo}>
                    <iframe
                      title="Install Mac Video"
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/AnCyEeOt82I?start=0&autoplay=1"
                      frameborder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                )}
              </li>
            </ol>
          </>
        )}
      </DownloadOsSection>
      <DownloadOsSection
        os={LINUX}
        current={os}
        setOs={setOs}
        osName="Linux"
        buttonText="Debian archive (amd64)"
        defaultExt="deb"
      >
        {showPostDownloadMessage => (
          <>
            <h5 className={css.subheading}>
              Debian-based distributions (Ubuntu, ElementaryOS, etc.)
            </h5>
            <ol>
              <li>
                <a
                  href={getDownloadUrl(os, "deb")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  {...TARGET_BLANK}
                >
                  Download
                </a>{" "}
                the .deb package.
              </li>
              <li>
                Install it in your preferred manner, or via
                <pre>
                  cd /your/download/folder/ # replace this!
                  {"\n"}sudo dpkg -i {getFileName("linux", "deb")}
                </pre>
              </li>
              <li>
                Open up knowclip as you would any program, or in the terminal
                via <pre>knowclip</pre>
              </li>
            </ol>
            <h5 className={css.subheading}>AppImage</h5>
            <p>
              For other distributions, there's an{" "}
              <a
                href={getDownloadUrl("linux", "AppImage")}
                className={css.link}
                onClick={showPostDownloadMessage}
                {...TARGET_BLANK}
              >
                AppImage
              </a>{" "}
              available for download, though it hasn't been as thoroughly
              tested.
            </p>
          </>
        )}
      </DownloadOsSection>
    </section>
  )
}

const DownloadOsSection = ({
  os,
  defaultExt,
  current,
  osName,
  setOs,
  children,
  buttonText,
}) => {
  const isCurrent = current === os

  const [
    postDownloadMessageIsShowing,
    setPostDownloadMessageIsShowing,
  ] = useState(false)
  const showPostDownloadMessage = useCallback(() => {
    setPostDownloadMessageIsShowing(true)
  }, [])

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
        {postDownloadMessageIsShowing && (
          <div className={css.postDownloadMessage}>
            <PostDownloadMessage os={os} />
          </div>
        )}

        <section className={css.downloadButtonSection}>
          <a
            className={css.downloadButton}
            href={getDownloadUrl(os, defaultExt)}
            onClick={showPostDownloadMessage}
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
          {children(showPostDownloadMessage)}
        </section>
      </section>
    </>
  )
}

const PostDownloadMessage = () => (
  <>
    <p>Thanks for downloading Knowclip!</p>
    <p>
      <strong>Be sure to follow the installation instructions below</strong>{" "}
      once the download has finished.
    </p>
    <p>
      Knowclip is free to download and use, and I'm committed to keeping it that
      way. Please consider <PatreonLink>supporting me on Patreon</PatreonLink>{" "}
      to help me follow my dream of making quality language education free for
      everyone!
    </p>
  </>
)

const PatreonLink = ({ children }) => (
  <a href="https://patreon.com/knowclip" className={css.link}>
    {children}
  </a>
)

export default DownloadSection
