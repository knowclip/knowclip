import React from "react"
import css from "./Footer.module.css"
import cn from "classnames"
import Lightbulb from "./icon"
import { Twitter, Patreon, Github } from "@icons-pack/react-simple-icons"

const Footer = ({ className }) => (
  <footer className={cn(className, css.container)}>
    <div className={css.body}>
      <section className={css.branding}>
        <Lightbulb />
        <p>Knowclip</p>
      </section>

      <section className={css.contact}>
        <h4>Contact the developer</h4>
        <a className={css.link} href="mailto:knowclip@protonmail.com">
          knowclip@protonmail.com
        </a>
        <Twitter size={14} /> @knowclip
      </section>

      <ul className={css.socialLinksList}>
        <SocialLink
          className={css.twitter}
          title="Twitter"
          Icon={Twitter}
          href="https://twitter.com/@knowclip"
        />
        <SocialLink
          className={css.patreon}
          title="Patreon"
          Icon={Patreon}
          href="https://patreon.com/justinsilvestre"
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

const SocialLink = ({ title, href, Icon }) => {
  return (
    <li className={css.socialLinkLi}>
      <a href={href} className={css.socialLink}>
        <Icon color="white" size={24} className={css.socialLinkIcon} />
        {title}
      </a>
    </li>
  )
}

export default Footer
