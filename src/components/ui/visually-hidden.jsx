import * as React from "react"
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"

function VisuallyHidden({
  ...props
}) {
  return <VisuallyHiddenPrimitive.Root {...props} />;
}

export { VisuallyHidden }
