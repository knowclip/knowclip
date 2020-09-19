import React, { useEffect } from "react"
import Index from "./index"

const NotFoundPage = ({ ...props }) => {
  useEffect(() => {
    if (global.window) {
      window.location.href = "/"
    }
  }, [])

  return <Index {...props} />
}

export default NotFoundPage
