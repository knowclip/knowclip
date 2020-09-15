import React, { AnchorHTMLAttributes, PropsWithChildren } from 'react'

const Link = ({ children, newWindow = false, ...restProps }: PropsWithChildren<{ newWindow?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>>) => {
    const props = newWindow ?  {
        ...restProps,
        target: "_blank", rel: "noopener noreferrer"
    } : restProps
   return <span><a {...props}>{children}</a></span>
}

export default Link