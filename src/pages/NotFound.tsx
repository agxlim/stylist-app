import { Link } from 'react-router-dom'
import { Heading, Page } from '../components/ui'

export default function NotFound() {
  return (
    <Page>
      <Heading title="Page not found" />
      <Link to="/" className="underline">Go home</Link>
    </Page>
  )
}
