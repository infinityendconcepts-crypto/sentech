import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-600",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700",
          success: "group-[.toast]:text-emerald-700",
          error: "group-[.toast]:text-red-700",
          warning: "group-[.toast]:text-amber-700",
          info: "group-[.toast]:text-blue-700",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
