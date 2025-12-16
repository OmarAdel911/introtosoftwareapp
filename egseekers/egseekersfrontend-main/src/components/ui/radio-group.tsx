"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  defaultValue?: string
  required?: boolean
  onValueChange?: (value: string) => void
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, name, defaultValue, required, onValueChange, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue || "")

    const handleChange = (newValue: string) => {
      setValue(newValue)
      if (onValueChange) {
        onValueChange(newValue)
      }
    }

    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        aria-required={required}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioGroupItemProps>(child)) {
            return React.cloneElement(child, {
              name,
              required,
              checked: child.props.value === value,
              onChange: () => handleChange(child.props.value || ""),
            })
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name?: string
  required?: boolean
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, name, required, value, ...props }, ref) => {
    return (
      <input
        type="radio"
        ref={ref}
        name={name}
        value={value}
        required={required}
        className={cn(
          "h-4 w-4 rounded-full border border-gray-300 text-primary focus:ring-primary",
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem } 