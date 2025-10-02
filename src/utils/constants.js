/**
 * Constants for Media Flight Planner
 * Includes default data and reusable Tailwind class strings
 */

// Default tactic data (fallback if API fails)
export const defaultTacticData = [
    { category: "Email Marketing", product: "Email Marketing", subProduct: "1:1 Marketing", rate: "$24.00", kpi: "CPM" },
    { category: "Email Marketing", product: "Email Marketing", subProduct: "B2B (Business Targeting)", rate: "$24.00", kpi: "CPM" },
    { category: "Email Marketing", product: "Email Marketing", subProduct: "B2C (Consumer Targeting)", rate: "$30.00", kpi: "CPM" },
    { category: "Programmatic", product: "Programmatic Audio", subProduct: "AAT", rate: "$25.00", kpi: "CPM" },
    { category: "Programmatic", product: "Programmatic Audio", subProduct: "RON", rate: "$25.00", kpi: "CPM" },
    { category: "Programmatic", product: "Addressable Solutions", subProduct: "CTV", rate: "$35.00", kpi: "CPM" },
    { category: "Programmatic", product: "Addressable Solutions", subProduct: "Local CTV", rate: "$35.00", kpi: "CPM" },
    { category: "Programmatic", product: "Blended Tactics", subProduct: "Standard", rate: "$15.00", kpi: "CPM" },
    { category: "Programmatic", product: "STV", subProduct: "Local", rate: "$35.00", kpi: "CPM" },
    { category: "Programmatic", product: "YouTube", subProduct: "TrueView", rate: "$0.05", kpi: "CPV" },
    { category: "Programmatic", product: "YouTube", subProduct: "Bumper", rate: "$15.00", kpi: "CPM" },
    { category: "Programmatic", product: "YouTube", subProduct: "Shorts", rate: "$12.00", kpi: "CPM" },
    { category: "Social", product: "Meta", subProduct: "Facebook", rate: "$8.00", kpi: "CPM" },
    { category: "Social", product: "Meta", subProduct: "Instagram", rate: "$10.00", kpi: "CPM" },
    { category: "Social", product: "Snapchat", subProduct: "Standard", rate: "$12.00", kpi: "CPM" },
    { category: "Social", product: "TikTok", subProduct: "Standard", rate: "$15.00", kpi: "CPM" },
    { category: "Social", product: "Twitter", subProduct: "Standard", rate: "$8.00", kpi: "CPM" },
    { category: "Social", product: "Pinterest", subProduct: "Standard", rate: "$10.00", kpi: "CPM" },
    { category: "Social", product: "LinkedIn", subProduct: "Standard", rate: "$18.00", kpi: "CPM" },
    { category: "Google", product: "SEM", subProduct: "Search", rate: "$2.50", kpi: "CPLC" },
    { category: "Google", product: "SEM", subProduct: "Display", rate: "$8.00", kpi: "CPM" },
    { category: "Google", product: "Spark", subProduct: "Standard", rate: "$12.00", kpi: "CPM" },
    { category: "Local Display", product: "CPM Display", subProduct: "Standard", rate: "$8.00", kpi: "CPM" },
    { category: "Local Display", product: "Takeovers", subProduct: "Homepage", rate: "$25.00", kpi: "CPM" },
    { category: "Local Display", product: "Sponsorship", subProduct: "Standard", rate: "$15.00", kpi: "CPM" }
];

// Tailwind class strings for consistent styling
export const tableStyles = {
    // Table elements
    th: "border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900",
    td: "border border-gray-200 px-4 py-3 text-sm text-gray-900",
    tdCenter: "border border-gray-200 px-4 py-3 text-sm text-gray-900 text-center",

    // Row states
    row: "hover:bg-gray-50",
    rowChild: "bg-gray-50",
    rowSelected: "bg-blue-100",
    rowHoverSelectable: "cursor-pointer hover:bg-blue-100",

    // Input styles
    input: "w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    inputLocked: "bg-gray-100 border-gray-200 cursor-not-allowed",
    inputNormal: "border-gray-300",

    // Button styles
    button: "px-2 py-1 text-xs border rounded",
    buttonPrimary: "text-blue-600 hover:text-blue-800",
    buttonDanger: "text-red-600 hover:text-red-800",
    buttonSuccess: "text-green-600 hover:text-green-800",

    // Footer styles
    footer: "sticky bottom-0 bg-white z-10 border-t-2 border-gray-400",
    footerCell: "border border-gray-200 px-4 py-3 font-bold text-sm text-gray-900",
};

// Template types
export const TEMPLATE_TYPES = {
    PROGRAMMATIC: 'programmatic',
    YOUTUBE: 'youtube',
    SEM_SOCIAL: 'sem-social',
    FULL: 'full'
};

// Lock types
export const LOCK_TYPES = {
    ALL: 'all',
    BUDGET: 'budget',
    IMPRESSIONS: 'impressions',
    NONE: null
};

// Get template type based on selected tactic
export const getTemplateType = (tacticString, tacticData) => {
    if (!tacticString) return null;

    const selectedTactic = tacticData.find(t =>
        `${t.product} - ${t.subProduct}` === tacticString
    );

    if (!selectedTactic) return null;

    if (selectedTactic.product === 'YouTube') return TEMPLATE_TYPES.YOUTUBE;
    if (selectedTactic.product === 'Spark') return TEMPLATE_TYPES.SEM_SOCIAL;
    if (selectedTactic.category === 'Google' || selectedTactic.category === 'Social') {
        return TEMPLATE_TYPES.SEM_SOCIAL;
    }
    return TEMPLATE_TYPES.PROGRAMMATIC;
};
