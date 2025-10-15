import * as React from "react"

const Label = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label
    className={className}
    {...props}
    ref={ref}
  />
))
Label.displayName = "Label"

export { Label }
