import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (<HomepageDocument />
    )
  }
}

function HomepageDocument() {
  return (
    <Html lang="en" className={'noJs'}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default MyDocument