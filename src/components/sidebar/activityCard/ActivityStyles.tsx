// Common styles for activity components
export const activityStyles = {
    // Card styles
    card: {
        base: "w-full p-1 border-b border-gray-600 transition duration-150 ease-in-out hover:bg-gray-800 cursor-pointer",
        selected: "bg-[#24243af8] text-white",
        unselected: "bg-accent"
    },

    // Menu styles
    menu: {
        container: "relative w-full flex justify-end",
        button: "text-white text-xl px-2 py-1 rounded hover:bg-[#24243af8]",
        dropdown: "absolute z-10 mt-2 w-28 right-0 bg-[#24243af8] rounded shadow-lg border border-gray-200",
        item: "block w-full text-left px-4 py-2 text-sm hover:bg-cyan-800",
        deleteItem: "block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-cyan-800"
    },

    // Input styles
    input: {
        edit: " text-white rounded px-1 py-0.5 text-sm w-32 border border-cyan-500 focus:outline-none focus:border-cyan-300"
    },

    // Name styles
    name: {
        display: "block font-bold text-sm truncate max-w-full px-1 cursor-text"
    }
} as const;

// Common constants
export const activityConstants = {
    menuEllipsis: "…", // Unicode for horizontal ellipsis
    defaultName: "New Request",
    copySuffix: " (copy)",
    renameTooltip: " (Double-click to rename)"
} as const; 