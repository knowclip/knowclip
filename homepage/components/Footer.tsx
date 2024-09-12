import React from "react"
import css from "./Footer.module.css"
import cn from "classnames"
import {
  SiPatreon as Patreon,
  SiGithub as Github,
  IconType,
} from "@icons-pack/react-simple-icons"
import { PATREON_URL } from "../urls"

const Footer = ({ className }: { className?: string }) => (
  <footer className={cn(className, css.container)}>
    <div className={css.body}>
      <section className={css.branding}>
        <a href="/" className={css.link}>
          <h4 className={css.brandingHeading}>
            <img className={css.icon} src="/icon.png" alt="" />
            Knowclip
          </h4>
        </a>
        <p>
          <a href="#download" className={css.link}>
            Download the app free
          </a>
        </p>
      </section>

      <section className={css.contact}>
        <h4 className={css.contactHeading}>Contact the developer:</h4>
        <p>
          <br />
          <a className={css.link} href="mailto:knowclip@protonmail.com">
            knowclip@protonmail.com
          </a>
        </p>
        <p>
          <a href={PATREON_URL} className={css.link}>
            Support me on Patreon!{" "}
            <span role="img" aria-label="green heart">
              💚️
            </span>
          </a>
        </p>
      </section>

      <ul className={css.socialLinksList}>
        <SocialLink
          className={css.patreon}
          title="Patreon"
          Icon={Patreon}
          href={PATREON_URL}
        />
        <SocialLink
          className={css.github}
          title="Github"
          Icon={Github}
          href="https://github.com/knowclip/knowclip"
        />
      </ul>

      <p className={css.bottom}>
        © {new Date().getFullYear()} Justin Silvestre{" "}
        <a href="http://whoisjust.in" className={css.link}>
          www.whoisjust.in
        </a>
        <br />
        <a href="http://whoisjust.in/imprint" className={css.impressum}>
          Impressum
        </a>
      </p>
    </div>
  </footer>
)

const SocialLink = ({
  title,
  href,
  Icon,
  className,
}: {
  title: string
  href: string
  Icon: IconType
  className?: string
}) => {
  return (
    <li className={cn(css.socialLinkLi, className)}>
      <a href={href} className={css.socialLink}>
        <Icon color="white" size={24} className={css.socialLinkIcon} />
        {title}
      </a>
    </li>
  )
}

export default Footer
