export const COMP_ID_PLACEHOLDER = '<%= compId %>';
const COMP_ID_PLACEHOLDER_REGEX = new RegExp(COMP_ID_PLACEHOLDER, 'g');
export const replaceCompIdPlaceholder = (str, compId) => str.replace(COMP_ID_PLACEHOLDER_REGEX, compId);
export const replaceCompIdPlaceholderInSvgContent = (vectorImageProps, id) => {
    if (vectorImageProps && vectorImageProps.svgContent) {
        vectorImageProps.svgContent = replaceCompIdPlaceholder(vectorImageProps.svgContent, id);
    }
};
export const getFilterEffectStyle = (id, filterEffectSvgUrl) => {
    return filterEffectSvgUrl ?
        {
            '--filter-effect-svg-url': replaceCompIdPlaceholder(filterEffectSvgUrl, id),
        } :
        {};
};
export const replaceContentIds = (svg, compId) => {
    const idMap = {};
    // need to account for compId placeholder `<%= compId %>`
    const result = svg.replace(/\sid="([^"<]+)"/g, (match, id) => {
        const unique = id.endsWith(compId) ? id : `${id}_${compId}`;
        idMap[id] = unique;
        return ` id="${unique}"`;
    });
    return Object.keys(idMap).reduce((current, key) => current.replace(new RegExp(`(${key})(?!_${compId})`, 'g'), idMap[key]), result);
};
//# sourceMappingURL=vectorImageUtils.js.map