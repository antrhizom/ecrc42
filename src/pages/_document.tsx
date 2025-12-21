import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="ECRC42 - EduCopyrightCheck: Interaktive Plattform zum Lernen und Überprüfen von Urheberrechten und Creative Commons Lizenzen" />
        <meta name="keywords" content="Urheberrecht, Creative Commons, Lizenz, Bildung, Copyright" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
