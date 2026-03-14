// ActivityStyles.ts — glassmorphism theme

export const activityStyles = {
    card: {
      base: [
        "w-full mb-1.5 rounded-xl list-none",
        "px-2.5 py-2",
        "border transition-all duration-200 ease-out",
        "cursor-pointer",
      ].join(" "),
      selected: [
        "border-cyan-400/25",
        // Solid tinted bg — no backdrop-blur so no compositing rectangle bleed
        "bg-[rgba(12,28,46,0.96)]",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_18px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(34,211,238,0.10)]",
        "text-slate-50",
      ].join(" "),
      unselected: [
        "border-white/[0.06]",
        "bg-[rgba(15,23,42,0.55)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        "hover:border-white/[0.10]",
        "hover:bg-[rgba(15,23,42,0.72)]",
        "text-slate-200",
      ].join(" "),
    },
  
    menu: {
      container: "relative",
      button: [
        "flex items-center justify-center w-6 h-6 rounded-md",
        "text-slate-500 hover:text-slate-200",
        "hover:bg-slate-700/50",
        "transition-all duration-150 focus:outline-none",
      ].join(" "),
      dropdown: [
        "absolute z-50 right-0 top-full mt-1 w-32 py-1 rounded-xl overflow-hidden",
        "backdrop-blur-2xl",
        "border border-slate-700/40",
        "shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]",
      ].join(" "),
      dropdownBg: "rgba(8,14,28,0.92)",
      item: [
        "flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-slate-300",
        "hover:bg-slate-700/50 hover:text-white",
        "transition-colors duration-100 focus:outline-none",
      ].join(" "),
      deleteItem: [
        "flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-red-400",
        "hover:bg-red-500/15 hover:text-red-300",
        "transition-colors duration-100 focus:outline-none",
      ].join(" "),
    },
  
    input: {
      edit: [
        "text-white rounded-lg px-2 py-0.5 text-xs w-full",
        "bg-slate-900/70 backdrop-blur",
        "border border-cyan-500/60",
        "focus:outline-none focus:border-cyan-400",
        "shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]",
      ].join(" "),
    },
  
    name: {
      display: "block font-semibold text-[0.78rem] truncate w-full cursor-text leading-snug",
    },
  } as const;
  
  export const activityConstants = {
    menuEllipsis: "···",
    defaultName: "New Request",
    copySuffix: " (copy)",
    renameTooltip: " (Double-click to rename)",
  } as const;