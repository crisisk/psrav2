// Stub for form components
import * as React from "react"

// Mock FormControl component
export const FormControl = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

// Mock Form component
export const Form = ({ children, ...props }: React.ComponentPropsWithoutRef<'form'>) => (
  <form {...props}>{children}</form>
)

// Mock FormField component
// We use a generic component that accepts all props to satisfy react-hook-form
export const FormField = (props: any) => {
  // This is a minimal stub. In a real app, this would use Controller from react-hook-form.
  // For now, we just render the children from the render prop.
  return <>{props.render({ field: {} })}</>;
}

// Mock FormItem component
export const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">{children}</div>
)

// Mock FormLabel component
export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700">{children}</label>
)

// Mock FormMessage component
export const FormMessage = ({ children }: { children?: React.ReactNode }) => (
  <p className="text-sm font-medium text-red-500">{children}</p>
)

