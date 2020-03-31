import React from 'react'

const Link = ({ children, newWindow, ...restProps }) => {
    const props = newWindow ?  {
        ...restProps,
        target: "_blank", rel: "noopener noreferrer"
    } : restProps
   return <span><a {...props}>{children}</a></span>
}

export default Link