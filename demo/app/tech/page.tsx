```tsx
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CopyIcon } from '@radix-ui/react-icons'
import { useState } from 'react'

export default function TechPage() {
  const [copied, setCopied] = useState('')

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8">Technical Documentation</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>GET</TableCell>
              <TableCell>/api/users</TableCell>
              <TableCell>Retrieve all users</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>POST</TableCell>
              <TableCell>/api/auth/login</TableCell>
              <TableCell>Authenticate user</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p>Authentication is handled via Keycloak SSO with JWT tokens and role-based access control.</p>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => copyCode(`const token = await keycloak.getToken();
if (token) {
  headers.Authorization = \`Bearer \${token}\`;
}`)}
            >
              <CopyIcon className={copied ? 'text-green-500' : ''} />
            </Button>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg">
              <code>{`const token = await keycloak.getToken();
if (token) {
  headers.Authorization = \`Bearer \${token}\`;
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Security</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>HTTPS enforced in production</li>
          <li>CORS configured for approved origins</li>
          <li>Rate limiting: 100 requests/minute</li>
          <li>CSRF protection via double submit cookie</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Performance</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Largest Contentful Paint (LCP) < 2.5s</li>
          <li>Total bundle size < 250KB (gzipped)</li>
          <li>Server-side rendering for initial page load</li>
          <li>Image optimization and lazy loading</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>WCAG 2.1 Level AA compliant</li>
          <li>Full keyboard navigation support</li>
          <li>Screen reader optimized</li>
          <li>Proper ARIA labels and roles</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <h3 className="font-medium mb-2">Frontend</h3>
            <ul className="list-disc list-inside">
              <li>Next.js 14</li>
              <li>React 18</li>
              <li>Tailwind CSS</li>
              <li>TanStack Query</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <h3 className="font-medium mb-2">Backend</h3>
            <ul className="list-disc list-inside">
              <li>Node.js</li>
              <li>PostgreSQL</li>
              <li>Redis</li>
              <li>TypeScript</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Browser Support</h2>
        <p className="mb-4">Supports the last 2 versions of:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Google Chrome</li>
          <li>Mozilla Firefox</li>
          <li>Safari</li>
          <li>Microsoft Edge</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Monitoring</h2>
        <div className="prose dark:prose-invert max-w-none">
          <p>Application monitoring and error tracking:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Sentry for error tracking</li>
            <li>OpenTelemetry for distributed tracing</li>
            <li>Custom metrics via Prometheus</li>
            <li>Real-user monitoring (RUM)</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
```