import React from 'react';

// Define the Sevensa colors for Tailwind CSS utility classes
// Primary: #00A896 (A shade of teal/cyan)
// Secondary/Dark: #2D3A45 (A dark slate/charcoal)

// Helper component for the Card Header
interface CardHeaderProps {
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div className="p-4 border-b border-gray-200 bg-gray-50 dark:bg-[#2D3A45] dark:border-gray-700">
    {children}
  </div>
);

// Helper component for the Card Body
interface CardBodyProps {
  children: React.ReactNode;
}

const CardBody: React.FC<CardBodyProps> = ({ children }) => (
  <div className="p-4 flex-grow">
    {children}
  </div>
);

// Helper component for the Card Footer
interface CardFooterProps {
  children: React.ReactNode;
}

const CardFooter: React.FC<CardFooterProps> = ({ children }) => (
  <div className="p-4 border-t border-gray-200 bg-gray-50 dark:bg-[#2D3A45] dark:border-gray-700">
    {children}
  </div>
);

// Main Card Component Props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional content for the card header. */
  header?: React.ReactNode;
  /** Content for the main body of the card. */
  children: React.ReactNode;
  /** Optional content for the card footer. */
  footer?: React.ReactNode;
  /** ARIA label for accessibility, describing the card's purpose. */
  ariaLabel: string;
  /** Optional custom class names for the main card container. */
  className?: string;
}

/**
 * A reusable card container with optional header, body, and footer sections.
 * Styled with Tailwind CSS and Sevensa branding colors.
 */
const Card: React.FC<CardProps> = ({
  header,
  children,
  footer,
  ariaLabel,
  className = '',
  ...rest
}) => {
  // Base styles for the card container
  // Responsive design is inherent in Tailwind's utility-first approach (e.g., max-w-full on small screens)
  const baseClasses = 'flex flex-col rounded-lg shadow-lg overflow-hidden bg-white dark:bg-[#2D3A45] transition-all duration-300';
  
  // Combine base and custom classes
  const cardClasses = `${baseClasses} ${className}`;

  return (
    <div
      className={cardClasses}
      // Use role="region" for a perceivable section of content, and aria-label for its name
      role="region"
      aria-label={ariaLabel}
      {...rest}
    >
      {/* Header Section */}
      {header && <CardHeader>{header}</CardHeader>}

      {/* Body Section (Main Content) */}
      <CardBody>{children}</CardBody>

      {/* Footer Section */}
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  );
};

export default Card;