import { Link } from 'react-router-dom';

interface FooterProps {
  version: string;
}

/**
 * Footer component displaying copyright, version, and navigation links.
 * @param {FooterProps} props - Component props
 * @param {string} props.version - Version number from environment
 */
export function Footer({ version }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {currentYear} Your Company. All rights reserved.
          </p>
          <span className="hidden h-6 w-px bg-border md:block" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">v{version}</p>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            to="/help"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Help
          </Link>
          <Link
            to="/api-docs"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            API Docs
          </Link>
        </nav>
      </div>
    </footer>
  );
}