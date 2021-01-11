import React, {
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
  ReactNode,
} from "react"
import css from "../pages/index.module.css"
import A from "./Link"
import cn from "classnames"

const WINDOWS = "win"
const MAC = "mac"
const LINUX = "linux"
const getOs = ({ userAgent }: Navigator) => {
  if (userAgent.includes("Mac OS")) return MAC
  if (userAgent.includes("Linux")) return LINUX
  if (userAgent.includes("Win")) return WINDOWS
  return WINDOWS
}

const LATEST_VERSION = "0.8.2-beta"

const getFileName = (osCode: string, ext: string, arch?: string) =>
  `Knowclip_${[LATEST_VERSION, osCode, arch].filter((s) => s).join("_")}.${ext}`

const DownloadSection = () => {
  const [os, setOs] = useState<string>()
  const [firstOs, setFirstOs] = useState<string>()

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
  const openMacInstallVideo = useCallback((e) => {
    e.preventDefault()
    setMacInstallVideoIsOpen(true)
  }, [])

  const [downloadVersion, setDownloadVersion] = useState(LATEST_VERSION)

  const getDownloadUrl = useCallback(
    (osCode: string, ext: string, arch?: string) =>
      `https://github.com/knowclip/knowclip/releases/download/v${
        downloadVersion || LATEST_VERSION
      }/${getFileName(osCode, ext, arch)}`,
    [downloadVersion]
  )
  useEffect(() => {
    fetch("https://api.github.com/repos/knowclip/knowclip/releases/latest", {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.name !== LATEST_VERSION) {
          setDownloadVersion(json.name)
        }
      })
  }, [setDownloadVersion])

  return (
    <section className={css.download}>
      <DownloadOsSection
        current={os}
        setOs={setOs}
        os={WINDOWS}
        defaultExt={"exe"}
        osName="Windows"
        buttonText="for Windows 7+"
        downloadVersion={downloadVersion}
        getDownloadUrl={getDownloadUrl}
      >
        {(showPostDownloadMessage) => (
          <>
            <ol>
              <li>
                <A
                  href={os && getDownloadUrl(os, "exe")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  newWindow
                >
                  Download
                </A>{" "}
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
        downloadVersion={downloadVersion}
        getDownloadUrl={getDownloadUrl}
      >
        {(showPostDownloadMessage) => (
          <>
            <ol>
              <li>
                <A
                  href={os && getDownloadUrl(os, "dmg")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  newWindow
                >
                  Download
                </A>{" "}
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
                <A
                  href="https://www.youtube.com/watch?v=AnCyEeOt82I"
                  className={css.link}
                  onClick={openMacInstallVideo}
                >
                  this 30-second video
                </A>
                .
                {macInstallVideoIsOpen && (
                  <div className={css.responsiveVideo}>
                    <iframe
                      title="Install Mac Video"
                      width="560"
                      height="315"
                      src="https://www.youtube.com/embed/AnCyEeOt82I?start=0&autoplay=1"
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
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
        downloadVersion={downloadVersion}
        getDownloadUrl={getDownloadUrl}
      >
        {(showPostDownloadMessage) => (
          <>
            <h5 className={css.subheading}>
              Debian-based distributions (Ubuntu, ElementaryOS, etc.)
            </h5>
            <ol>
              <li>
                <A
                  href={os && getDownloadUrl(os, "deb")}
                  className={css.link}
                  onClick={showPostDownloadMessage}
                  newWindow
                >
                  Download
                </A>{" "}
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
              <A
                href={getDownloadUrl("linux", "AppImage")}
                className={css.link}
                onClick={showPostDownloadMessage}
                newWindow
              >
                AppImage
              </A>{" "}
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
  downloadVersion,
  getDownloadUrl,
}: {
  os: string
  defaultExt: string
  current?: string
  osName: string
  setOs: (os: string) => void
  children: (showPostDownloadMessage: () => void) => ReactNode
  buttonText: string
  downloadVersion: string
  getDownloadUrl: (osCode: string, ext: string, arch?: string) => string
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
        tabIndex={0}
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
          <A
            className={css.downloadButton}
            href={getDownloadUrl(os, defaultExt)}
            onClick={showPostDownloadMessage}
          >
            <div className={css.callToAction}>Download latest</div>
            <img className={css.downloadIcon} alt="" src="/icon.png" />
            <div className={css.downloadName}>
              Knowclip{" "}
              <strong className={css.versionNumber}>{downloadVersion}</strong>{" "}
              <div> {buttonText}</div>
            </div>
          </A>
        </section>

        <section className={css.installationInstructions}>
          <h4 className={css.subheading}>Installation</h4>
          {children(showPostDownloadMessage)}
        </section>
      </section>
    </>
  )
}

const PostDownloadMessage = (_: { os: string }) => (
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

const PatreonLink = ({ children }: PropsWithChildren<{}>) => (
  <A href="https://patreon.com/knowclip" className={css.link}>
    {children}
  </A>
)

export default DownloadSection
